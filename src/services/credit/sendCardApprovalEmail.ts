import { formatCurrencyBrl } from "@/lib/credit/helpers";
import { prisma } from "@/lib/db/prisma";
import { buildCardIssuanceUrl, ensureCardIssuanceToken } from "@/services/credit/cardIssuance";

const DEFAULT_APPROVAL_EMAIL_FROM = "naoresponda@credpagos.com.br";
const APPROVAL_EMAIL_SUBJECT = "Crédito aprovado | Credpagos";
const DEFAULT_APPROVAL_EMAIL_DELAY_MINUTES = 10;
const STALE_EMAIL_SEND_MINUTES = 15;
const MAX_BACKGROUND_TIMER_MS = 2_147_000_000;

type SendCardApprovalEmailOptions = {
  baseUrl?: string;
  now?: Date;
};

const globalApprovalEmailTimers = globalThis as typeof globalThis & {
  __credpagosApprovalEmailTimers?: Map<string, ReturnType<typeof setTimeout>>;
};

function getMailerConfig() {
  const apiKey = (process.env.CREDPAGOS_RESEND_API_KEY ?? process.env.RESEND_API_KEY)?.trim();
  const endpoint = process.env.CREDPAGOS_RESEND_EMAILS_ENDPOINT?.trim() || "https://api.resend.com/emails";
  const from = getApprovalEmailFrom();

  return {
    apiKey,
    endpoint,
    from,
  };
}

function getApprovalEmailFrom() {
  return (
    process.env.CREDPAGOS_RESEND_FROM_EMAIL?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    DEFAULT_APPROVAL_EMAIL_FROM
  );
}

async function sendEmailWithResend(input: {
  idempotencyKey: string;
  to: string;
  subject: string;
  text: string;
}) {
  const config = getMailerConfig();
  if (!config.apiKey) {
    throw new Error("RESEND_API_KEY_NOT_CONFIGURED");
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from: config.from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`RESEND_SEND_FAILED:${response.status}:${body.slice(0, 500)}`);
  }
}

function sanitizeLine(value: string | null | undefined, fallback = "-") {
  const sanitized = String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();

  return sanitized || fallback;
}

function getApprovalEmailDelayMs() {
  const configuredMinutes = process.env.CREDPAGOS_APPROVAL_EMAIL_DELAY_MINUTES?.trim();
  const minutes = configuredMinutes ? Number(configuredMinutes) : DEFAULT_APPROVAL_EMAIL_DELAY_MINUTES;

  if (!Number.isFinite(minutes) || minutes < 0) {
    return DEFAULT_APPROVAL_EMAIL_DELAY_MINUTES * 60_000;
  }

  return Math.round(minutes * 60_000);
}

function getStaleEmailSendCutoff(now: Date) {
  return new Date(now.getTime() - STALE_EMAIL_SEND_MINUTES * 60_000);
}

function getApprovalEmailTimers() {
  if (!globalApprovalEmailTimers.__credpagosApprovalEmailTimers) {
    globalApprovalEmailTimers.__credpagosApprovalEmailTimers = new Map();
  }

  return globalApprovalEmailTimers.__credpagosApprovalEmailTimers;
}

export function getCardApprovalEmailScheduledAt(from = new Date()) {
  return new Date(from.getTime() + getApprovalEmailDelayMs());
}

function buildApprovedEmailText(input: {
  customerName: string;
  protocol: string;
  monthlyIncome: number;
  approvedLimit: number;
  issuanceUrl: string;
}) {
  const approvedLimit = formatCurrencyBrl(input.approvedLimit);
  const monthlyIncome = formatCurrencyBrl(input.monthlyIncome);

  return [
    `Olá, ${sanitizeLine(input.customerName, "cliente")}.`,
    "",
    "Temos uma ótima notícia: após a análise das informações enviadas, seu crédito foi aprovado pela Credpagos.",
    "",
    `Seu limite inicial aprovado é de ${approvedLimit}.`,
    "",
    "Esse limite foi definido com base nas informações enviadas durante a análise do perfil.",
    "",
    "Para dar continuidade ao processo e emitir seu cartão, acesse seu link exclusivo:",
    input.issuanceUrl,
    "",
    "Nesse ambiente seguro você poderá confirmar a emissão do cartão e realizar o pagamento da taxa de emissão + frete.",
    "",
    "Este link é individual e foi gerado exclusivamente para a sua solicitação.",
    "",
    "Dados da solicitação:",
    `Protocolo: ${sanitizeLine(input.protocol)}`,
    `Renda informada: ${monthlyIncome}`,
    `Limite inicial aprovado: ${approvedLimit}`,
    "",
    "Importante: a aprovação está sujeita à validação final dos dados, documentos e condições disponíveis no momento da formalização.",
    "",
    "Atenciosamente,",
    "Equipe de Análise Credpagos",
    getApprovalEmailFrom(),
  ].join("\n");
}

export function queueCardApprovalEmailDispatch(
  cardRequestId: string,
  scheduledAt: Date,
  options: Pick<SendCardApprovalEmailOptions, "baseUrl"> = {},
) {
  const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());

  if (delayMs > MAX_BACKGROUND_TIMER_MS) {
    return;
  }

  const timers = getApprovalEmailTimers();
  if (timers.has(cardRequestId)) {
    return;
  }

  const timeout = setTimeout(async () => {
    timers.delete(cardRequestId);

    try {
      await sendCardApprovalEmailOnce(cardRequestId, {
        baseUrl: options.baseUrl,
      });
    } catch (error) {
      console.error("[card-approval-email] delayed send failed", {
        cardRequestId,
        error,
      });
    }
  }, delayMs);

  if (typeof timeout === "object" && "unref" in timeout && typeof timeout.unref === "function") {
    timeout.unref();
  }

  timers.set(cardRequestId, timeout);
}

export async function scheduleCardApprovalEmailOnce(
  cardRequestId: string,
  options: Pick<SendCardApprovalEmailOptions, "baseUrl"> = {},
) {
  const request = await prisma.cardCreditRequest.findUnique({
    where: {
      id: cardRequestId,
    },
    select: {
      id: true,
      status: true,
      approvalEmailScheduledAt: true,
      approvalEmailSentAt: true,
    },
  });

  if (!request) {
    throw new Error("CARD_CREDIT_REQUEST_NOT_FOUND");
  }

  if (request.status !== "APPROVED" || request.approvalEmailSentAt) {
    return {
      scheduled: false,
      skipped: true,
      scheduledAt: request.approvalEmailScheduledAt,
    };
  }

  const scheduledAt = request.approvalEmailScheduledAt ?? getCardApprovalEmailScheduledAt();

  if (!request.approvalEmailScheduledAt) {
    await prisma.cardCreditRequest.updateMany({
      where: {
        id: request.id,
        approvalEmailScheduledAt: null,
        approvalEmailSentAt: null,
      },
      data: {
        approvalEmailScheduledAt: scheduledAt,
        approvalEmailError: null,
      },
    });
  }

  queueCardApprovalEmailDispatch(request.id, scheduledAt, options);

  return {
    scheduled: true,
    skipped: false,
    scheduledAt,
  };
}

export async function sendCardApprovalEmailOnce(
  cardRequestId: string,
  options: SendCardApprovalEmailOptions = {},
) {
  const now = options.now ?? new Date();
  const request = await prisma.cardCreditRequest.findUnique({
    where: {
      id: cardRequestId,
    },
  });

  if (!request) {
    throw new Error("CARD_CREDIT_REQUEST_NOT_FOUND");
  }

  if (request.status !== "APPROVED") {
    return {
      sent: false,
      skipped: true,
    };
  }

  const scheduledAt = request.approvalEmailScheduledAt ?? getCardApprovalEmailScheduledAt(request.createdAt);

  if (!request.approvalEmailScheduledAt) {
    await prisma.cardCreditRequest.updateMany({
      where: {
        id: request.id,
        approvalEmailScheduledAt: null,
        approvalEmailSentAt: null,
      },
      data: {
        approvalEmailScheduledAt: scheduledAt,
      },
    });
  }

  if (scheduledAt > now) {
    queueCardApprovalEmailDispatch(request.id, scheduledAt, {
      baseUrl: options.baseUrl,
    });

    return {
      sent: false,
      skipped: true,
      scheduledAt,
    };
  }

  const staleSendingCutoff = getStaleEmailSendCutoff(now);
  const hasActiveEmailSend = request.approvalEmailSendingAt && request.approvalEmailSendingAt > staleSendingCutoff;

  if (request.approvalEmailSentAt || hasActiveEmailSend) {
    return {
      sent: false,
      skipped: true,
    };
  }

  const claim = await prisma.cardCreditRequest.updateMany({
    where: {
      id: request.id,
      approvalEmailSentAt: null,
      OR: [
        { approvalEmailSendingAt: null },
        { approvalEmailSendingAt: { lt: staleSendingCutoff } },
      ],
    },
    data: {
      approvalEmailScheduledAt: scheduledAt,
      approvalEmailSendingAt: now,
      approvalEmailError: null,
    },
  });

  if (!claim.count) {
    return {
      sent: false,
      skipped: true,
    };
  }

  try {
    const issuanceToken = await ensureCardIssuanceToken(request.id);
    const issuanceUrl = buildCardIssuanceUrl(issuanceToken, options.baseUrl);
    const text = buildApprovedEmailText({
      customerName: request.fullName,
      protocol: request.protocol,
      monthlyIncome: request.monthlyIncome,
      approvedLimit: request.approvedLimit,
      issuanceUrl,
    });

    await sendEmailWithResend({
      idempotencyKey: `card-approval-${request.id}`,
      to: request.email,
      subject: APPROVAL_EMAIL_SUBJECT,
      text,
    });

    await prisma.cardCreditRequest.update({
      where: {
        id: request.id,
      },
      data: {
        approvalEmailSentAt: new Date(),
        approvalEmailSendingAt: null,
        approvalEmailError: null,
      },
    });

    return {
      sent: true,
      skipped: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida ao enviar e-mail.";

    await prisma.cardCreditRequest.update({
      where: {
        id: request.id,
      },
      data: {
        approvalEmailSendingAt: null,
        approvalEmailError: message.slice(0, 1000),
      },
    });

    throw error;
  }
}

export async function processDueCardApprovalEmails(options: {
  baseUrl?: string;
  limit?: number;
  now?: Date;
} = {}) {
  const now = options.now ?? new Date();
  const limit = Math.min(Math.max(Math.trunc(options.limit ?? 25), 1), 100);
  const staleSendingCutoff = getStaleEmailSendCutoff(now);
  const legacyScheduleCutoff = new Date(now.getTime() - getApprovalEmailDelayMs());
  const dueRequests = await prisma.cardCreditRequest.findMany({
    where: {
      status: "APPROVED",
      approvalEmailSentAt: null,
      AND: [
        {
          OR: [
            {
              approvalEmailScheduledAt: {
                lte: now,
              },
            },
            {
              approvalEmailScheduledAt: null,
              createdAt: {
                lte: legacyScheduleCutoff,
              },
            },
          ],
        },
        {
          OR: [
            { approvalEmailSendingAt: null },
            { approvalEmailSendingAt: { lt: staleSendingCutoff } },
          ],
        },
      ],
    },
    orderBy: {
      approvalEmailScheduledAt: "asc",
    },
    select: {
      id: true,
      protocol: true,
    },
    take: limit,
  });

  const result = {
    processed: dueRequests.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [] as Array<{ cardRequestId: string; protocol: string; error: string }>,
  };

  for (const dueRequest of dueRequests) {
    try {
      const emailResult = await sendCardApprovalEmailOnce(dueRequest.id, {
        baseUrl: options.baseUrl,
        now,
      });

      if (emailResult.sent) {
        result.sent += 1;
      } else {
        result.skipped += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha desconhecida ao enviar e-mail.";

      console.error("[card-approval-email] due email failed", {
        cardRequestId: dueRequest.id,
        protocol: dueRequest.protocol,
        error,
      });

      result.failed += 1;
      result.errors.push({
        cardRequestId: dueRequest.id,
        protocol: dueRequest.protocol,
        error: message.slice(0, 1000),
      });
    }
  }

  return result;
}

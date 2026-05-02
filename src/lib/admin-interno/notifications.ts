import { InternalNotificationDeliveryStatus, InternalNotificationJobStatus } from "@prisma/client";
import nodemailer from "nodemailer";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import { getLeadEmailDisplay } from "@/lib/admin-interno/lead-email";
import {
  INTERNAL_NOTIFICATION_MAX_ATTEMPTS,
  INTERNAL_NOTIFICATION_RETRY_MINUTES,
} from "@/lib/admin-interno/constants";
import { sanitizeLongText, sanitizeText } from "@/lib/admin-interno/sanitize";
import { prisma } from "@/lib/db/prisma";

let transporter: nodemailer.Transporter | null = null;

function getMailerConfig() {
  const host = process.env.INTERNAL_SMTP_HOST?.trim();
  const port = Number(process.env.INTERNAL_SMTP_PORT ?? "587");
  const user = process.env.INTERNAL_SMTP_USER?.trim();
  const pass = process.env.INTERNAL_SMTP_PASS;
  const from = process.env.INTERNAL_ALERT_FROM?.trim();
  const secure = String(process.env.INTERNAL_SMTP_SECURE ?? "false").toLowerCase() === "true";

  return {
    host,
    port,
    user,
    pass,
    from,
    secure,
  };
}

export function isNotificationEmailConfigured() {
  const config = getMailerConfig();
  return Boolean(config.host && config.port && config.user && config.pass && config.from);
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const config = getMailerConfig();
  if (!config.host || !config.user || !config.pass || !config.from) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return transporter;
}

function getRetryDelayMinutes(attempt: number) {
  return INTERNAL_NOTIFICATION_RETRY_MINUTES[Math.min(attempt, INTERNAL_NOTIFICATION_RETRY_MINUTES.length - 1)] ?? 180;
}

function buildLeadEmailText(input: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  source: string | null;
  message: string | null;
  createdAt: Date;
}) {
  return [
    "Novo lead recebido na dashboard interna.",
    "",
    `ID: ${input.id}`,
    `Nome: ${sanitizeText(input.name, 120)}`,
    `Email: ${getLeadEmailDisplay(sanitizeText(input.email, 254))}`,
    `Telefone: ${sanitizeText(input.phone, 32) || "-"}`,
    `Empresa: ${sanitizeText(input.company, 160) || "-"}`,
    `Origem: ${sanitizeText(input.source, 120) || "-"}`,
    `Recebido em: ${input.createdAt.toISOString()}`,
    "",
    "Mensagem:",
    sanitizeLongText(input.message, 900) || "(sem mensagem)",
  ].join("\n");
}

export async function enqueueLeadNotifications(leadId: string) {
  const recipients = await prisma.notificationRecipient.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!recipients.length) {
    return { queued: 0 };
  }

  await prisma.notificationJob.createMany({
    data: recipients.map((recipient) => ({
      leadId,
      recipientId: recipient.id,
      status: InternalNotificationJobStatus.PENDING,
      attempts: 0,
      maxAttempts: INTERNAL_NOTIFICATION_MAX_ATTEMPTS,
      nextAttemptAt: new Date(),
    })),
  });

  return {
    queued: recipients.length,
  };
}

async function markNotificationResult(input: {
  jobId: string;
  leadId: string;
  recipientId: string;
  attempt: number;
  sent: boolean;
  errorMessage?: string;
}) {
  await prisma.notificationLog.create({
    data: {
      leadId: input.leadId,
      recipientId: input.recipientId,
      status: input.sent
        ? InternalNotificationDeliveryStatus.SENT
        : InternalNotificationDeliveryStatus.FAILED,
      attempt: input.attempt,
      provider: "smtp",
      errorMessage: input.errorMessage ? sanitizeText(input.errorMessage, 500) : null,
      sentAt: input.sent ? new Date() : null,
    },
  });

  await writeAuditLog({
    actorId: null,
    action: input.sent ? "NOTIFICATION_SENT" : "NOTIFICATION_FAILED",
    entityType: "notification_job",
    entityId: input.jobId,
    context: {
      leadId: input.leadId,
      recipientId: input.recipientId,
      attempt: input.attempt,
      errorMessage: input.errorMessage ? sanitizeText(input.errorMessage, 240) : null,
    },
  });
}

export async function processPendingNotificationJobs(limit = 25) {
  if (!isNotificationEmailConfigured()) {
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      reason: "EMAIL_NOT_CONFIGURED",
    };
  }

  const now = new Date();
  const jobs = await prisma.notificationJob.findMany({
    where: {
      status: {
        in: [InternalNotificationJobStatus.PENDING, InternalNotificationJobStatus.FAILED],
      },
      nextAttemptAt: {
        lte: now,
      },
    },
    orderBy: {
      nextAttemptAt: "asc",
    },
    take: Math.max(1, Math.min(100, limit)),
    include: {
      recipient: true,
      lead: true,
    },
  });

  if (!jobs.length) {
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    };
  }

  const mailer = getTransporter();

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const job of jobs) {
    const claimed = await prisma.notificationJob.updateMany({
      where: {
        id: job.id,
        status: {
          in: [InternalNotificationJobStatus.PENDING, InternalNotificationJobStatus.FAILED],
        },
      },
      data: {
        status: InternalNotificationJobStatus.PROCESSING,
        lockedAt: new Date(),
      },
    });

    if (!claimed.count) {
      skipped += 1;
      continue;
    }

    const attempt = job.attempts + 1;

    try {
      const from = process.env.INTERNAL_ALERT_FROM as string;
      const subject = `[Credpagos] Novo lead: ${sanitizeText(job.lead.name, 80)}`;
      const body = buildLeadEmailText({
        id: job.lead.id,
        name: job.lead.name,
        email: job.lead.email,
        phone: job.lead.phone,
        company: job.lead.company,
        source: job.lead.source,
        message: job.lead.message,
        createdAt: job.lead.createdAt,
      });

      await mailer.sendMail({
        from,
        to: job.recipient.email,
        subject,
        text: body,
      });

      await prisma.notificationJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: InternalNotificationJobStatus.SENT,
          attempts: attempt,
          lockedAt: null,
          lastTriedAt: new Date(),
          lastError: null,
        },
      });

      await markNotificationResult({
        jobId: job.id,
        leadId: job.leadId,
        recipientId: job.recipientId,
        attempt,
        sent: true,
      });

      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha desconhecida no envio";
      const shouldDie = attempt >= job.maxAttempts;
      const nextAttemptAt = shouldDie
        ? null
        : new Date(Date.now() + getRetryDelayMinutes(attempt - 1) * 60_000);

      await prisma.notificationJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: shouldDie ? InternalNotificationJobStatus.DEAD : InternalNotificationJobStatus.FAILED,
          attempts: attempt,
          lockedAt: null,
          lastTriedAt: new Date(),
          lastError: sanitizeText(message, 500),
          nextAttemptAt: nextAttemptAt ?? undefined,
        },
      });

      await markNotificationResult({
        jobId: job.id,
        leadId: job.leadId,
        recipientId: job.recipientId,
        attempt,
        sent: false,
        errorMessage: message,
      });

      failed += 1;
    }
  }

  return {
    processed: jobs.length,
    sent,
    failed,
    skipped,
  };
}

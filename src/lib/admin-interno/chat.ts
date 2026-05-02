import {
  ChatConversationPriority,
  ChatConversationStatus,
  ChatMessageSenderType,
  Prisma,
} from "@prisma/client";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import { parseAnalyticsUserAgent } from "@/lib/admin-interno/analytics-shared";
import {
  CHAT_ADMIN_MESSAGE_MAX_LENGTH,
  CHAT_PROTOCOL_MAX_PHONE_DIGITS,
  CHAT_PROTOCOL_MIN_PHONE_DIGITS,
  CHAT_PROTOCOL_PROMPT_NAME,
  CHAT_PROTOCOL_PROMPT_NAME_RETRY,
  CHAT_PROTOCOL_PROMPT_IDLE_WARNING_2_MIN,
  CHAT_PROTOCOL_PROMPT_IDLE_WARNING_5_MIN,
  CHAT_PROTOCOL_PROMPT_IDLE_WARNING_8_MIN,
  CHAT_PROTOCOL_PROMPT_PHONE,
  CHAT_PROTOCOL_PROMPT_PHONE_RETRY,
  CHAT_PROTOCOL_PROMPT_READY,
  CHAT_PROTOCOL_PROMPT_TIMEOUT,
  CHAT_PUBLIC_MESSAGE_MAX_LENGTH,
  CHAT_VISITOR_IDLE_TIMEOUT_MS,
} from "@/lib/admin-interno/constants";
import {
  sanitizeEmail,
  sanitizeLongText,
  sanitizePath,
  sanitizePhone,
  sanitizeText,
} from "@/lib/admin-interno/sanitize";
import { generateOpaqueToken, sha256 } from "@/lib/admin-interno/security";
import { prisma } from "@/lib/db/prisma";

type PublicChatProfileInput = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  sourcePage?: string | null;
  campaign?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
};

type EnsurePublicConversationInput = {
  visitorToken?: string | null;
  profile?: PublicChatProfileInput | null;
  ipMasked?: string | null;
  userAgent?: string | null;
  analyticsExternalVisitorId?: string | null;
  analyticsExternalSessionId?: string | null;
};

type ConversationListFilters = {
  page?: number;
  pageSize?: number;
  status?: ChatConversationStatus;
  assignedToId?: string;
  q?: string;
  onlyUnread?: boolean;
};

type LeadResolverClient = Prisma.TransactionClient | typeof prisma;
type LeadMatchType = "EMAIL" | "PHONE" | "NAME";
type ChatProtocolStep = "ASK_NAME" | "ASK_PHONE" | "READY";
type ChatInactivityWarningRule = {
  remainingMinutes: number;
  triggerMs: number;
  message: string;
};

type ConversationProtocolProjection = {
  visitorName: string | null;
  visitorPhone: string | null;
};

function normalizeVisitorToken(raw: string | null | undefined) {
  const value = String(raw ?? "").trim();
  if (!value) {
    return "";
  }

  if (!/^[A-Za-z0-9_-]{24,180}$/.test(value)) {
    return "";
  }

  return value;
}

function normalizePhoneDigits(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeComparableText(value: string | null | undefined, maxLength = 180) {
  return sanitizeText(value, maxLength)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidProtocolName(value: string | null | undefined) {
  const name = sanitizeText(value, 120);
  if (!name) {
    return false;
  }

  const words = name.split(" ").filter((part) => normalizeComparableText(part, 40).length >= 2);
  if (words.length < 2) {
    return false;
  }

  const lettersOnly = name.replace(/[^A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/g, "");
  return lettersOnly.length >= 5;
}

function isValidProtocolPhone(value: string | null | undefined) {
  const digits = normalizePhoneDigits(value);
  return digits.length >= CHAT_PROTOCOL_MIN_PHONE_DIGITS &&
    digits.length <= CHAT_PROTOCOL_MAX_PHONE_DIGITS;
}

function protocolStepFromFields(
  visitorName: string | null | undefined,
  visitorPhone: string | null | undefined,
): ChatProtocolStep {
  if (!isValidProtocolName(visitorName)) {
    return "ASK_NAME";
  }

  if (!isValidProtocolPhone(visitorPhone)) {
    return "ASK_PHONE";
  }

  return "READY";
}

function getProtocolPrompt(step: ChatProtocolStep, retry: boolean) {
  if (step === "ASK_NAME") {
    return retry ? CHAT_PROTOCOL_PROMPT_NAME_RETRY : CHAT_PROTOCOL_PROMPT_NAME;
  }

  if (step === "ASK_PHONE") {
    return retry ? CHAT_PROTOCOL_PROMPT_PHONE_RETRY : CHAT_PROTOCOL_PROMPT_PHONE;
  }

  return null;
}

function isConversationEligibleForVisitorTimeout(status: ChatConversationStatus) {
  return (
    status === ChatConversationStatus.OPEN ||
    status === ChatConversationStatus.WAITING_VISITOR ||
    status === ChatConversationStatus.WAITING_ATTENDANT
  );
}

function getInactivityWarningRules(timeoutMs: number): ChatInactivityWarningRule[] {
  const warningDefinitions: Array<{
    remainingMinutes: number;
    message: string;
  }> = [
    {
      remainingMinutes: 8,
      message: CHAT_PROTOCOL_PROMPT_IDLE_WARNING_8_MIN,
    },
    {
      remainingMinutes: 5,
      message: CHAT_PROTOCOL_PROMPT_IDLE_WARNING_5_MIN,
    },
    {
      remainingMinutes: 2,
      message: CHAT_PROTOCOL_PROMPT_IDLE_WARNING_2_MIN,
    },
  ];

  const safeTimeoutMs = Math.max(1, timeoutMs);
  const rules = warningDefinitions
    .map((item) => ({
      remainingMinutes: item.remainingMinutes,
      triggerMs: safeTimeoutMs - item.remainingMinutes * 60_000,
      message: item.message,
    }))
    .filter((item) => item.triggerMs > 0 && item.triggerMs < safeTimeoutMs)
    .sort((a, b) => a.triggerMs - b.triggerMs);

  return rules;
}

function sanitizeProfile(profile: PublicChatProfileInput | null | undefined) {
  const name = sanitizeText(profile?.name, 120) || null;
  const email = sanitizeEmail(profile?.email) || null;
  const phone = sanitizePhone(profile?.phone) || null;
  const source = sanitizeText(profile?.source, 120) || null;
  const sourcePage = sanitizePath(profile?.sourcePage) || null;
  const campaign = sanitizeText(profile?.campaign, 120) || null;
  const utmSource = sanitizeText(profile?.utm_source, 120) || null;
  const utmMedium = sanitizeText(profile?.utm_medium, 120) || null;
  const utmCampaign = sanitizeText(profile?.utm_campaign, 120) || null;
  const utmContent = sanitizeText(profile?.utm_content, 120) || null;
  const utmTerm = sanitizeText(profile?.utm_term, 120) || null;

  return {
    name,
    email,
    phone,
    source,
    sourcePage,
    campaign,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
  };
}

export function getConversationProtocolState(conversation: ConversationProtocolProjection) {
  const step = protocolStepFromFields(conversation.visitorName, conversation.visitorPhone);
  return {
    step,
    nameCollected: step !== "ASK_NAME",
    phoneCollected: step === "READY",
    isQualifiedForAttendant: step === "READY",
  };
}

async function resolveAnalyticsLink(input: {
  analyticsExternalVisitorId?: string | null;
  analyticsExternalSessionId?: string | null;
}) {
  const [visitor, session] = await Promise.all([
    input.analyticsExternalVisitorId
      ? prisma.analyticsVisitor.findUnique({
          where: {
            externalVisitorId: input.analyticsExternalVisitorId,
          },
          select: {
            id: true,
          },
        })
      : Promise.resolve(null),
    input.analyticsExternalSessionId
      ? prisma.analyticsSession.findUnique({
          where: {
            externalSessionId: input.analyticsExternalSessionId,
          },
          select: {
            id: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return {
    analyticsVisitorId: visitor?.id ?? null,
    analyticsSessionId: session?.id ?? null,
  };
}

async function resolveLeadIdByEmail(client: LeadResolverClient, email: string | null) {
  if (!email) {
    return null;
  }

  const lead = await client.lead.findFirst({
    where: {
      email,
      deletedAt: null,
    },
    select: {
      id: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return lead?.id ?? null;
}

function scoreLeadCandidate(
  candidate: {
    name: string;
    email: string;
    phone: string | null;
  },
  input: {
    email: string | null;
    phone: string | null;
    name: string | null;
  },
) {
  let score = 0;
  let matchType: LeadMatchType | null = null;

  const email = sanitizeEmail(input.email) || null;
  if (email && candidate.email === email) {
    score += 500;
    matchType = "EMAIL";
  }

  const inputPhoneDigits = normalizePhoneDigits(input.phone);
  const candidatePhoneDigits = normalizePhoneDigits(candidate.phone);
  if (inputPhoneDigits && candidatePhoneDigits) {
    if (candidatePhoneDigits === inputPhoneDigits) {
      score += 420;
      matchType = matchType ?? "PHONE";
    } else if (
      inputPhoneDigits.length >= 8 &&
      candidatePhoneDigits.endsWith(inputPhoneDigits.slice(-8))
    ) {
      score += 260;
      matchType = matchType ?? "PHONE";
    } else if (
      inputPhoneDigits.length >= 6 &&
      candidatePhoneDigits.endsWith(inputPhoneDigits.slice(-6))
    ) {
      score += 120;
      matchType = matchType ?? "PHONE";
    }
  }

  const targetName = normalizeComparableText(input.name, 120);
  if (targetName) {
    const candidateName = normalizeComparableText(candidate.name, 120);
    const targetParts = targetName.split(" ");
    const firstPart = targetParts[0] ?? "";
    const lastPart = targetParts[targetParts.length - 1] ?? "";

    if (candidateName === targetName) {
      score += 210;
      matchType = matchType ?? "NAME";
    } else if (
      targetParts.length >= 2 &&
      candidateName.includes(firstPart) &&
      candidateName.includes(lastPart)
    ) {
      score += 140;
      matchType = matchType ?? "NAME";
    } else if (firstPart.length >= 3 && candidateName.includes(firstPart)) {
      score += 60;
      matchType = matchType ?? "NAME";
    }
  }

  return {
    score,
    matchType,
  };
}

async function resolveLeadMatchByIdentity(
  client: LeadResolverClient,
  input: {
    email: string | null;
    phone: string | null;
    name: string | null;
  },
) {
  const email = sanitizeEmail(input.email) || null;
  const phone = sanitizePhone(input.phone) || null;
  const name = sanitizeText(input.name, 120) || null;

  if (email) {
    const leadId = await resolveLeadIdByEmail(client, email);
    if (leadId) {
      return {
        leadId,
        matchType: "EMAIL" as LeadMatchType,
      };
    }
  }

  const whereOr: Prisma.LeadWhereInput[] = [];
  const phoneDigits = normalizePhoneDigits(phone);
  const comparableName = normalizeComparableText(name, 120);
  if (phoneDigits.length >= 4) {
    whereOr.push({
      phone: {
        contains: phoneDigits.slice(-4),
      },
    });
  }

  const firstNameToken = comparableName.split(" ")[0] ?? "";
  if (firstNameToken.length >= 3) {
    whereOr.push({
      name: {
        contains: firstNameToken,
        mode: "insensitive",
      },
    });
  }

  if (!whereOr.length) {
    return {
      leadId: null,
      matchType: null,
    };
  }

  const candidates = await client.lead.findMany({
    where: {
      deletedAt: null,
      OR: whereOr,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 120,
  });

  let best: {
    leadId: string;
    matchType: LeadMatchType | null;
    score: number;
  } | null = null;

  for (const candidate of candidates) {
    const { score, matchType } = scoreLeadCandidate(candidate, {
      email,
      phone,
      name,
    });

    if (!best || score > best.score) {
      best = {
        leadId: candidate.id,
        matchType,
        score,
      };
    }
  }

  if (!best || best.score < 180) {
    return {
      leadId: null,
      matchType: null,
    };
  }

  return {
    leadId: best.leadId,
    matchType: best.matchType,
  };
}

async function createSystemMessage(
  tx: Prisma.TransactionClient | typeof prisma,
  input: {
    conversationId: string;
    body: string;
    ipMasked?: string | null;
    userAgent?: string | null;
  },
) {
  const now = new Date();
  const text = sanitizeLongText(input.body, CHAT_PUBLIC_MESSAGE_MAX_LENGTH);
  if (!text) {
    return;
  }

  await tx.chatMessage.create({
    data: {
      conversationId: input.conversationId,
      senderType: ChatMessageSenderType.SYSTEM,
      body: text,
      ipMasked: sanitizeText(input.ipMasked, 80) || null,
      userAgent: sanitizeText(input.userAgent, 500) || null,
      readByAdminAt: now,
      readByVisitorAt: now,
    },
  });
}

function publicMessageSelect() {
  return {
    id: true,
    body: true,
    senderType: true,
    createdAt: true,
    senderAdmin: {
      select: {
        id: true,
        fullName: true,
      },
    },
  } as const;
}

export async function ensurePublicConversation(input: EnsurePublicConversationInput) {
  let visitorToken = normalizeVisitorToken(input.visitorToken);
  let isNewToken = false;
  if (!visitorToken) {
    visitorToken = generateOpaqueToken(28);
    isNewToken = true;
  }

  const visitorTokenHash = sha256(visitorToken);
  const profile = sanitizeProfile(input.profile);
  const ipMasked = sanitizeText(input.ipMasked, 80) || null;
  const userAgent = sanitizeText(input.userAgent, 500) || null;
  const analytics = await resolveAnalyticsLink({
    analyticsExternalVisitorId: input.analyticsExternalVisitorId,
    analyticsExternalSessionId: input.analyticsExternalSessionId,
  });
  const leadId = await resolveLeadIdByEmail(prisma, profile.email);

  const existing = await prisma.chatConversation.findUnique({
    where: {
      visitorTokenHash,
    },
    select: {
      id: true,
    },
  });

  const updateData: Prisma.ChatConversationUpdateInput = {
    ...(profile.name ? { visitorName: profile.name } : {}),
    ...(profile.email ? { visitorEmail: profile.email } : {}),
    ...(profile.phone ? { visitorPhone: profile.phone } : {}),
    ...(profile.source ? { source: profile.source } : {}),
    ...(profile.sourcePage ? { sourcePage: profile.sourcePage } : {}),
    ...(profile.campaign ? { campaign: profile.campaign } : {}),
    ...(profile.utmSource ? { utmSource: profile.utmSource } : {}),
    ...(profile.utmMedium ? { utmMedium: profile.utmMedium } : {}),
    ...(profile.utmCampaign ? { utmCampaign: profile.utmCampaign } : {}),
    ...(profile.utmContent ? { utmContent: profile.utmContent } : {}),
    ...(profile.utmTerm ? { utmTerm: profile.utmTerm } : {}),
    ...(ipMasked ? { ipMasked } : {}),
    ...(userAgent ? { userAgent } : {}),
    ...(analytics.analyticsVisitorId ? { analyticsVisitorId: analytics.analyticsVisitorId } : {}),
    ...(analytics.analyticsSessionId ? { analyticsSessionId: analytics.analyticsSessionId } : {}),
    ...(leadId ? { leadId } : {}),
  };

  const conversation = await prisma.chatConversation.upsert({
    where: {
      visitorTokenHash,
    },
    create: {
      visitorTokenHash,
      visitorName: profile.name,
      visitorEmail: profile.email,
      visitorPhone: profile.phone,
      source: profile.source,
      sourcePage: profile.sourcePage,
      campaign: profile.campaign,
      utmSource: profile.utmSource,
      utmMedium: profile.utmMedium,
      utmCampaign: profile.utmCampaign,
      utmContent: profile.utmContent,
      utmTerm: profile.utmTerm,
      ipMasked,
      userAgent,
      analyticsVisitorId: analytics.analyticsVisitorId,
      analyticsSessionId: analytics.analyticsSessionId,
      leadId,
      status: ChatConversationStatus.OPEN,
      priority: ChatConversationPriority.NORMAL,
    },
    update: updateData,
    include: {
      assignedTo: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  if (!existing) {
    const protocol = getConversationProtocolState(conversation);
    const firstPrompt = getProtocolPrompt(protocol.step, false);
    if (firstPrompt) {
      await prisma.$transaction(async (tx) => {
        await createSystemMessage(tx, {
          conversationId: conversation.id,
          body: firstPrompt,
          ipMasked,
          userAgent,
        });
      });
    }

    await writeAuditLog({
      actorId: null,
      action: "CHAT_CONVERSATION_STARTED",
      entityType: "chat_conversation",
      entityId: conversation.id,
      ipMasked,
      userAgent,
      context: {
        source: profile.source,
        sourcePage: profile.sourcePage,
        protocolStep: protocol.step,
      },
    });
  }

  return {
    conversation,
    visitorToken,
    shouldSetCookie: isNewToken || !input.visitorToken,
  };
}

export async function getPublicConversation(visitorToken: string) {
  const normalized = normalizeVisitorToken(visitorToken);
  if (!normalized) {
    return null;
  }

  const conversation = await prisma.chatConversation.findFirst({
    where: {
      visitorTokenHash: sha256(normalized),
      deletedAt: null,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  if (!conversation) {
    return null;
  }

  const messages = await prisma.chatMessage.findMany({
    where: {
      conversationId: conversation.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 140,
    select: publicMessageSelect(),
  });

  return {
    conversation,
    messages: messages.reverse(),
  };
}

async function sendPendingInactivityWarnings(input: {
  conversationId: string;
  timeoutBase: Date;
  elapsedMs: number;
  timeoutMs: number;
  ipMasked?: string | null;
  userAgent?: string | null;
}) {
  const rules = getInactivityWarningRules(input.timeoutMs);
  const dueRules = rules.filter((rule) => input.elapsedMs >= rule.triggerMs);
  if (!dueRules.length) {
    return 0;
  }

  const existing = await prisma.chatMessage.findMany({
    where: {
      conversationId: input.conversationId,
      senderType: ChatMessageSenderType.SYSTEM,
      createdAt: {
        gte: input.timeoutBase,
      },
      body: {
        in: dueRules.map((rule) => rule.message),
      },
    },
    select: {
      body: true,
    },
  });

  const sentBodies = new Set(existing.map((item) => item.body));
  const pending = dueRules.filter((rule) => !sentBodies.has(rule.message));
  if (!pending.length) {
    return 0;
  }

  for (const rule of pending) {
    await createSystemMessage(prisma, {
      conversationId: input.conversationId,
      body: rule.message,
      ipMasked: input.ipMasked,
      userAgent: input.userAgent,
    });
  }

  return pending.length;
}

export async function closeConversationForVisitorInactivityByToken(input: {
  visitorToken: string | null | undefined;
  timeoutMs: number;
  ipMasked?: string | null;
  userAgent?: string | null;
  includeWarnings?: boolean;
}) {
  const normalizedToken = normalizeVisitorToken(input.visitorToken);
  if (!normalizedToken) {
    return {
      closed: false,
      shouldRestart: false,
      reason: null as string | null,
    };
  }

  const conversation = await prisma.chatConversation.findFirst({
    where: {
      visitorTokenHash: sha256(normalizedToken),
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
      closedAt: true,
      lastMessageAt: true,
      createdAt: true,
    },
  });

  if (!conversation) {
    return {
      closed: false,
      shouldRestart: true,
      reason: "NOT_FOUND",
    };
  }

  if (
    conversation.status === ChatConversationStatus.ARCHIVED ||
    conversation.status === ChatConversationStatus.RESOLVED ||
    conversation.closedAt
  ) {
    return {
      closed: false,
      shouldRestart: true,
      reason: "ALREADY_CLOSED",
    };
  }

  const timeoutBase = conversation.lastMessageAt ?? conversation.createdAt;
  const elapsed = Date.now() - timeoutBase.getTime();
  const safeTimeoutMs = Math.max(1, input.timeoutMs);
  const ipMasked = sanitizeText(input.ipMasked, 80) || null;
  const userAgent = sanitizeText(input.userAgent, 500) || null;
  const timeoutEligible = isConversationEligibleForVisitorTimeout(conversation.status);
  const shouldTimeout = elapsed >= safeTimeoutMs && timeoutEligible;

  if (!shouldTimeout) {
    if (timeoutEligible && input.includeWarnings !== false) {
      await sendPendingInactivityWarnings({
        conversationId: conversation.id,
        timeoutBase,
        elapsedMs: elapsed,
        timeoutMs: safeTimeoutMs,
        ipMasked,
        userAgent,
      });
    }

    return {
      closed: false,
      shouldRestart: false,
      reason: null,
    };
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.chatConversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        status: ChatConversationStatus.ARCHIVED,
        closedAt: now,
        unreadForAdmin: 0,
        unreadForVisitor: 0,
      },
    });

    await createSystemMessage(tx, {
      conversationId: conversation.id,
      body: CHAT_PROTOCOL_PROMPT_TIMEOUT,
      ipMasked,
      userAgent,
    });
  });

  await writeAuditLog({
    actorId: null,
    action: "CHAT_CONVERSATION_UPDATED",
    entityType: "chat_conversation",
    entityId: conversation.id,
    ipMasked,
    userAgent,
    context: {
      reason: "VISITOR_INACTIVITY_TIMEOUT",
      timeoutMs: safeTimeoutMs,
      fromStatus: conversation.status,
      toStatus: ChatConversationStatus.ARCHIVED,
    },
  });

  return {
    closed: true,
    shouldRestart: true,
    reason: "VISITOR_TIMEOUT",
  };
}

async function closeStaleVisitorConversationsByInactivity(timeoutMs: number) {
  const threshold = new Date(Date.now() - Math.max(1, timeoutMs));
  const staleCandidates = await prisma.chatConversation.findMany({
    where: {
      deletedAt: null,
      status: {
        in: [
          ChatConversationStatus.OPEN,
          ChatConversationStatus.WAITING_VISITOR,
          ChatConversationStatus.WAITING_ATTENDANT,
        ],
      },
      OR: [
        {
          lastMessageAt: {
            lte: threshold,
          },
        },
        {
          lastMessageAt: null,
          createdAt: {
            lte: threshold,
          },
        },
      ],
    },
    select: {
      id: true,
      status: true,
    },
    orderBy: {
      lastMessageAt: "asc",
    },
    take: 50,
  });

  for (const conversation of staleCandidates) {
    const now = new Date();
    const closed = await prisma.$transaction(async (tx) => {
      const result = await tx.chatConversation.updateMany({
        where: {
          id: conversation.id,
          deletedAt: null,
          status: {
            in: [
              ChatConversationStatus.OPEN,
              ChatConversationStatus.WAITING_VISITOR,
              ChatConversationStatus.WAITING_ATTENDANT,
            ],
          },
          OR: [
            {
              lastMessageAt: {
                lte: threshold,
              },
            },
            {
              lastMessageAt: null,
              createdAt: {
                lte: threshold,
              },
            },
          ],
        },
        data: {
          status: ChatConversationStatus.ARCHIVED,
          closedAt: now,
          unreadForAdmin: 0,
          unreadForVisitor: 0,
        },
      });

      if (result.count === 0) {
        return false;
      }

      await createSystemMessage(tx, {
        conversationId: conversation.id,
        body: CHAT_PROTOCOL_PROMPT_TIMEOUT,
      });

      return true;
    });

    if (closed) {
      await writeAuditLog({
        actorId: null,
        action: "CHAT_CONVERSATION_UPDATED",
        entityType: "chat_conversation",
        entityId: conversation.id,
        context: {
          reason: "VISITOR_INACTIVITY_TIMEOUT",
          timeoutMs: Math.max(1, timeoutMs),
          fromStatus: conversation.status,
          toStatus: ChatConversationStatus.ARCHIVED,
        },
      });
    }
  }
}

export async function createVisitorMessage(input: {
  conversationId: string;
  message: string;
  ipMasked?: string | null;
  userAgent?: string | null;
}) {
  const now = new Date();
  const body = sanitizeLongText(input.message, CHAT_PUBLIC_MESSAGE_MAX_LENGTH);
  const ipMasked = sanitizeText(input.ipMasked, 80) || null;
  const userAgent = sanitizeText(input.userAgent, 500) || null;

  if (!body) {
    throw new Error("CHAT_MESSAGE_EMPTY");
  }

  const result = await prisma.$transaction(async (tx) => {
    const conversation = await tx.chatConversation.findFirst({
      where: {
        id: input.conversationId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        leadId: true,
        visitorName: true,
        visitorEmail: true,
        visitorPhone: true,
      },
    });

    if (!conversation) {
      throw new Error("CHAT_CONVERSATION_NOT_FOUND");
    }

    const protocolBefore = getConversationProtocolState(conversation);

    const message = await tx.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: ChatMessageSenderType.VISITOR,
        body,
        ipMasked,
        userAgent,
        ...(protocolBefore.step === "READY" ? {} : { readByAdminAt: now }),
      },
      select: publicMessageSelect(),
    });

    let protocolAfter: ChatProtocolStep = protocolBefore.step;
    let notifyAdmin = protocolBefore.step === "READY";
    let systemReply: string | null = null;
    let matchedLeadId: string | null = conversation.leadId;
    let matchedBy: LeadMatchType | null = null;

    const updateData: Prisma.ChatConversationUpdateInput = {
      closedAt: null,
      unreadForVisitor: 0,
      lastMessageAt: now,
      lastVisitorMessageAt: now,
    };

    if (protocolBefore.step === "ASK_NAME") {
      const candidateName = sanitizeText(body, 120);
      if (isValidProtocolName(candidateName)) {
        updateData.visitorName = candidateName;
        updateData.status = ChatConversationStatus.OPEN;
        updateData.unreadForAdmin = 0;
        protocolAfter = "ASK_PHONE";
        systemReply = CHAT_PROTOCOL_PROMPT_PHONE;
      } else {
        updateData.status = ChatConversationStatus.OPEN;
        updateData.unreadForAdmin = 0;
        protocolAfter = "ASK_NAME";
        systemReply = CHAT_PROTOCOL_PROMPT_NAME_RETRY;
      }
    } else if (protocolBefore.step === "ASK_PHONE") {
      const candidatePhone = sanitizePhone(body) || null;
      if (isValidProtocolPhone(candidatePhone)) {
        const leadMatch = await resolveLeadMatchByIdentity(tx, {
          email: conversation.visitorEmail,
          phone: candidatePhone,
          name: conversation.visitorName,
        });

        updateData.visitorPhone = candidatePhone;
        updateData.status = ChatConversationStatus.WAITING_ATTENDANT;
        updateData.unreadForAdmin = {
          increment: 1,
        };

        if (leadMatch.leadId && leadMatch.leadId !== conversation.leadId) {
          matchedLeadId = leadMatch.leadId;
          matchedBy = leadMatch.matchType;
          updateData.lead = {
            connect: {
              id: leadMatch.leadId,
            },
          };
        } else if (leadMatch.leadId) {
          matchedLeadId = leadMatch.leadId;
          matchedBy = leadMatch.matchType;
        }

        notifyAdmin = true;
        protocolAfter = "READY";
        systemReply = CHAT_PROTOCOL_PROMPT_READY;
      } else {
        updateData.status = ChatConversationStatus.OPEN;
        updateData.unreadForAdmin = 0;
        protocolAfter = "ASK_PHONE";
        systemReply = CHAT_PROTOCOL_PROMPT_PHONE_RETRY;
      }
    } else {
      updateData.status = ChatConversationStatus.WAITING_ATTENDANT;
      updateData.unreadForAdmin = {
        increment: 1,
      };
      notifyAdmin = true;
      protocolAfter = "READY";
    }

    await tx.chatConversation.update({
      where: {
        id: conversation.id,
      },
      data: updateData,
    });

    if (systemReply) {
      await createSystemMessage(tx, {
        conversationId: conversation.id,
        body: systemReply,
        ipMasked,
        userAgent,
      });
    }

    return {
      conversationId: conversation.id,
      message,
      protocolBefore: protocolBefore.step,
      protocolAfter,
      notifyAdmin,
      matchedLeadId,
      matchedBy,
    };
  });

  await writeAuditLog({
    actorId: null,
    action: "CHAT_MESSAGE_RECEIVED",
    entityType: "chat_conversation",
    entityId: result.conversationId,
    ipMasked,
    userAgent,
    context: {
      protocolBefore: result.protocolBefore,
      protocolAfter: result.protocolAfter,
      notifyAdmin: result.notifyAdmin,
      matchedLeadId: result.matchedLeadId,
      matchedBy: result.matchedBy,
    },
  });

  return result.message;
}

export async function createAdminMessage(input: {
  conversationId: string;
  actorId: string;
  message: string;
}) {
  const now = new Date();
  const body = sanitizeLongText(input.message, CHAT_ADMIN_MESSAGE_MAX_LENGTH);
  if (!body) {
    throw new Error("CHAT_MESSAGE_EMPTY");
  }

  const result = await prisma.$transaction(async (tx) => {
    const conversation = await tx.chatConversation.findFirst({
      where: {
        id: input.conversationId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        assignedToId: true,
      },
    });

    if (!conversation) {
      throw new Error("CHAT_CONVERSATION_NOT_FOUND");
    }

    if (
      conversation.status === ChatConversationStatus.ARCHIVED ||
      conversation.status === ChatConversationStatus.RESOLVED
    ) {
      throw new Error("CHAT_CONVERSATION_CLOSED");
    }

    if (conversation.assignedToId && conversation.assignedToId !== input.actorId) {
      throw new Error("CHAT_CONVERSATION_ASSIGNED_TO_OTHER");
    }

    if (!conversation.assignedToId) {
      const claim = await tx.chatConversation.updateMany({
        where: {
          id: conversation.id,
          deletedAt: null,
          assignedToId: null,
          status: {
            notIn: [ChatConversationStatus.ARCHIVED, ChatConversationStatus.RESOLVED],
          },
        },
        data: {
          assignedToId: input.actorId,
        },
      });

      if (claim.count === 0) {
        const latest = await tx.chatConversation.findFirst({
          where: {
            id: conversation.id,
            deletedAt: null,
          },
          select: {
            assignedToId: true,
            status: true,
          },
        });

        if (!latest) {
          throw new Error("CHAT_CONVERSATION_NOT_FOUND");
        }

        if (
          latest.status === ChatConversationStatus.ARCHIVED ||
          latest.status === ChatConversationStatus.RESOLVED
        ) {
          throw new Error("CHAT_CONVERSATION_CLOSED");
        }

        if (latest.assignedToId && latest.assignedToId !== input.actorId) {
          throw new Error("CHAT_CONVERSATION_ASSIGNED_TO_OTHER");
        }
      }
    }

    const message = await tx.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: ChatMessageSenderType.ATTENDANT,
        senderAdminId: input.actorId,
        body,
        readByAdminAt: now,
      },
      select: publicMessageSelect(),
    });

    await tx.chatConversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        status: ChatConversationStatus.WAITING_VISITOR,
        assignedToId: input.actorId,
        closedAt: null,
        unreadForVisitor: {
          increment: 1,
        },
        unreadForAdmin: 0,
        lastMessageAt: now,
        lastAttendantMessageAt: now,
      },
    });

    return {
      conversationId: conversation.id,
      message,
    };
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "CHAT_MESSAGE_SENT",
    entityType: "chat_conversation",
    entityId: result.conversationId,
  });

  return result.message;
}

export async function listAdminConversations(filters: ConversationListFilters) {
  await closeStaleVisitorConversationsByInactivity(CHAT_VISITOR_IDLE_TIMEOUT_MS);

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(60, Math.max(1, filters.pageSize ?? 20));
  const query = sanitizeText(filters.q, 120);

  const where: Prisma.ChatConversationWhereInput = {
    deletedAt: null,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.assignedToId ? { assignedToId: filters.assignedToId } : {}),
    ...(filters.onlyUnread ? { unreadForAdmin: { gt: 0 } } : {}),
    ...(query
      ? {
          OR: [
            {
              visitorName: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              visitorEmail: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              visitorPhone: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              source: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              sourcePage: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const [total, conversations, byStatus, unreadCount] = await Promise.all([
    prisma.chatConversation.count({
      where,
    }),
    prisma.chatConversation.findMany({
      where,
      orderBy: [{ unreadForAdmin: "desc" }, { lastMessageAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: publicMessageSelect(),
        },
      },
    }),
    prisma.chatConversation.groupBy({
      by: ["status"],
      where: {
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.chatConversation.count({
      where: {
        deletedAt: null,
        unreadForAdmin: {
          gt: 0,
        },
      },
    }),
  ]);

  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    conversations: conversations.map((conversation) => {
      const { messages, ...rest } = conversation;
      return {
        ...rest,
        latestMessage: messages[0] ?? null,
        protocol: getConversationProtocolState(conversation),
      };
    }),
    metrics: {
      unreadCount,
      byStatus,
    },
  };
}

async function resolveFallbackCrmContact(input: {
  email: string | null;
  phone: string | null;
  name: string | null;
}) {
  const email = sanitizeEmail(input.email) || null;
  const phone = sanitizePhone(input.phone) || null;
  const name = sanitizeText(input.name, 120) || null;
  const phoneDigits = normalizePhoneDigits(phone);
  const comparableName = normalizeComparableText(name);

  const whereOr: Prisma.CrmContactWhereInput[] = [];
  if (email) {
    whereOr.push({
      email,
    });
  }

  if (phoneDigits.length >= 4) {
    whereOr.push({
      phone: {
        contains: phoneDigits.slice(-4),
      },
    });
  }

  const firstNameToken = comparableName.split(" ")[0] ?? "";
  if (firstNameToken.length >= 3) {
    whereOr.push({
      fullName: {
        contains: firstNameToken,
        mode: "insensitive",
      },
    });
  }

  if (!whereOr.length) {
    return null;
  }

  const candidates = await prisma.crmContact.findMany({
    where: {
      deletedAt: null,
      OR: whereOr,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      account: {
        select: {
          id: true,
          name: true,
        },
      },
      deals: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 4,
        select: {
          id: true,
          title: true,
          stage: true,
          valueCents: true,
          updatedAt: true,
          owner: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 80,
  });

  let best: (typeof candidates)[number] | null = null;
  let bestScore = 0;
  for (const candidate of candidates) {
    const comparableCandidateName = normalizeComparableText(candidate.fullName);
    const comparableCandidatePhone = normalizePhoneDigits(candidate.phone);
    let score = 0;

    if (email && candidate.email && sanitizeEmail(candidate.email) === email) {
      score += 400;
    }

    if (phoneDigits && comparableCandidatePhone) {
      if (comparableCandidatePhone === phoneDigits) {
        score += 320;
      } else if (
        phoneDigits.length >= 8 &&
        comparableCandidatePhone.endsWith(phoneDigits.slice(-8))
      ) {
        score += 220;
      }
    }

    if (comparableName && comparableCandidateName) {
      if (comparableCandidateName === comparableName) {
        score += 200;
      } else {
        const tokens = comparableName.split(" ");
        const first = tokens[0] ?? "";
        const last = tokens[tokens.length - 1] ?? "";
        if (first.length >= 3 && comparableCandidateName.includes(first)) {
          score += 80;
        }
        if (tokens.length >= 2 && last.length >= 3 && comparableCandidateName.includes(last)) {
          score += 80;
        }
      }
    }

    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  if (!best || bestScore < 180) {
    return null;
  }

  return best;
}

export async function getAdminConversationById(conversationId: string) {
  await closeStaleVisitorConversationsByInactivity(CHAT_VISITOR_IDLE_TIMEOUT_MS);

  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      deletedAt: null,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 260,
        select: publicMessageSelect(),
      },
      lead: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          company: true,
          status: true,
          priority: true,
          crmContact: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              account: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          crmDeals: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              updatedAt: "desc",
            },
            take: 4,
            select: {
              id: true,
              title: true,
              stage: true,
              valueCents: true,
              updatedAt: true,
              owner: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    return null;
  }

  const protocol = getConversationProtocolState(conversation);
  const leadContact = conversation.lead?.crmContact ?? null;
  const fallbackContact =
    !leadContact && protocol.step === "READY"
      ? await resolveFallbackCrmContact({
          email: conversation.visitorEmail,
          phone: conversation.visitorPhone,
          name: conversation.visitorName,
        })
      : null;
  const matchedCrmContact = leadContact
    ? {
        id: leadContact.id,
        fullName: leadContact.fullName,
        email: leadContact.email,
        phone: leadContact.phone,
        account: leadContact.account,
      }
    : fallbackContact
      ? {
          id: fallbackContact.id,
          fullName: fallbackContact.fullName,
          email: fallbackContact.email,
          phone: fallbackContact.phone,
          account: fallbackContact.account,
        }
      : null;
  const fallbackDeals = fallbackContact
    ? fallbackContact.deals.map((deal) => ({
        id: deal.id,
        title: deal.title,
        stage: deal.stage,
        valueCents: deal.valueCents,
        updatedAt: deal.updatedAt,
        owner: deal.owner,
      }))
    : [];

  return {
    ...conversation,
    messages: [...conversation.messages].reverse(),
    protocol,
    identity: {
      matchedLead: conversation.lead,
      matchedCrmContact,
      recentDeals: conversation.lead?.crmDeals?.length ? conversation.lead.crmDeals : fallbackDeals,
    },
  };
}

export async function markConversationReadByAdmin(conversationId: string) {
  const now = new Date();
  await prisma.$transaction([
    prisma.chatConversation.updateMany({
      where: {
        id: conversationId,
        deletedAt: null,
      },
      data: {
        unreadForAdmin: 0,
      },
    }),
    prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderType: ChatMessageSenderType.VISITOR,
        readByAdminAt: null,
      },
      data: {
        readByAdminAt: now,
      },
    }),
  ]);
}

export async function markConversationReadByVisitor(conversationId: string) {
  const now = new Date();
  await prisma.$transaction([
    prisma.chatConversation.updateMany({
      where: {
        id: conversationId,
        deletedAt: null,
      },
      data: {
        unreadForVisitor: 0,
      },
    }),
    prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderType: ChatMessageSenderType.ATTENDANT,
        readByVisitorAt: null,
      },
      data: {
        readByVisitorAt: now,
      },
    }),
  ]);
}

export async function updateConversationByAdmin(input: {
  conversationId: string;
  actorId: string;
  status?: ChatConversationStatus;
  priority?: ChatConversationPriority;
  assignedToId?: string | null;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.chatConversation.findFirst({
      where: {
        id: input.conversationId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        priority: true,
        assignedToId: true,
      },
    });

    if (!current) {
      return null;
    }

    if (current.assignedToId && current.assignedToId !== input.actorId) {
      throw new Error("CHAT_CONVERSATION_ASSIGNED_TO_OTHER");
    }

    if (Object.prototype.hasOwnProperty.call(input, "assignedToId")) {
      const requestedAssignee = input.assignedToId ?? null;
      if (requestedAssignee && requestedAssignee !== input.actorId) {
        throw new Error("CHAT_CONVERSATION_REASSIGN_FORBIDDEN");
      }

      if (current.assignedToId && requestedAssignee !== current.assignedToId) {
        throw new Error("CHAT_CONVERSATION_REASSIGN_FORBIDDEN");
      }
    }

    const nextStatus = input.status ?? current.status;
    const nextPriority = input.priority ?? current.priority;
    let nextAssignedToId = current.assignedToId;

    if (!current.assignedToId) {
      const claim = await tx.chatConversation.updateMany({
        where: {
          id: current.id,
          deletedAt: null,
          assignedToId: null,
        },
        data: {
          assignedToId: input.actorId,
        },
      });

      if (claim.count === 0) {
        const latest = await tx.chatConversation.findFirst({
          where: {
            id: current.id,
            deletedAt: null,
          },
          select: {
            assignedToId: true,
          },
        });

        if (!latest) {
          return null;
        }

        if (latest.assignedToId && latest.assignedToId !== input.actorId) {
          throw new Error("CHAT_CONVERSATION_ASSIGNED_TO_OTHER");
        }

        nextAssignedToId = latest.assignedToId ?? input.actorId;
      } else {
        nextAssignedToId = input.actorId;
      }
    }

    const conversation = await tx.chatConversation.update({
      where: {
        id: current.id,
      },
      data: {
        status: nextStatus,
        priority: nextPriority,
        assignedToId: nextAssignedToId,
        closedAt:
          nextStatus === ChatConversationStatus.RESOLVED ||
          nextStatus === ChatConversationStatus.ARCHIVED
            ? new Date()
            : null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return {
      conversation,
      previous: current,
    };
  });

  if (!result) {
    return null;
  }

  const { conversation, previous } = result;

  await writeAuditLog({
    actorId: input.actorId,
    action: "CHAT_CONVERSATION_UPDATED",
    entityType: "chat_conversation",
    entityId: conversation.id,
    context: {
      fromStatus: previous.status,
      toStatus: conversation.status,
      fromPriority: previous.priority,
      toPriority: conversation.priority,
      fromAssignedToId: previous.assignedToId,
      toAssignedToId: conversation.assignedToId,
    },
  });

  return conversation;
}

export async function countRecentConversationCreatesByIp(ipMasked: string, windowMs: number) {
  const normalized = sanitizeText(ipMasked, 80) || "unknown";
  return prisma.chatConversation.count({
    where: {
      ipMasked: normalized,
      createdAt: {
        gte: new Date(Date.now() - windowMs),
      },
    },
  });
}

export async function countRecentVisitorMessagesByIp(ipMasked: string, windowMs: number) {
  const normalized = sanitizeText(ipMasked, 80) || "unknown";
  return prisma.chatMessage.count({
    where: {
      ipMasked: normalized,
      senderType: ChatMessageSenderType.VISITOR,
      createdAt: {
        gte: new Date(Date.now() - windowMs),
      },
    },
  });
}

export function getDeviceSummaryFromUserAgent(userAgent: string | null | undefined) {
  return parseAnalyticsUserAgent(sanitizeText(userAgent, 500) || null);
}


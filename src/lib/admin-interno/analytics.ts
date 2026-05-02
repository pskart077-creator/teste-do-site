import {
  AnalyticsEventType,
  Prisma,
  type AnalyticsSession,
  type AnalyticsVisitor,
} from "@prisma/client";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import {
  generateAnalyticsExternalId,
  inferTrafficSource,
  normalizeAnalyticsExternalId,
  parseAnalyticsUserAgent,
} from "@/lib/admin-interno/analytics-shared";
import { sanitizePath, sanitizeText } from "@/lib/admin-interno/sanitize";
import { prisma } from "@/lib/db/prisma";

type AnalyticsIdentityInput = {
  externalVisitorId?: string | null;
  externalSessionId?: string | null;
  path?: string | null;
  referrer?: string | null;
  source?: string | null;
  campaign?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  ipMasked?: string | null;
  userAgent?: string | null;
};

type AnalyticsIdentityResult = {
  visitor: AnalyticsVisitor;
  session: AnalyticsSession;
  source: string;
  parsedAgent: ReturnType<typeof parseAnalyticsUserAgent>;
};

function sanitizeSource(value: string | null | undefined) {
  return sanitizeText(value, 120) || null;
}

function sanitizeCampaign(value: string | null | undefined) {
  return sanitizeText(value, 120) || null;
}

function sanitizeContext(input: Record<string, unknown> | null | undefined) {
  if (!input) {
    return null;
  }

  const entries = Object.entries(input).slice(0, 20);
  const out: Record<string, string | number | boolean | null> = {};

  for (const [rawKey, rawValue] of entries) {
    const key = sanitizeText(rawKey, 50);
    if (!key) {
      continue;
    }

    if (
      typeof rawValue === "string" ||
      typeof rawValue === "number" ||
      typeof rawValue === "boolean"
    ) {
      out[key] =
        typeof rawValue === "string" ? sanitizeText(rawValue, 300) : rawValue;
      continue;
    }

    if (rawValue == null) {
      out[key] = null;
    }
  }

  return Object.keys(out).length ? out : null;
}

async function resolveIdentity(
  tx: Prisma.TransactionClient,
  input: AnalyticsIdentityInput,
  occurredAt: Date,
): Promise<AnalyticsIdentityResult> {
  const normalizedPath = sanitizePath(input.path) || "/";
  const referrer = sanitizeText(input.referrer, 350) || null;
  const userAgent = sanitizeText(input.userAgent, 500) || null;
  const parsedAgent = parseAnalyticsUserAgent(userAgent);
  const country = sanitizeText(input.country, 32) || null;
  const region = sanitizeText(input.region, 64) || null;
  const city = sanitizeText(input.city, 120) || null;
  const ipMasked = sanitizeText(input.ipMasked, 80) || null;

  const externalVisitorId =
    normalizeAnalyticsExternalId(input.externalVisitorId) ??
    generateAnalyticsExternalId("v");

  let visitor = await tx.analyticsVisitor.findUnique({
    where: {
      externalVisitorId,
    },
  });

  if (!visitor) {
    visitor = await tx.analyticsVisitor.create({
      data: {
        externalVisitorId,
        firstSeenAt: occurredAt,
        lastSeenAt: occurredAt,
        firstReferrer: referrer,
        firstLandingPath: normalizedPath,
        country,
        region,
        city,
        deviceType: parsedAgent.deviceType,
        browser: parsedAgent.browser,
        os: parsedAgent.os,
      },
    });
  } else {
    visitor = await tx.analyticsVisitor.update({
      where: {
        id: visitor.id,
      },
      data: {
        lastSeenAt: occurredAt,
        country: country ?? visitor.country,
        region: region ?? visitor.region,
        city: city ?? visitor.city,
        deviceType: parsedAgent.deviceType || visitor.deviceType,
        browser: parsedAgent.browser || visitor.browser,
        os: parsedAgent.os || visitor.os,
      },
    });
  }

  const source =
    sanitizeSource(input.source) ??
    sanitizeSource(input.utmSource) ??
    inferTrafficSource(referrer, process.env.NEXT_PUBLIC_SITE_URL ?? null);

  let externalSessionId =
    normalizeAnalyticsExternalId(input.externalSessionId) ??
    generateAnalyticsExternalId("s");

  let session = await tx.analyticsSession.findUnique({
    where: {
      externalSessionId,
    },
  });

  if (session && session.visitorId !== visitor.id) {
    externalSessionId = generateAnalyticsExternalId("s");
    session = null;
  }

  if (!session) {
    session = await tx.analyticsSession.create({
      data: {
        externalSessionId,
        visitorId: visitor.id,
        startedAt: occurredAt,
        lastSeenAt: occurredAt,
        landingPath: normalizedPath,
        exitPath: normalizedPath,
        referrer,
        source,
        medium: sanitizeSource(input.utmMedium),
        campaign: sanitizeCampaign(input.campaign) ?? sanitizeCampaign(input.utmCampaign),
        utmSource: sanitizeSource(input.utmSource),
        utmMedium: sanitizeSource(input.utmMedium),
        utmCampaign: sanitizeCampaign(input.utmCampaign),
        utmContent: sanitizeCampaign(input.utmContent),
        utmTerm: sanitizeCampaign(input.utmTerm),
        country,
        region,
        city,
        ipMasked,
        deviceType: parsedAgent.deviceType,
        browser: parsedAgent.browser,
        os: parsedAgent.os,
        isBot: parsedAgent.isBot,
      },
    });
  } else {
    session = await tx.analyticsSession.update({
      where: {
        id: session.id,
      },
      data: {
        lastSeenAt: occurredAt,
        exitPath: normalizedPath,
        referrer: referrer ?? session.referrer,
        source: source ?? session.source,
        medium: sanitizeSource(input.utmMedium) ?? session.medium,
        campaign:
          sanitizeCampaign(input.campaign) ??
          sanitizeCampaign(input.utmCampaign) ??
          session.campaign,
        utmSource: sanitizeSource(input.utmSource) ?? session.utmSource,
        utmMedium: sanitizeSource(input.utmMedium) ?? session.utmMedium,
        utmCampaign: sanitizeCampaign(input.utmCampaign) ?? session.utmCampaign,
        utmContent: sanitizeCampaign(input.utmContent) ?? session.utmContent,
        utmTerm: sanitizeCampaign(input.utmTerm) ?? session.utmTerm,
        country: country ?? session.country,
        region: region ?? session.region,
        city: city ?? session.city,
        ipMasked: ipMasked ?? session.ipMasked,
        deviceType: parsedAgent.deviceType || session.deviceType,
        browser: parsedAgent.browser || session.browser,
        os: parsedAgent.os || session.os,
        isBot: parsedAgent.isBot,
      },
    });
  }

  return {
    visitor,
    session,
    source,
    parsedAgent,
  };
}

export async function ingestAnalyticsEvent(input: {
  externalVisitorId?: string | null;
  externalSessionId?: string | null;
  eventType?: AnalyticsEventType;
  path: string;
  referrer?: string | null;
  title?: string | null;
  source?: string | null;
  queryString?: string | null;
  campaign?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  context?: Record<string, unknown> | null;
  ipMasked?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  userAgent?: string | null;
  occurredAt?: Date;
}) {
  const occurredAt = input.occurredAt ?? new Date();
  const path = sanitizePath(input.path) || "/";
  const referrer = sanitizeText(input.referrer, 350) || null;
  const queryString = sanitizeText(input.queryString, 600) || null;
  const title = sanitizeText(input.title, 160) || null;
  const eventType = input.eventType ?? AnalyticsEventType.PAGE_VIEW;
  const context = sanitizeContext(input.context);

  return prisma.$transaction(async (tx) => {
    const identity = await resolveIdentity(
      tx,
      {
        externalVisitorId: input.externalVisitorId,
        externalSessionId: input.externalSessionId,
        path,
        referrer,
        source: input.source,
        campaign: input.campaign,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        utmTerm: input.utmTerm,
        country: input.country,
        region: input.region,
        city: input.city,
        ipMasked: input.ipMasked,
        userAgent: input.userAgent,
      },
      occurredAt,
    );

    const event = await tx.analyticsEvent.create({
      data: {
        visitorId: identity.visitor.id,
        analyticsSessionId: identity.session.id,
        eventType,
        path,
        referrer,
        title,
        source: identity.source,
        queryString,
        context: context ? (context as Prisma.InputJsonValue) : undefined,
        ipMasked: sanitizeText(input.ipMasked, 80) || null,
        country: sanitizeText(input.country, 32) || null,
        region: sanitizeText(input.region, 64) || null,
        city: sanitizeText(input.city, 120) || null,
        deviceType: identity.parsedAgent.deviceType,
        browser: identity.parsedAgent.browser,
        os: identity.parsedAgent.os,
        isBot: identity.parsedAgent.isBot,
        occurredAt,
      },
    });

    return {
      eventId: event.id,
      visitorId: identity.visitor.id,
      sessionId: identity.session.id,
      externalVisitorId: identity.visitor.externalVisitorId,
      externalSessionId: identity.session.externalSessionId,
    };
  });
}

export async function registerLeadConversion(input: {
  leadId: string;
  externalVisitorId?: string | null;
  externalSessionId?: string | null;
  path?: string | null;
  referrer?: string | null;
  source?: string | null;
  campaign?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  ipMasked?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  userAgent?: string | null;
}) {
  const occurredAt = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({
      where: {
        id: input.leadId,
      },
      select: {
        id: true,
        analyticsVisitorId: true,
        analyticsSessionId: true,
        sourcePage: true,
      },
    });

    if (!lead) {
      return null;
    }

    const identity = await resolveIdentity(
      tx,
      {
        externalVisitorId: input.externalVisitorId,
        externalSessionId: input.externalSessionId,
        path: input.path ?? lead.sourcePage ?? "/",
        referrer: input.referrer,
        source: input.source,
        campaign: input.campaign,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        utmTerm: input.utmTerm,
        country: input.country,
        region: input.region,
        city: input.city,
        ipMasked: input.ipMasked,
        userAgent: input.userAgent,
      },
      occurredAt,
    );

    const visitorChanged = lead.analyticsVisitorId !== identity.visitor.id;
    const sessionChanged = lead.analyticsSessionId !== identity.session.id;

    if (visitorChanged || sessionChanged) {
      await tx.lead.update({
        where: {
          id: lead.id,
        },
        data: {
          analyticsVisitorId: identity.visitor.id,
          analyticsSessionId: identity.session.id,
        },
      });
    }

    if (visitorChanged) {
      await tx.analyticsVisitor.update({
        where: {
          id: identity.visitor.id,
        },
        data: {
          leadConversions: {
            increment: 1,
          },
        },
      });
    }

    if (sessionChanged) {
      await tx.analyticsSession.update({
        where: {
          id: identity.session.id,
        },
        data: {
          leadConversions: {
            increment: 1,
          },
        },
      });
    }

    await tx.analyticsEvent.create({
      data: {
        visitorId: identity.visitor.id,
        analyticsSessionId: identity.session.id,
        eventType: AnalyticsEventType.LEAD_SUBMITTED,
        path: sanitizePath(input.path ?? lead.sourcePage ?? "/api/leads") || "/api/leads",
        referrer: sanitizeText(input.referrer, 350) || null,
        source: identity.source,
        context: {
          leadId: lead.id,
        },
        ipMasked: sanitizeText(input.ipMasked, 80) || null,
        country: sanitizeText(input.country, 32) || null,
        region: sanitizeText(input.region, 64) || null,
        city: sanitizeText(input.city, 120) || null,
        deviceType: identity.parsedAgent.deviceType,
        browser: identity.parsedAgent.browser,
        os: identity.parsedAgent.os,
        isBot: identity.parsedAgent.isBot,
        occurredAt,
      },
    });

    return {
      visitorId: identity.visitor.id,
      sessionId: identity.session.id,
      externalVisitorId: identity.visitor.externalVisitorId,
      externalSessionId: identity.session.externalSessionId,
    };
  });

  if (result) {
    await writeAuditLog({
      actorId: null,
      action: "ANALYTICS_INGESTED",
      entityType: "lead_conversion",
      entityId: input.leadId,
      ipMasked: sanitizeText(input.ipMasked, 80) || null,
      userAgent: sanitizeText(input.userAgent, 500) || null,
      context: {
        visitorId: result.visitorId,
        sessionId: result.sessionId,
      },
    });
  }

  return result;
}

export async function getAnalyticsOverview(days = 30) {
  const safeDays = Math.min(365, Math.max(1, Number(days) || 30));
  const from = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

  const [
    pageViews,
    leadSubmissions,
    activeVisitors,
    activeSessions,
    convertingSessions,
    recentEvents,
    pageGroups,
    sourceGroups,
    deviceGroups,
    geoGroups,
  ] = await Promise.all([
    prisma.analyticsEvent.count({
      where: {
        eventType: AnalyticsEventType.PAGE_VIEW,
        occurredAt: {
          gte: from,
        },
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        eventType: AnalyticsEventType.LEAD_SUBMITTED,
        occurredAt: {
          gte: from,
        },
      },
    }),
    prisma.analyticsVisitor.count({
      where: {
        lastSeenAt: {
          gte: from,
        },
      },
    }),
    prisma.analyticsSession.count({
      where: {
        lastSeenAt: {
          gte: from,
        },
      },
    }),
    prisma.analyticsSession.count({
      where: {
        lastSeenAt: {
          gte: from,
        },
        leadConversions: {
          gt: 0,
        },
      },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        occurredAt: {
          gte: from,
        },
      },
      orderBy: {
        occurredAt: "desc",
      },
      take: 15,
      select: {
        id: true,
        eventType: true,
        path: true,
        source: true,
        country: true,
        deviceType: true,
        occurredAt: true,
      },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["path"],
      where: {
        eventType: AnalyticsEventType.PAGE_VIEW,
        occurredAt: {
          gte: from,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["source"],
      where: {
        eventType: AnalyticsEventType.PAGE_VIEW,
        occurredAt: {
          gte: from,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.analyticsSession.groupBy({
      by: ["deviceType"],
      where: {
        startedAt: {
          gte: from,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.analyticsSession.groupBy({
      by: ["country"],
      where: {
        startedAt: {
          gte: from,
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const topPages = pageGroups
    .map((item) => ({
      path: item.path,
      count: item._count._all,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topSources = sourceGroups
    .map((item) => ({
      source: item.source || "direct",
      count: item._count._all,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const devices = deviceGroups
    .map((item) => ({
      deviceType: item.deviceType || "unknown",
      count: item._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const countries = geoGroups
    .map((item) => ({
      country: item.country || "N/A",
      count: item._count._all,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const conversionRate = activeSessions
    ? Number(((convertingSessions / activeSessions) * 100).toFixed(2))
    : 0;

  return {
    rangeDays: safeDays,
    from,
    metrics: {
      pageViews,
      leadSubmissions,
      activeVisitors,
      activeSessions,
      convertingSessions,
      conversionRate,
    },
    topPages,
    topSources,
    devices,
    countries,
    recentEvents,
  };
}

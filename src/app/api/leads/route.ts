import type { NextRequest } from "next/server";
import { fromUnknownError, InternalApiError, ok, parseJsonBody } from "@/lib/admin-interno/api";
import { registerLeadConversion } from "@/lib/admin-interno/analytics";
import { extractAnalyticsGeo } from "@/lib/admin-interno/analytics-shared";
import {
  ANALYTICS_SESSION_COOKIE,
  ANALYTICS_VISITOR_COOKIE,
} from "@/lib/admin-interno/constants";
import { getRequestIp, getUserAgent } from "@/lib/admin-interno/http";
import { createLeadFromPublicInput } from "@/lib/admin-interno/leads";
import { enqueueLeadNotifications, processPendingNotificationJobs } from "@/lib/admin-interno/notifications";
import { maskIpAddress } from "@/lib/admin-interno/sanitize";
import { leadIngestionSchema } from "@/lib/admin-interno/validators";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = leadIngestionSchema.parse(await parseJsonBody(request, 80_000));

    const ipMasked = maskIpAddress(getRequestIp(request));
    const userAgent = getUserAgent(request).slice(0, 500);
    const analyticsVisitorId = request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value ?? null;
    const analyticsSessionId = request.cookies.get(ANALYTICS_SESSION_COOKIE)?.value ?? null;
    const referrer = request.headers.get("referer") ?? null;
    const geo = extractAnalyticsGeo(request.headers);

    const recentCount = await prisma.lead.count({
      where: {
        ipMasked,
        createdAt: {
          gte: new Date(Date.now() - 10 * 60_000),
        },
      },
    });

    if (recentCount >= 15) {
      throw new InternalApiError(429, "RATE_LIMITED", "Limite temporario de envios atingido.");
    }

    const result = await createLeadFromPublicInput({
      ...body,
      ipMasked,
      userAgent,
    });

    if (result.captureStage !== "partial") {
      try {
        await registerLeadConversion({
          leadId: result.lead.id,
          externalVisitorId: analyticsVisitorId,
          externalSessionId: analyticsSessionId,
          path: body.sourcePage ?? "/contato",
          referrer,
          source: body.source,
          campaign: body.campaign,
          utmSource: body.utm_source,
          utmMedium: body.utm_medium,
          utmCampaign: body.utm_campaign,
          utmContent: body.utm_content,
          utmTerm: body.utm_term,
          ipMasked,
          country: geo.country,
          region: geo.region,
          city: geo.city,
          userAgent,
        });
      } catch {
        // Analytics is non-blocking for lead ingestion.
      }

      await enqueueLeadNotifications(result.lead.id);
      await processPendingNotificationJobs(10);
    }

    return ok({
      id: result.lead.id,
      status: result.captureStage === "partial" ? "captured" : "received",
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}

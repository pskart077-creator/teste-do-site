import type { NextRequest } from "next/server";
import { fromUnknownError, InternalApiError, ok, parseJsonBody } from "@/lib/admin-interno/api";
import { ingestAnalyticsEvent } from "@/lib/admin-interno/analytics";
import { safeEqual, sha256 } from "@/lib/admin-interno/security";
import { analyticsIngestSchema } from "@/lib/admin-interno/validators";

function assertAnalyticsToken(request: NextRequest) {
  const expected = process.env.ANALYTICS_INGEST_TOKEN?.trim();
  if (!expected) {
    throw new InternalApiError(
      503,
      "ANALYTICS_NOT_CONFIGURED",
      "Ingestão de analytics indisponível.",
    );
  }

  const provided = request.headers.get("x-analytics-ingest-token")?.trim();
  if (!provided) {
    throw new InternalApiError(401, "UNAUTHORIZED_INGEST", "Token de ingestão inválido.");
  }

  const isValid = safeEqual(sha256(provided), sha256(expected));
  if (!isValid) {
    throw new InternalApiError(401, "UNAUTHORIZED_INGEST", "Token de ingestão inválido.");
  }
}

export async function POST(request: NextRequest) {
  try {
    assertAnalyticsToken(request);

    const body = analyticsIngestSchema.parse(await parseJsonBody(request, 80_000));

    const event = await ingestAnalyticsEvent({
      externalVisitorId: body.externalVisitorId ?? null,
      externalSessionId: body.externalSessionId ?? null,
      eventType: body.eventType,
      path: body.path,
      referrer: body.referrer ?? null,
      title: body.title ?? null,
      source: body.source ?? null,
      queryString: body.queryString ?? null,
      campaign: body.campaign ?? null,
      utmSource: body.utm_source ?? null,
      utmMedium: body.utm_medium ?? null,
      utmCampaign: body.utm_campaign ?? null,
      utmContent: body.utm_content ?? null,
      utmTerm: body.utm_term ?? null,
      context: body.context ?? null,
      ipMasked: body.ipMasked ?? null,
      country: body.country ?? null,
      region: body.region ?? null,
      city: body.city ?? null,
      userAgent: body.userAgent ?? null,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
    });

    return ok({
      ingested: true,
      eventId: event.eventId,
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}

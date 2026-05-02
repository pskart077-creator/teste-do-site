import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import {
  extractAnalyticsGeo,
  generateAnalyticsExternalId,
  inferTrafficSource,
  isValidAnalyticsExternalId,
} from "@/lib/admin-interno/analytics-shared";
import {
  ANALYTICS_SESSION_COOKIE,
  ANALYTICS_VISITOR_COOKIE,
  INTERNAL_ADMIN_SESSION_COOKIE,
} from "@/lib/admin-interno/constants";
import { getRequestIp, getUserAgent } from "@/lib/admin-interno/http";
import { maskIpAddress, sanitizePath, sanitizeText } from "@/lib/admin-interno/sanitize";
import { NEWS_SESSION_COOKIE } from "@/lib/news/constants";

const STATIC_FILE_REGEX =
  /\.(?:css|js|mjs|map|txt|xml|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$/i;

function getCookieSecurity() {
  return process.env.NODE_ENV === "production";
}

function hasSessionCookie(request: NextRequest) {
  const cookie = request.cookies.get(NEWS_SESSION_COOKIE)?.value;
  if (!cookie) {
    return false;
  }

  return /^[A-Za-z0-9_-]{40,}$/.test(cookie);
}

function hasInternalSessionCookie(request: NextRequest) {
  const cookie = request.cookies.get(INTERNAL_ADMIN_SESSION_COOKIE)?.value;
  if (!cookie) {
    return false;
  }

  return /^[A-Za-z0-9_-]{40,}$/.test(cookie);
}

function applyPrivateHeaders(
  response: NextResponse,
  options?: {
    allowExternalImages?: boolean;
  },
) {
  const imgSrcPolicy = options?.allowExternalImages
    ? "img-src 'self' https: data: blob:"
    : "img-src 'self' data: blob:";

  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      imgSrcPolicy,
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  );
  return response;
}

function applyInternalHeaders(response: NextResponse) {
  return applyPrivateHeaders(response);
}

function applyAdminHeaders(response: NextResponse) {
  return applyPrivateHeaders(response, {
    allowExternalImages: true,
  });
}

function isStaticAsset(pathname: string) {
  return STATIC_FILE_REGEX.test(pathname);
}

function shouldTrackPublicPageView(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (request.method.toUpperCase() !== "GET") {
    return false;
  }

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/admin-interno") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next")
  ) {
    return false;
  }

  if (isStaticAsset(pathname)) {
    return false;
  }

  const purpose = request.headers.get("purpose")?.toLowerCase();
  if (purpose === "prefetch" || request.headers.has("next-router-prefetch")) {
    return false;
  }

  const accept = request.headers.get("accept")?.toLowerCase() ?? "";
  return accept.includes("text/html");
}

function getOrCreateAnalyticsIds(request: NextRequest, response: NextResponse) {
  const secure = getCookieSecurity();
  let visitorId = request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value ?? "";
  let sessionId = request.cookies.get(ANALYTICS_SESSION_COOKIE)?.value ?? "";

  if (!isValidAnalyticsExternalId(visitorId)) {
    visitorId = generateAnalyticsExternalId("v");
    response.cookies.set({
      name: ANALYTICS_VISITOR_COOKIE,
      value: visitorId,
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  if (!isValidAnalyticsExternalId(sessionId)) {
    sessionId = generateAnalyticsExternalId("s");
  }

  response.cookies.set({
    name: ANALYTICS_SESSION_COOKIE,
    value: sessionId,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return {
    visitorId,
    sessionId,
  };
}

function queueAnalyticsPageView(
  request: NextRequest,
  event: NextFetchEvent,
  ids: {
    visitorId: string;
    sessionId: string;
  },
) {
  const ingestToken = process.env.ANALYTICS_INGEST_TOKEN?.trim();
  if (!ingestToken) {
    return;
  }

  const pathnameWithQuery = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const referrer = sanitizeText(request.headers.get("referer"), 350) || null;
  const userAgent = sanitizeText(getUserAgent(request), 500) || null;
  const ipMasked = maskIpAddress(getRequestIp(request));
  const geo = extractAnalyticsGeo(request.headers);

  const utmSource = sanitizeText(request.nextUrl.searchParams.get("utm_source"), 120) || null;
  const utmMedium = sanitizeText(request.nextUrl.searchParams.get("utm_medium"), 120) || null;
  const utmCampaign = sanitizeText(request.nextUrl.searchParams.get("utm_campaign"), 120) || null;
  const utmContent = sanitizeText(request.nextUrl.searchParams.get("utm_content"), 120) || null;
  const utmTerm = sanitizeText(request.nextUrl.searchParams.get("utm_term"), 120) || null;

  const source = utmSource ?? inferTrafficSource(referrer, request.nextUrl.host);

  event.waitUntil(
    fetch(new URL("/api/analytics/ingest", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-analytics-ingest-token": ingestToken,
      },
      cache: "no-store",
      body: JSON.stringify({
        externalVisitorId: ids.visitorId,
        externalSessionId: ids.sessionId,
        eventType: "PAGE_VIEW",
        path: sanitizePath(pathnameWithQuery) || "/",
        referrer,
        queryString: request.nextUrl.search ? request.nextUrl.search.slice(1) : null,
        source,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
        utm_term: utmTerm,
        ipMasked,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        userAgent,
        context: {
          host: request.nextUrl.host,
          pathname: request.nextUrl.pathname,
        },
      }),
    }).catch(() => undefined),
  );
}

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const pathname = request.nextUrl.pathname;
  const method = request.method.toUpperCase();

  if (pathname.startsWith("/admin-interno")) {
    return NextResponse.redirect(new URL("/news", request.url));
  }

  if (pathname.startsWith("/api/chat")) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Recurso não disponível.",
        },
      },
      { status: 404 },
    );
  }

  const isAdminLoginApi = pathname === "/api/admin/auth/login" && method === "POST";
  const isInternalAdminLoginApi =
    pathname === "/admin-interno/api/auth/login" && method === "POST";

  if (pathname.startsWith("/admin-interno/login")) {
    return applyInternalHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/admin-interno/api")) {
    if (isInternalAdminLoginApi) {
      return applyInternalHeaders(NextResponse.next());
    }

    if (!hasInternalSessionCookie(request)) {
      return applyInternalHeaders(
        NextResponse.json(
          {
            success: false,
            error: {
              code: "UNAUTHENTICATED",
              message: "Autenticação obrigatória.",
            },
          },
          {
            status: 401,
          },
        ),
      );
    }

    return applyInternalHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/admin-interno")) {
    if (!hasInternalSessionCookie(request)) {
      const loginUrl = new URL("/admin-interno/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return applyInternalHeaders(NextResponse.redirect(loginUrl));
    }

    return applyInternalHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/admin/login")) {
    return applyAdminHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/admin")) {
    if (!hasSessionCookie(request)) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return applyAdminHeaders(NextResponse.redirect(loginUrl));
    }

    return applyAdminHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/api/admin")) {
    if (isAdminLoginApi) {
      const response = NextResponse.next();
      response.headers.set("Cache-Control", "no-store");
      return applyAdminHeaders(response);
    }

    if (!hasSessionCookie(request)) {
      return applyAdminHeaders(
        NextResponse.json(
          {
            success: false,
            error: {
              code: "UNAUTHENTICATED",
              message: "Autenticação obrigatória.",
            },
          },
          {
            status: 401,
          },
        ),
      );
    }

    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store");
    return applyAdminHeaders(response);
  }

  const response = NextResponse.next();

  if (shouldTrackPublicPageView(request)) {
    const ids = getOrCreateAnalyticsIds(request, response);
    queueAnalyticsPageView(request, event, ids);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};

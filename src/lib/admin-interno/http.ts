import type { NextRequest } from "next/server";
import { InternalApiError } from "@/lib/admin-interno/api";

export function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "";
}

export function getUserAgent(request: NextRequest) {
  return request.headers.get("user-agent") ?? "";
}

export function requireSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return;
  }

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new InternalApiError(403, "INVALID_ORIGIN", "Origem inválida.");
  }

  if (originUrl.host !== request.nextUrl.host) {
    throw new InternalApiError(403, "INVALID_ORIGIN", "Origem não permitida.");
  }
}

function normalizeHost(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function extractHostFromUrl(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }

  try {
    return normalizeHost(new URL(raw).host);
  } catch {
    return "";
  }
}

function isIpLike(host: string) {
  return /^\d{1,3}(\.\d{1,3}){3}(:\d+)?$/.test(host) || host.includes(":");
}

function expandHostAliases(host: string | null | undefined) {
  const normalized = normalizeHost(host);
  const aliases = new Set<string>();
  if (!normalized) {
    return aliases;
  }

  aliases.add(normalized);

  const [name, port] = normalized.split(":");
  const hasDot = (name ?? "").includes(".");
  const canUseWwwAlias = Boolean(name) && hasDot && !isIpLike(name) && name !== "localhost";

  if (canUseWwwAlias && name) {
    const withPort = (candidate: string) => (port ? `${candidate}:${port}` : candidate);
    if (name.startsWith("www.")) {
      aliases.add(withPort(name.slice(4)));
    } else {
      aliases.add(withPort(`www.${name}`));
    }
  }

  return aliases;
}

function readForwardedHosts(headerValue: string | null | undefined) {
  const raw = String(headerValue ?? "").trim();
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => normalizeHost(value))
    .filter(Boolean);
}

export function requireTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return;
  }

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new InternalApiError(403, "INVALID_ORIGIN", "Origem inválida.");
  }

  if (!/^https?:$/i.test(originUrl.protocol)) {
    throw new InternalApiError(403, "INVALID_ORIGIN", "Origem inválida.");
  }

  const trustedHosts = new Set<string>();

  for (const candidate of [
    request.nextUrl.host,
    request.headers.get("host"),
    ...readForwardedHosts(request.headers.get("x-forwarded-host")),
    extractHostFromUrl(process.env.NEXT_PUBLIC_SITE_URL),
  ]) {
    for (const alias of expandHostAliases(candidate)) {
      trustedHosts.add(alias);
    }
  }

  const originHost = normalizeHost(originUrl.host);
  for (const alias of expandHostAliases(originHost)) {
    if (trustedHosts.has(alias)) {
      return;
    }
  }

  throw new InternalApiError(403, "INVALID_ORIGIN", "Origem não permitida.");
}

export function applyAdminSecurityHeaders(response: Response) {
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Cross-Origin-Embedder-Policy", "unsafe-none");
  return response;
}

import { sanitizeText } from "@/lib/admin-interno/sanitize";

const ANALYTICS_ID_REGEX = /^[A-Za-z0-9_-]{16,120}$/;
const BASE64URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export type AnalyticsGeo = {
  country: string | null;
  region: string | null;
  city: string | null;
};

export type ParsedAnalyticsUserAgent = {
  deviceType: string;
  browser: string;
  os: string;
  isBot: boolean;
};

function readHeader(
  headers: Headers | { get(name: string): string | null | undefined },
  name: string,
) {
  return headers.get(name) ?? null;
}

export function isValidAnalyticsExternalId(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return ANALYTICS_ID_REGEX.test(value);
}

export function normalizeAnalyticsExternalId(value: string | null | undefined) {
  const normalized = sanitizeText(value, 120);
  if (!isValidAnalyticsExternalId(normalized)) {
    return null;
  }
  return normalized;
}

export function generateAnalyticsExternalId(prefix: "v" | "s") {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let token = "";

  for (const value of bytes) {
    token += BASE64URL_ALPHABET[value % BASE64URL_ALPHABET.length];
  }

  return `${prefix}_${token}`;
}

export function parseAnalyticsUserAgent(userAgent: string | null | undefined): ParsedAnalyticsUserAgent {
  const value = String(userAgent ?? "").toLowerCase();

  const isBot =
    /bot|spider|crawler|headless|preview|lighthouse|pingdom|slurp|bingpreview/.test(
      value,
    );

  let deviceType = "desktop";
  if (/tablet|ipad/.test(value)) {
    deviceType = "tablet";
  } else if (/mobi|iphone|android|ipod/.test(value)) {
    deviceType = "mobile";
  }

  let browser = "other";
  if (/edg\//.test(value)) {
    browser = "edge";
  } else if (/opr\//.test(value) || /opera/.test(value)) {
    browser = "opera";
  } else if (/firefox\//.test(value) || /fxios\//.test(value)) {
    browser = "firefox";
  } else if (/chrome\//.test(value) || /crios\//.test(value)) {
    browser = "chrome";
  } else if (/safari\//.test(value)) {
    browser = "safari";
  }

  let os = "other";
  if (/windows nt/.test(value)) {
    os = "windows";
  } else if (/android/.test(value)) {
    os = "android";
  } else if (/iphone|ipad|ipod|ios/.test(value)) {
    os = "ios";
  } else if (/mac os x|macintosh/.test(value)) {
    os = "macos";
  } else if (/linux/.test(value)) {
    os = "linux";
  }

  return {
    deviceType,
    browser,
    os,
    isBot,
  };
}

export function extractAnalyticsGeo(
  headers: Headers | { get(name: string): string | null | undefined },
): AnalyticsGeo {
  const country = sanitizeText(
    readHeader(headers, "x-vercel-ip-country") ??
      readHeader(headers, "cf-ipcountry") ??
      readHeader(headers, "x-country-code"),
    32,
  );
  const region = sanitizeText(
    readHeader(headers, "x-vercel-ip-country-region") ??
      readHeader(headers, "x-region-code"),
    64,
  );
  const city = sanitizeText(
    readHeader(headers, "x-vercel-ip-city") ?? readHeader(headers, "x-geo-city"),
    120,
  );

  return {
    country: country || null,
    region: region || null,
    city: city || null,
  };
}

export function inferTrafficSource(
  referrer: string | null | undefined,
  currentHost: string | null | undefined,
) {
  const value = sanitizeText(referrer, 350);
  if (!value) {
    return "direct";
  }

  let referrerHost = "";
  try {
    referrerHost = new URL(value).host.toLowerCase();
  } catch {
    return "referral";
  }

  if (!referrerHost) {
    return "direct";
  }

  const host = String(currentHost ?? "").toLowerCase();
  if (host && (referrerHost === host || referrerHost.endsWith(`.${host}`))) {
    return "internal";
  }

  if (/google\.|bing\.|duckduckgo\.|yahoo\./.test(referrerHost)) {
    return "organic";
  }

  if (/facebook\.|instagram\.|linkedin\.|twitter\.|x\.com|t\.co|youtube\./.test(referrerHost)) {
    return "social";
  }

  return "referral";
}

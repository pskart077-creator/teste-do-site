import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import path from "node:path";
import type { Prisma, PrismaClient } from "@prisma/client";
import { extractNewsContentPlainText } from "@/lib/news/content";
import {
  NEWS_ADMIN_MAX_PAGE_SIZE,
  NEWS_ADMIN_PAGE_SIZE,
  NEWS_DEFAULT_PAGE_SIZE,
  NEWS_MAX_PAGE_SIZE,
  NEWS_SLUG_REGEX,
} from "@/lib/news/constants";
import type { NewsContentDocument } from "@/lib/news/types";

export function getSiteUrl() {
  const defaultUrl = "https://www.credpagos.com.br";
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? defaultUrl).trim();

  if (!raw) {
    return defaultUrl;
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw)
    ? raw
    : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return defaultUrl;
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return defaultUrl;
  }
}

export function createRequestId() {
  return randomBytes(16).toString("hex");
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function stripControlChars(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, "");
}

export function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function sanitizePlainText(value: string, maxLength: number) {
  const normalized = compactWhitespace(stripControlChars(value));
  return normalized.slice(0, maxLength);
}

export function sanitizeMultilineText(value: string, maxLength: number) {
  const normalized = stripControlChars(value)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return normalized.slice(0, maxLength);
}

export function sanitizeSlug(raw: string) {
  const normalized = stripControlChars(raw)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized.slice(0, 80);
}

export function ensureValidSlug(raw: string) {
  const slug = sanitizeSlug(raw);
  if (!slug || !NEWS_SLUG_REGEX.test(slug)) {
    throw new Error("Slug inválido.");
  }
  return slug;
}

export async function buildUniqueSlug(
  prisma: PrismaClient | Prisma.TransactionClient,
  desiredSlug: string,
  options?: { excludePostId?: string },
) {
  let candidate = ensureValidSlug(desiredSlug);
  let suffix = 1;

  // Avoid predictable enumerations by appending random entropy after several collisions.
  while (true) {
    const existing = await prisma.newsPost.findFirst({
      where: {
        slug: candidate,
        deletedAt: null,
        ...(options?.excludePostId
          ? {
              id: {
                not: options.excludePostId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return candidate;
    }

    suffix += 1;
    if (suffix <= 5) {
      candidate = `${ensureValidSlug(desiredSlug)}-${suffix}`;
      continue;
    }

    candidate = `${ensureValidSlug(desiredSlug)}-${randomBytes(2).toString("hex")}`;
  }
}

export function parsePage(
  value: string | null | undefined,
  fallback = 1,
) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

export function parsePublicPageSize(value: string | null | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return NEWS_DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(parsed), NEWS_MAX_PAGE_SIZE);
}

export function parseAdminPageSize(value: string | null | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return NEWS_ADMIN_PAGE_SIZE;
  }
  return Math.min(Math.floor(parsed), NEWS_ADMIN_MAX_PAGE_SIZE);
}

export function parseBoolean(value: string | boolean | null | undefined) {
  if (typeof value === "boolean") {
    return value;
  }
  if (!value) {
    return false;
  }
  const normalized = value.toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function sanitizeOptionalUrl(raw: string | null | undefined) {
  if (!raw) {
    return null;
  }

  const trimmed = stripControlChars(raw).trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    if (!["https:", "http:"].includes(url.protocol)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

type SanitizeInternalPathOptions = {
  allowedPrefixes?: string[];
};

function matchesAllowedPrefix(normalizedPath: string, allowedPrefixes: string[]) {
  return allowedPrefixes.some((prefix) => {
    const normalizedPrefix = path.posix.normalize(prefix);
    if (normalizedPrefix === "/") {
      return true;
    }

    if (normalizedPath === normalizedPrefix) {
      return true;
    }

    const withTrailingSlash = normalizedPrefix.endsWith("/")
      ? normalizedPrefix
      : `${normalizedPrefix}/`;
    return normalizedPath.startsWith(withTrailingSlash);
  });
}

export function sanitizeOptionalInternalPath(
  raw: string | null | undefined,
  options?: SanitizeInternalPathOptions,
) {
  if (!raw) {
    return null;
  }

  const trimmed = stripControlChars(raw).trim();
  if (!trimmed) {
    return null;
  }

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  if (trimmed.includes("\\")) {
    return null;
  }

  const specialCharIndex = trimmed.search(/[?#]/);
  const pathname = specialCharIndex >= 0 ? trimmed.slice(0, specialCharIndex) : trimmed;
  const suffix = specialCharIndex >= 0 ? trimmed.slice(specialCharIndex) : "";

  const normalizedPath = path.posix.normalize(pathname);
  if (!normalizedPath.startsWith("/")) {
    return null;
  }

  if (options?.allowedPrefixes && options.allowedPrefixes.length > 0) {
    if (!matchesAllowedPrefix(normalizedPath, options.allowedPrefixes)) {
      return null;
    }
  }

  return `${normalizedPath}${suffix}`;
}

export function sanitizeOptionalAssetUrl(raw: string | null | undefined) {
  const absoluteUrl = sanitizeOptionalUrl(raw);
  if (absoluteUrl) {
    return absoluteUrl;
  }

  return sanitizeOptionalInternalPath(raw, {
    allowedPrefixes: ["/uploads/news", "/assets/img"],
  });
}

export function estimateReadingTime(content: NewsContentDocument) {
  const text = extractNewsContentPlainText(content);
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function toUtcDateOrNull(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export function nowUtc() {
  return new Date();
}

export function neutralApiError(message = "Não foi possível processar a solicitação.") {
  return { message };
}

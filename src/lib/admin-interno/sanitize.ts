const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const PHONE_ALLOWED_REGEX = /[^0-9()+\-\s]/g;

export function sanitizeText(value: unknown, maxLength = 500): string {
  const text = String(value ?? "")
    .replace(CONTROL_CHARS_REGEX, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return "";
  }

  return text.slice(0, maxLength);
}

export function sanitizeLongText(value: unknown, maxLength = 5_000): string {
  const text = String(value ?? "")
    .replace(CONTROL_CHARS_REGEX, "")
    .replace(/\r/g, "")
    .trim();

  if (!text) {
    return "";
  }

  return text.slice(0, maxLength);
}

export function sanitizeEmail(value: unknown): string {
  return sanitizeText(value, 254).toLowerCase();
}

export function sanitizePhone(value: unknown): string {
  const text = sanitizeText(value, 32).replace(PHONE_ALLOWED_REGEX, "");
  return text.slice(0, 32);
}

export function sanitizeSlug(value: unknown): string {
  return sanitizeText(value, 80)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function sanitizePath(value: unknown): string {
  const text = sanitizeText(value, 300);
  if (!text) {
    return "";
  }

  try {
    const parsed = new URL(text, "https://internal.local");
    return `${parsed.pathname}${parsed.search}`.slice(0, 300);
  } catch {
    return text.startsWith("/") ? text.slice(0, 300) : `/${text}`.slice(0, 300);
  }
}

export function maskIpAddress(value: string | null | undefined): string {
  const ip = String(value ?? "").trim();
  if (!ip) {
    return "unknown";
  }

  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.x.x`;
    }
  }

  if (ip.includes(":")) {
    const parts = ip.split(":").filter(Boolean);
    return `${parts.slice(0, 3).join(":")}:*`;
  }

  return "unknown";
}

export function sanitizeCsvCell(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const trimmed = value.replace(/\r?\n/g, " ").trim();
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${trimmed}`;
  }

  return trimmed;
}

const PENDING_LEAD_EMAIL_DOMAIN = "lead-pendente.credpago.local";

export function buildPendingLeadEmail(phone: string | null | undefined) {
  const digits = String(phone ?? "").replace(/\D/g, "").slice(0, 20);
  const suffix = digits || `anon-${Date.now().toString(36)}`;
  return `pendente+${suffix}@${PENDING_LEAD_EMAIL_DOMAIN}`;
}

export function isPendingLeadEmail(email: string | null | undefined) {
  const normalized = String(email ?? "").trim().toLowerCase();
  return normalized.endsWith(`@${PENDING_LEAD_EMAIL_DOMAIN}`);
}

export function getLeadEmailDisplay(email: string | null | undefined) {
  if (isPendingLeadEmail(email)) {
    return "E-mail pendente";
  }

  return String(email ?? "").trim() || "-";
}

export function getLeadEmailValueOrNull(email: string | null | undefined) {
  if (isPendingLeadEmail(email)) {
    return null;
  }

  const normalized = String(email ?? "").trim().toLowerCase();
  return normalized || null;
}


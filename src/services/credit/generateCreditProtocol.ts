import { randomToken } from "@/lib/credit/helpers";

export function generateCreditProtocol() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const suffix = randomToken(8).toUpperCase();
  return `CPG-${yyyy}${mm}${dd}-${suffix}`;
}

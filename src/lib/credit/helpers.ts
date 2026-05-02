import { randomBytes } from "node:crypto";
import type { CreditApplicationStatus } from "@prisma/client";
import { CREDIT_STATUS_LABELS } from "@/lib/credit/constants";

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function maskCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function maskPhoneBr(value: string) {
  const digits = onlyDigits(value).slice(0, 13);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/g, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function formatCurrencyBrl(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number) {
  return `${value.toFixed(2).replace(".", ",")}%`;
}

export function statusLabel(status: CreditApplicationStatus) {
  return CREDIT_STATUS_LABELS[status] ?? status;
}

export function money(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Number(numeric.toFixed(2)));
}

export function randomToken(size = 40) {
  return randomBytes(Math.ceil(size / 2)).toString("hex").slice(0, size);
}

export function futureDateByDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export const CARD_ISSUANCE_PAYMENT_ITEMS = [
  { label: "Taxa de emissão do cartão", value: 9.9 },
  { label: "Frete para entrega", value: 10 },
] as const;

export const CARD_ISSUANCE_PAYMENT_TOTAL = CARD_ISSUANCE_PAYMENT_ITEMS.reduce(
  (total, item) => total + item.value,
  0,
);

export const CARD_ISSUANCE_PAYMENT_CODE = "1990";
export const CARD_ISSUANCE_ROUTE_PREFIX = "/cartao/emissao";

export function isCardIssuancePaidStatus(status: string | null | undefined) {
  return ["COMPLETED", "PAID", "PAGO", "APPROVED", "CONFIRMED", "LIQUIDATED"].includes(
    String(status ?? "").trim().toUpperCase(),
  );
}

export function isCardIssuanceFailedStatus(status: string | null | undefined) {
  return ["FAILED", "EXPIRED", "CANCELED", "CANCELLED", "REJECTED"].includes(
    String(status ?? "").trim().toUpperCase(),
  );
}

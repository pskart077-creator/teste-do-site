import { randomToken } from "@/lib/credit/helpers";
import type { CreditPixProvider } from "@/services/credit/pix/types";

export const mockPixProvider: CreditPixProvider = {
  provider: "MOCK",
  async createCharge(input) {
    const externalId = `mock_${randomToken(22)}`;
    const expiresAt = new Date(Date.now() + (input.expiresInMinutes ?? 30) * 60 * 1000);
    const copyPaste = `00020101021226990014br.gov.bcb.pix2577pix.mock.credpagos/${externalId}520400005303986540${input.amount.toFixed(2)}5802BR5920Credpagos Simulacao6009Sao Paulo62070503***6304ABCD`;

    return {
      provider: "MOCK",
      externalId,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(copyPaste)}`,
      copyPaste,
      expiresAt,
      metadata: {
        mode: "mock",
        description: input.description,
        type: input.type,
      },
    };
  },
  parseWebhookPayload(payload) {
    if (!payload || typeof payload !== "object") {
      return { paid: false };
    }

    const data = payload as Record<string, unknown>;
    return {
      externalId:
        typeof data.externalId === "string"
          ? data.externalId
          : typeof data.txid === "string"
            ? data.txid
            : undefined,
      paid:
        data.status === "PAID" ||
        data.status === "pago" ||
        data.event === "pix_paid" ||
        data.paid === true,
      rawStatus: typeof data.status === "string" ? data.status : undefined,
    };
  },
};

import { ApiError } from "@/lib/news/api";
import { randomToken } from "@/lib/credit/helpers";
import { createVexusPayCashInCharge } from "@/services/credit/pix/vexusPay";
import type { CreditPixProvider, CreatePixChargeInput } from "@/services/credit/pix/types";

function readMetadataString(input: CreatePixChargeInput, key: string) {
  const value = input.metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function getWebhookUrl() {
  const webhookUrl =
    process.env.CREDPAGOS_PIX_WEBHOOK_URL?.trim() || process.env.VEXUSPAY_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    throw new ApiError(
      503,
      "VEXUSPAY_WEBHOOK_NOT_CONFIGURED",
      "Configure CREDPAGOS_PIX_WEBHOOK_URL para gerar cobrança Pix pela VexusPay.",
    );
  }
  return webhookUrl;
}

export const vexusPayProvider: CreditPixProvider = {
  provider: "VEXUSPAY",
  async createCharge(input) {
    const payerName = readMetadataString(input, "payerName");
    const payerDocument = readMetadataString(input, "payerDocument");
    const payerEmail = readMetadataString(input, "payerEmail");
    const transactionId = readMetadataString(input, "transactionId") || `pix_${randomToken(24)}`;

    if (!payerName || !payerDocument) {
      throw new ApiError(
        400,
        "VEXUSPAY_PAYER_REQUIRED",
        "Informe payerName e payerDocument no metadata da cobrança Pix.",
      );
    }

    const charge = await createVexusPayCashInCharge({
      amount: input.amount,
      payerName,
      payerDocument,
      payerEmail,
      transactionId,
      description: input.description,
      projectWebhook: getWebhookUrl(),
    });

    const expiresAt = new Date(Date.now() + (input.expiresInMinutes ?? 30) * 60 * 1000);

    return {
      provider: "VEXUSPAY",
      externalId: charge.transactionId,
      qrCode: charge.qrCodeImageUrl,
      copyPaste: charge.copyPaste,
      expiresAt,
      metadata: {
        providerStatus: charge.status,
        providerMessage: charge.providerMessage,
        ...input.metadata,
      },
    };
  },
  parseWebhookPayload(payload) {
    if (!payload || typeof payload !== "object") {
      return { paid: false };
    }

    const data = payload as Record<string, unknown>;
    const status = typeof data.status === "string" ? data.status.toUpperCase() : "";
    const externalId =
      typeof data.transaction_id === "string"
        ? data.transaction_id
        : typeof data.external_id === "string"
          ? data.external_id
          : typeof data.transactionId === "string"
            ? data.transactionId
            : undefined;

    return {
      externalId,
      paid: ["COMPLETED", "PAID", "PAGO", "APPROVED", "CONFIRMED"].includes(status),
      rawStatus: status,
    };
  },
};

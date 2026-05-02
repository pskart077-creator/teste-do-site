import type { PixProvider } from "@prisma/client";
import type { CreditPixProvider } from "@/services/credit/pix/types";

export function createUnconfiguredProvider(provider: PixProvider): CreditPixProvider {
  return {
    provider,
    async createCharge() {
      throw new Error(
        `Provider PIX ${provider} não configurado. Defina as variáveis de ambiente e implemente o adaptador.`,
      );
    },
    parseWebhookPayload() {
      return { paid: false };
    },
  };
}

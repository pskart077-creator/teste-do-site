import type { PixChargeType, PixProvider } from "@prisma/client";

export type CreatePixChargeInput = {
  amount: number;
  description: string;
  type: PixChargeType;
  expiresInMinutes?: number;
  metadata?: Record<string, unknown>;
};

export type PixChargeResult = {
  provider: PixProvider;
  externalId: string;
  qrCode: string;
  copyPaste: string;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
};

export interface CreditPixProvider {
  provider: PixProvider;
  createCharge(input: CreatePixChargeInput): Promise<PixChargeResult>;
  parseWebhookPayload(payload: unknown): {
    externalId?: string;
    paid: boolean;
    rawStatus?: string;
  };
}

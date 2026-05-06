import type { NextRequest } from "next/server";
import { ApiError, fromUnknownError, ok } from "@/lib/news/api";
import {
  isCardIssuanceFailedStatus,
  isCardIssuancePaidStatus,
} from "@/lib/credit/card-issuance";
import { prisma } from "@/lib/db/prisma";
import { checkVexusPayPixStatus } from "@/services/credit/pix/vexusPay";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

function paymentView(request: {
  issuancePaymentAmount: number;
  issuancePaymentTransactionId: string | null;
  issuancePaymentStatus: string | null;
  issuancePaymentProviderStatus: string | null;
  issuancePaymentQrCode: string | null;
  issuancePaymentCopyPaste: string | null;
  issuancePaymentPaidAt: Date | null;
  issuancePaymentError: string | null;
}) {
  const providerStatus = request.issuancePaymentProviderStatus || request.issuancePaymentStatus || "PENDING";
  const paid = Boolean(request.issuancePaymentPaidAt) || isCardIssuancePaidStatus(providerStatus);
  const failed = isCardIssuanceFailedStatus(providerStatus);

  return {
    amount: request.issuancePaymentAmount,
    transactionId: request.issuancePaymentTransactionId,
    status: paid ? "PAID" : failed ? "FAILED" : providerStatus,
    providerStatus,
    paid,
    failed,
    qrCodeImageUrl: request.issuancePaymentQrCode,
    copyPaste: request.issuancePaymentCopyPaste,
    paidAt: request.issuancePaymentPaidAt?.toISOString() ?? null,
    error: request.issuancePaymentError,
  };
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const cardRequest = await prisma.cardCreditRequest.findUnique({
      where: {
        issuanceToken: token,
      },
    });

    if (!cardRequest || cardRequest.status !== "APPROVED") {
      throw new ApiError(404, "CARD_ISSUANCE_LINK_NOT_FOUND", "Link de emissão inválido ou expirado.");
    }

    if (!cardRequest.issuancePaymentTransactionId) {
      return ok({ payment: paymentView(cardRequest) });
    }

    if (cardRequest.issuancePaymentPaidAt) {
      return ok({ payment: paymentView(cardRequest) });
    }

    const providerStatus = await checkVexusPayPixStatus(cardRequest.issuancePaymentTransactionId);
    const paid = providerStatus.paid;
    const failed = providerStatus.failed;

    const updated = await prisma.cardCreditRequest.update({
      where: {
        id: cardRequest.id,
      },
      data: {
        issuancePaymentStatus: paid ? "PAID" : failed ? "FAILED" : "PENDING",
        issuancePaymentProviderStatus: providerStatus.status,
        issuancePaymentPaidAt: paid ? new Date() : null,
        issuancePaymentError: null,
      },
    });

    return ok({ payment: paymentView(updated) });
  } catch (error) {
    return fromUnknownError(error);
  }
}

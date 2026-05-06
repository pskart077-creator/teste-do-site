import type { NextRequest } from "next/server";
import { ApiError, fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import {
  CARD_ISSUANCE_PAYMENT_CODE,
  CARD_ISSUANCE_PAYMENT_TOTAL,
  isCardIssuanceFailedStatus,
  isCardIssuancePaidStatus,
} from "@/lib/credit/card-issuance";
import { prisma } from "@/lib/db/prisma";
import { createVexusPayCashInCharge } from "@/services/credit/pix/vexusPay";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

type CreateCardIssuancePixBody = {
  forceNew?: boolean;
};

function buildWebhookUrl(request: Request) {
  const configured =
    process.env.CREDPAGOS_PIX_WEBHOOK_URL?.trim() || process.env.VEXUSPAY_WEBHOOK_URL?.trim();
  if (configured) {
    return configured;
  }

  return new URL("/api/credito/pix/vexus/webhook", request.url).toString();
}

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

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const body = await parseJsonBody<CreateCardIssuancePixBody>(request, 20_000).catch(
      () => ({}) as CreateCardIssuancePixBody,
    );
    const cardRequest = await prisma.cardCreditRequest.findUnique({
      where: {
        issuanceToken: token,
      },
    });

    if (!cardRequest || cardRequest.status !== "APPROVED") {
      throw new ApiError(404, "CARD_ISSUANCE_LINK_NOT_FOUND", "Link de emissão inválido ou expirado.");
    }

    if (
      !body.forceNew &&
      cardRequest.issuancePaymentTransactionId &&
      cardRequest.issuancePaymentCopyPaste &&
      !isCardIssuanceFailedStatus(cardRequest.issuancePaymentStatus)
    ) {
      return ok({ payment: paymentView(cardRequest) });
    }

    if (!cardRequest.cpf) {
      throw new ApiError(
        400,
        "CARD_ISSUANCE_DOCUMENT_REQUIRED",
        "CPF não encontrado para gerar o Pix de emissão do cartão.",
      );
    }

    const claimed = await prisma.cardCreditRequest.update({
      where: {
        id: cardRequest.id,
      },
      data: {
        issuanceStartedAt: cardRequest.issuanceStartedAt ?? new Date(),
        issuancePaymentAttempt: {
          increment: 1,
        },
        issuancePaymentStatus: "CREATING",
        issuancePaymentAmount: CARD_ISSUANCE_PAYMENT_TOTAL,
        issuancePaymentError: null,
      },
      select: {
        issuancePaymentAttempt: true,
      },
    });
    const transactionId = `${cardRequest.protocol}-CARD-${CARD_ISSUANCE_PAYMENT_CODE}-${claimed.issuancePaymentAttempt}`;

    try {
      const charge = await createVexusPayCashInCharge({
        amount: CARD_ISSUANCE_PAYMENT_TOTAL,
        payerName: cardRequest.fullName,
        payerDocument: cardRequest.cpf,
        payerEmail: cardRequest.email,
        transactionId,
        description: `Taxa de emissão e frete do cartão Credpagos - ${cardRequest.protocol}`,
        projectWebhook: buildWebhookUrl(request),
      });
      const paid = isCardIssuancePaidStatus(charge.status);

      const updated = await prisma.cardCreditRequest.update({
        where: {
          id: cardRequest.id,
        },
        data: {
          issuancePaymentStatus: paid ? "PAID" : "PENDING",
          issuancePaymentTransactionId: charge.transactionId,
          issuancePaymentProviderStatus: charge.status,
          issuancePaymentQrCode: charge.qrCodeImageUrl,
          issuancePaymentCopyPaste: charge.copyPaste,
          issuancePaymentCreatedAt: new Date(),
          issuancePaymentPaidAt: paid ? new Date() : null,
          issuancePaymentError: null,
        },
      });

      return ok({ payment: paymentView(updated) }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível gerar o Pix.";

      await prisma.cardCreditRequest.update({
        where: {
          id: cardRequest.id,
        },
        data: {
          issuancePaymentStatus: "ERROR",
          issuancePaymentError: message.slice(0, 1000),
        },
      });

      throw error;
    }
  } catch (error) {
    return fromUnknownError(error);
  }
}

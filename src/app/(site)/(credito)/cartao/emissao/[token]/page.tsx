import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardIssuanceFlow, type CardIssuanceRequestView } from "@/components/credito/CardIssuanceFlow";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { isCardIssuanceFailedStatus, isCardIssuancePaidStatus } from "@/lib/credit/card-issuance";
import { prisma } from "@/lib/db/prisma";

type Props = {
  params: Promise<{
    token: string;
  }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Emissão do cartão | Credpagos",
  robots: {
    index: false,
    follow: false,
  },
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

export default async function CardIssuancePage({ params }: Props) {
  const { token } = await params;
  const cardRequest = await prisma.cardCreditRequest.findUnique({
    where: {
      issuanceToken: token,
    },
  });

  if (!cardRequest || cardRequest.status !== "APPROVED" || !cardRequest.issuanceToken) {
    notFound();
  }

  const requestView: CardIssuanceRequestView = {
    token: cardRequest.issuanceToken,
    protocol: cardRequest.protocol,
    fullName: cardRequest.fullName,
    email: cardRequest.email,
    approvedLimit: cardRequest.approvedLimit,
    invoiceDueDay: cardRequest.invoiceDueDay,
    address: {
      zipCode: cardRequest.zipCode,
      street: cardRequest.street,
      number: cardRequest.number,
      complement: cardRequest.complement,
      neighborhood: cardRequest.neighborhood,
      city: cardRequest.city,
      state: cardRequest.state,
    },
    payment: paymentView(cardRequest),
  };

  return (
    <>
      <section className="credpagos-credito-page credpagos-card-page">
        <div className="credpagos-credito-container">
          <CardIssuanceFlow request={requestView} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}

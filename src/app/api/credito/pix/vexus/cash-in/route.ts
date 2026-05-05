import { ApiError, fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { createVexusPayCashInCharge } from "@/services/credit/pix/vexusPay";

const PIX_ANALYSIS_FEE_AMOUNT = 19.9;
const PIX_ANALYSIS_FEE_CODE = "1990";

type CreateCashInBody = {
  protocol?: string;
  transactionId?: string;
  payerName?: string;
  payerDocument?: string;
  payerEmail?: string;
  amount?: number;
  description?: string;
};

function buildWebhookUrl(request: Request) {
  const configured =
    process.env.CREDPAGOS_PIX_WEBHOOK_URL?.trim() || process.env.VEXUSPAY_WEBHOOK_URL?.trim();
  if (configured) {
    return configured;
  }

  return new URL("/api/credito/pix/vexus/webhook", request.url).toString();
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<CreateCashInBody>(request, 80_000);
    const protocol = body.protocol?.trim();
    const transactionId = body.transactionId?.trim() || (protocol ? `${protocol}-PIX-${PIX_ANALYSIS_FEE_CODE}` : "");

    if (!transactionId || !body.payerName || !body.payerDocument) {
      throw new ApiError(
        400,
        "INVALID_PIX_CASH_IN_REQUEST",
        "Dados insuficientes para gerar a cobrança Pix do cliente.",
      );
    }

    const amountFromRequest =
      typeof body.amount === "number" && Number.isFinite(body.amount) && body.amount >= 5
        ? Number(body.amount.toFixed(2))
        : PIX_ANALYSIS_FEE_AMOUNT;

    const charge = await createVexusPayCashInCharge({
      amount: amountFromRequest,
      payerName: body.payerName,
      payerDocument: body.payerDocument,
      payerEmail: body.payerEmail,
      transactionId,
      description:
        body.description?.trim() ||
        (protocol
          ? `Cobrança Pix reembolsável da solicitação ${protocol}`
          : "Cobrança Pix reembolsável da solicitação de crédito"),
      projectWebhook: buildWebhookUrl(request),
    });

    return ok({ charge }, { status: 201 });
  } catch (error) {
    return fromUnknownError(error);
  }
}

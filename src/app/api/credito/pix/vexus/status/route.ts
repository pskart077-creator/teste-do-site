import { ApiError, fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { checkVexusPayPixStatus } from "@/services/credit/pix/vexusPay";

type CheckPixBody = {
  transactionId?: string;
};

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<CheckPixBody>(request, 20_000);
    const transactionId = body.transactionId?.trim();

    if (!transactionId) {
      throw new ApiError(400, "TRANSACTION_ID_REQUIRED", "Informe o transactionId do Pix.");
    }

    const status = await checkVexusPayPixStatus(transactionId);
    return ok({ status });
  } catch (error) {
    return fromUnknownError(error);
  }
}

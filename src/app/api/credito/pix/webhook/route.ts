import { fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { handlePixWebhook } from "@/services/credit/pix/handlePixWebhook";

export async function POST(request: Request) {
  try {
    const payload = await parseJsonBody<unknown>(request, 400_000);
    const result = await handlePixWebhook(payload);
    return ok(result);
  } catch (error) {
    return fromUnknownError(error);
  }
}

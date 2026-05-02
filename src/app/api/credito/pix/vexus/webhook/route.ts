import { fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";

export async function POST(request: Request) {
  try {
    await parseJsonBody<unknown>(request, 400_000);
    return ok({ received: true });
  } catch (error) {
    return fromUnknownError(error);
  }
}

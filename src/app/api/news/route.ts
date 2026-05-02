import type { NextRequest } from "next/server";
import { fromUnknownError, ok } from "@/lib/news/api";
import { RATE_LIMIT_WINDOWS } from "@/lib/news/constants";
import { asRateLimitResponse, getRequestIp, requireRateLimit } from "@/lib/news/http";
import { listPublicNews } from "@/lib/news/queries";
import { publicNewsQuerySchema } from "@/lib/news/validators";

export async function GET(request: NextRequest) {
  try {
    requireRateLimit(`public-news:${getRequestIp(request)}`, RATE_LIMIT_WINDOWS.publicApi);

    const query = publicNewsQuerySchema.parse({
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      category: request.nextUrl.searchParams.get("category") ?? undefined,
      tag: request.nextUrl.searchParams.get("tag") ?? undefined,
      featured: request.nextUrl.searchParams.get("featured") ?? undefined,
    });

    const result = await listPublicNews({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      category: query.category,
      tag: query.tag,
      featuredOnly: query.featured,
    });

    return ok(result);
  } catch (error) {
    return asRateLimitResponse(error) ?? fromUnknownError(error);
  }
}

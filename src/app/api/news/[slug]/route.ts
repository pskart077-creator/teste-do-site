import type { NextRequest } from "next/server";
import { ApiError, fromUnknownError, ok } from "@/lib/news/api";
import { RATE_LIMIT_WINDOWS } from "@/lib/news/constants";
import { asRateLimitResponse, getRequestIp, requireRateLimit } from "@/lib/news/http";
import { getPublicNewsBySlug, getRelatedPublicNews } from "@/lib/news/queries";
import { slugParamSchema } from "@/lib/news/validators";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    requireRateLimit(`public-news-detail:${getRequestIp(request)}`, RATE_LIMIT_WINDOWS.publicApi);

    const { slug } = slugParamSchema.parse(await context.params);
    const post = await getPublicNewsBySlug(slug);

    if (!post) {
      throw new ApiError(404, "NEWS_NOT_FOUND", "Notícia não encontrada.");
    }

    const related = await getRelatedPublicNews(post.id, post.category.id, 3);

    return ok({
      post,
      related,
    });
  } catch (error) {
    return asRateLimitResponse(error) ?? fromUnknownError(error);
  }
}

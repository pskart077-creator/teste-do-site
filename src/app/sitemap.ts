import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { getSiteUrl } from "@/lib/news/helpers";
import { publishDueScheduledPosts } from "@/lib/news/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticRoutes = [
    "",
    "/sobre",
    "/contato",
    "/duvidas-frequentes",
    "/solucoes",
    "/segmentos",
    "/seguranca",
    "/solucoes/credito-para-pf",
    "/solucoes/credito-para-pj",
    "/news",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/news" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  if (!process.env.DATABASE_URL?.trim()) {
    return staticEntries;
  }

  let posts: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    await publishDueScheduledPosts();
    posts = await prisma.newsPost.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        allowIndexing: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  } catch {
    return staticEntries;
  }

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/news/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...postEntries];
}

import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/news/helpers";
import type { PublicNewsDetailDto } from "@/lib/news/mappings";

const SITE_NAME = "Credpagos";

export function buildNewsListMetadata(params?: {
  page?: number;
  search?: string;
  category?: string;
  tag?: string;
}): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = new URL("/news", siteUrl);

  if (params?.page && params.page > 1) {
    canonical.searchParams.set("page", String(params.page));
  }
  if (params?.search) {
    canonical.searchParams.set("search", params.search);
  }
  if (params?.category) {
    canonical.searchParams.set("category", params.category);
  }
  if (params?.tag) {
    canonical.searchParams.set("tag", params.tag);
  }

  const title = "News";
  const description =
    "Notícias, atualizações e análises da Credpagos com foco em tecnologia, segurança e mercado.";

  return {
    title,
    description,
    alternates: {
      canonical: canonical.toString(),
    },
    openGraph: {
      type: "website",
      url: canonical.toString(),
      siteName: SITE_NAME,
      locale: "pt_BR",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function buildNewsPostMetadata(post: PublicNewsDetailDto): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = post.seo.canonicalUrl || `${siteUrl}/news/${post.slug}`;
  const title = post.seo.title || post.title;
  const description = post.seo.description || post.excerpt;
  const ogImage = post.seo.ogImage || post.coverImageUrl || undefined;

  return {
    title,
    description,
    keywords: post.seo.keywords
      ? post.seo.keywords.split(",").map((keyword) => keyword.trim())
      : undefined,
    alternates: {
      canonical,
    },
    robots: {
      index: post.seo.allowIndexing,
      follow: post.seo.allowIndexing,
      nocache: !post.seo.allowIndexing,
      googleBot: {
        index: post.seo.allowIndexing,
        follow: post.seo.allowIndexing,
      },
    },
    openGraph: {
      type: "article",
      locale: "pt_BR",
      siteName: SITE_NAME,
      url: canonical,
      title: post.seo.ogTitle || title,
      description: post.seo.ogDescription || description,
      publishedTime: post.publishedAt || undefined,
      authors: [post.author.name],
      tags: post.tags.map((tag) => tag.name),
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                alt: post.coverImageAlt || post.title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo.twitterTitle || title,
      description: post.seo.twitterDescription || description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export function buildNewsArticleJsonLd(post: PublicNewsDetailDto) {
  const siteUrl = getSiteUrl();
  const canonical = post.seo.canonicalUrl || `${siteUrl}/news/${post.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    url: canonical,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
    },
    mainEntityOfPage: canonical,
    image: post.coverImageUrl || undefined,
    articleSection: post.category.name,
    keywords: post.seo.keywords || post.tags.map((tag) => tag.name).join(", "),
    wordCount: post.readingTime * 220,
    inLanguage: "pt-BR",
  };
}

export function buildNewsBreadcrumbJsonLd(post: PublicNewsDetailDto) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "News",
        item: `${siteUrl}/news`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${siteUrl}/news/${post.slug}`,
      },
    ],
  };
}
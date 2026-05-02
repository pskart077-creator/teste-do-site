import type { NewsStatus, Prisma } from "@prisma/client";
import type { NewsContentDocument } from "@/lib/news/types";

export type PublicNewsCardDto = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  publishedAt: string | null;
  readingTime: number;
  featured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  };
  author: {
    id: string;
    name: string;
  };
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
};

export type PublicNewsDetailDto = PublicNewsCardDto & {
  content: NewsContentDocument;
  seo: {
    title: string | null;
    description: string | null;
    keywords: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    twitterTitle: string | null;
    twitterDescription: string | null;
    canonicalUrl: string | null;
    allowIndexing: boolean;
  };
  status: NewsStatus;
  cta: {
    title: string | null;
    description: string | null;
    buttonLabel: string | null;
    buttonUrl: string | null;
  };
};

export type AdminNewsListDto = {
  id: string;
  title: string;
  slug: string;
  status: NewsStatus;
  featured: boolean;
  highlightOnHome: boolean;
  category: {
    id: string;
    name: string;
  };
  author: {
    id: string;
    name: string;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
  publishedAt: string | null;
  scheduledAt: string | null;
  updatedAt: string;
};

type PublicPostPayload = Prisma.NewsPostGetPayload<{
  include: {
    category: true;
    author: true;
    tags: {
      include: {
        tag: true;
      };
    };
  };
}>;

export function mapPostToPublicCard(post: PublicPostPayload): PublicNewsCardDto {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageUrl,
    coverImageAlt: post.coverImageAlt,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    readingTime: post.readingTime,
    featured: post.featured,
    category: {
      id: post.category.id,
      name: post.category.name,
      slug: post.category.slug,
      color: post.category.color,
    },
    author: {
      id: post.author.id,
      name: post.author.displayName,
    },
    tags: post.tags.map((tagRelation) => ({
      id: tagRelation.tag.id,
      name: tagRelation.tag.name,
      slug: tagRelation.tag.slug,
    })),
  };
}

export function mapPostToPublicDetail(post: PublicPostPayload): PublicNewsDetailDto {
  return {
    ...mapPostToPublicCard(post),
    content: post.content as NewsContentDocument,
    seo: {
      title: post.seoTitle,
      description: post.seoDescription,
      keywords: post.seoKeywords,
      ogTitle: post.ogTitle,
      ogDescription: post.ogDescription,
      ogImage: post.ogImage,
      twitterTitle: post.twitterTitle,
      twitterDescription: post.twitterDescription,
      canonicalUrl: post.canonicalUrl,
      allowIndexing: post.allowIndexing,
    },
    status: post.status,
    cta: {
      title: post.ctaTitle,
      description: post.ctaDescription,
      buttonLabel: post.ctaButtonLabel,
      buttonUrl: post.ctaButtonUrl,
    },
  };
}

type AdminPostPayload = Prisma.NewsPostGetPayload<{
  include: {
    category: true;
    author: true;
    tags: {
      include: {
        tag: true;
      };
    };
  };
}>;

export function mapPostToAdminList(post: AdminPostPayload): AdminNewsListDto {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    featured: post.featured,
    highlightOnHome: post.highlightOnHome,
    category: {
      id: post.category.id,
      name: post.category.name,
    },
    author: {
      id: post.author.id,
      name: post.author.displayName,
    },
    tags: post.tags.map((item) => ({
      id: item.tag.id,
      name: item.tag.name,
    })),
    publishedAt: post.publishedAt?.toISOString() ?? null,
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    updatedAt: post.updatedAt.toISOString(),
  };
}

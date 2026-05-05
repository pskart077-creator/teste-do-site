import { NewsStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { NEWS_CONTENT_BLOCK_LIMIT, NEWS_TAG_LIMIT } from "@/lib/news/constants";
import { hasMeaningfulHtmlContent, sanitizeNewsHtml } from "@/lib/news/content";
import type { NewsContentDocument } from "@/lib/news/types";

function isAllowedLocalAssetPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return false;
  }

  const pathname = value.split(/[?#]/, 1)[0] ?? "";
  if (!pathname.startsWith("/uploads/news/") && !pathname.startsWith("/assets/img/")) {
    return false;
  }

  const segments = pathname.split("/");
  if (segments.includes("..") || segments.includes(".")) {
    return false;
  }

  return true;
}

const urlOrAllowedLocalAssetSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return isAllowedLocalAssetPath(value);
    }
  }, "URL inválida.");

const headingSchema = z
  .object({
    type: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    text: z.string().trim().min(1).max(180),
  })
  .strict();

const paragraphSchema = z
  .object({
    type: z.literal("paragraph"),
    text: z.string().trim().min(1).max(6000),
  })
  .strict();

const listSchema = z
  .object({
    type: z.literal("list"),
    ordered: z.boolean(),
    items: z.array(z.string().trim().min(1).max(500)).min(1).max(80),
  })
  .strict();

const quoteSchema = z
  .object({
    type: z.literal("quote"),
    text: z.string().trim().min(1).max(1200),
    cite: z.string().trim().max(160).optional(),
  })
  .strict();

const imageSchema = z
  .object({
    type: z.literal("image"),
    url: urlOrAllowedLocalAssetSchema,
    alt: z.string().trim().min(1).max(220),
    caption: z.string().trim().max(320).optional(),
  })
  .strict();

const calloutSchema = z
  .object({
    type: z.literal("callout"),
    variant: z.enum(["info", "warning", "success"]),
    title: z.string().trim().max(140).optional(),
    text: z.string().trim().min(1).max(900),
  })
  .strict();

const faqSchema = z
  .object({
    type: z.literal("faq"),
    items: z
      .array(
        z
          .object({
            question: z.string().trim().min(1).max(240),
            answer: z.string().trim().min(1).max(1200),
          })
          .strict(),
      )
      .min(1)
      .max(25),
  })
  .strict();

const ctaSchema = z
  .object({
    type: z.literal("cta"),
    title: z.string().trim().min(1).max(120),
    text: z.string().trim().min(1).max(420),
    buttonLabel: z.string().trim().min(1).max(60),
    buttonUrl: z.string().trim().url().max(2048),
  })
  .strict();

const tableSchema = z
  .object({
    type: z.literal("table"),
    headers: z.array(z.string().trim().min(1).max(120)).min(1).max(10),
    rows: z.array(z.array(z.string().trim().max(400)).min(1).max(10)).min(1).max(40),
  })
  .strict();

const embedSchema = z
  .object({
    type: z.literal("embed"),
    provider: z.enum(["youtube", "vimeo", "generic"]),
    url: z.string().trim().url().max(2048),
  })
  .strict();

const dividerSchema = z
  .object({
    type: z.literal("divider"),
  })
  .strict();

export const newsContentBlockSchema = z.discriminatedUnion("type", [
  headingSchema,
  paragraphSchema,
  listSchema,
  quoteSchema,
  imageSchema,
  calloutSchema,
  faqSchema,
  ctaSchema,
  tableSchema,
  embedSchema,
  dividerSchema,
]);

const legacyNewsContentDocumentSchema = z
  .object({
    version: z.literal(1),
    blocks: z.array(newsContentBlockSchema).min(1).max(NEWS_CONTENT_BLOCK_LIMIT),
  })
  .strict();

const htmlNewsContentDocumentSchema = z
  .object({
    version: z.literal(2),
    format: z.literal("html"),
    html: z.string().trim().min(1).max(48_000),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!hasMeaningfulHtmlContent(sanitizeNewsHtml(value.html))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Conteúdo HTML vazio ou inválido.",
        path: ["html"],
      });
    }
  });

export const newsContentDocumentSchema = z.discriminatedUnion("version", [
  legacyNewsContentDocumentSchema,
  htmlNewsContentDocumentSchema,
]);

export const newsStatusSchema = z.nativeEnum(NewsStatus);

const canonicalOrEmpty = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .nullable();

const textOrEmpty = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .nullable();

const createNewsPostSchemaBase = z
  .object({
    title: z.string().trim().min(6).max(180),
    slug: z.string().trim().min(3).max(120).optional().nullable(),
    excerpt: z.string().trim().min(16).max(420),
    content: newsContentDocumentSchema,
    coverImageUrl: canonicalOrEmpty,
    coverImageAlt: textOrEmpty(220),
    categoryId: z.string().trim().min(1).max(40),
    tagIds: z.array(z.string().trim().min(1).max(40)).max(NEWS_TAG_LIMIT).default([]),
    status: newsStatusSchema.default(NewsStatus.DRAFT),
    publishedAt: z.string().datetime().optional().nullable(),
    scheduledAt: z.string().datetime().optional().nullable(),
    featured: z.boolean().default(false),
    highlightOnHome: z.boolean().default(false),
    canonicalUrl: canonicalOrEmpty,
    allowIndexing: z.boolean().default(true),
    seoTitle: textOrEmpty(180),
    seoDescription: textOrEmpty(320),
    seoKeywords: textOrEmpty(320),
    ogTitle: textOrEmpty(180),
    ogDescription: textOrEmpty(320),
    ogImage: canonicalOrEmpty,
    twitterTitle: textOrEmpty(180),
    twitterDescription: textOrEmpty(320),
    ctaTitle: textOrEmpty(120),
    ctaDescription: textOrEmpty(420),
    ctaButtonLabel: textOrEmpty(60),
    ctaButtonUrl: canonicalOrEmpty,
  })
  .strict();

export const createNewsPostSchema = createNewsPostSchemaBase
  .superRefine((value, ctx) => {
    if (value.status === NewsStatus.SCHEDULED && !value.scheduledAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de agendamento obrigatória para status agendado.",
        path: ["scheduledAt"],
      });
    }

    if (value.status === NewsStatus.PUBLISHED && !value.publishedAt && !value.scheduledAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de publicação obrigatória para status publicado.",
        path: ["publishedAt"],
      });
    }

    if (value.status === NewsStatus.PUBLISHED && value.publishedAt) {
      const publicationDate = new Date(value.publishedAt);
      if (!Number.isNaN(publicationDate.getTime()) && publicationDate.getTime() > Date.now() + 60_000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Data futura não permitida para status publicado. Use status agendado.",
          path: ["publishedAt"],
        });
      }
    }
  });

export const updateNewsPostSchema = z
  .object({
    title: z.string().trim().min(6).max(180).optional(),
    slug: z.string().trim().min(3).max(120).optional().nullable(),
    excerpt: z.string().trim().min(16).max(420).optional(),
    content: newsContentDocumentSchema.optional(),
    coverImageUrl: canonicalOrEmpty.optional(),
    coverImageAlt: textOrEmpty(220).optional(),
    categoryId: z.string().trim().min(1).max(40).optional(),
    tagIds: z.array(z.string().trim().min(1).max(40)).max(NEWS_TAG_LIMIT).optional(),
    status: newsStatusSchema.optional(),
    publishedAt: z.string().datetime().optional().nullable(),
    scheduledAt: z.string().datetime().optional().nullable(),
    featured: z.boolean().optional(),
    highlightOnHome: z.boolean().optional(),
    canonicalUrl: canonicalOrEmpty.optional(),
    allowIndexing: z.boolean().optional(),
    seoTitle: textOrEmpty(180).optional(),
    seoDescription: textOrEmpty(320).optional(),
    seoKeywords: textOrEmpty(320).optional(),
    ogTitle: textOrEmpty(180).optional(),
    ogDescription: textOrEmpty(320).optional(),
    ogImage: canonicalOrEmpty.optional(),
    twitterTitle: textOrEmpty(180).optional(),
    twitterDescription: textOrEmpty(320).optional(),
    ctaTitle: textOrEmpty(120).optional(),
    ctaDescription: textOrEmpty(420).optional(),
    ctaButtonLabel: textOrEmpty(60).optional(),
    ctaButtonUrl: canonicalOrEmpty.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.status === NewsStatus.SCHEDULED && !value.scheduledAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de agendamento obrigatória para status agendado.",
        path: ["scheduledAt"],
      });
    }

    if (value.status === NewsStatus.PUBLISHED && !value.publishedAt && !value.scheduledAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de publicação obrigatória para status publicado.",
        path: ["publishedAt"],
      });
    }

    if (value.status === NewsStatus.PUBLISHED && value.publishedAt) {
      const publicationDate = new Date(value.publishedAt);
      if (!Number.isNaN(publicationDate.getTime()) && publicationDate.getTime() > Date.now() + 60_000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Data futura não permitida para status publicado. Use status agendado.",
          path: ["publishedAt"],
        });
      }
    }
  });

export const loginSchema = z
  .object({
    email: z.string().trim().email().max(320),
    password: z.string().min(8).max(128),
  })
  .strict();

export const publicNewsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(30).default(12),
    search: z.string().trim().max(180).default(""),
    category: z.string().trim().max(80).default(""),
    tag: z.string().trim().max(80).default(""),
    featured: z
      .enum(["true", "false", "1", "0", "yes", "no"])
      .optional()
      .default("false")
      .transform((value) => ["true", "1", "yes"].includes(value)),
  })
  .strict();

export const adminNewsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().max(180).default(""),
    status: z.nativeEnum(NewsStatus).optional(),
    categoryId: z.string().trim().max(40).optional(),
    tagId: z.string().trim().max(40).optional(),
    orderBy: z.enum(["newest", "oldest", "updated"]).default("newest"),
  })
  .strict();

export const categoryCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    slug: z.string().trim().min(2).max(120).optional().nullable(),
    description: z.string().trim().max(400).optional().nullable(),
    color: z.string().trim().max(12).optional().nullable(),
    allowIndexing: z.boolean().default(true),
  })
  .strict();

export const categoryUpdateSchema = categoryCreateSchema.partial().strict();

export const tagCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    slug: z.string().trim().min(2).max(120).optional().nullable(),
  })
  .strict();

export const tagUpdateSchema = tagCreateSchema.partial().strict();

export const publishSchema = z
  .object({
    publishedAt: z.string().datetime().optional().nullable(),
  })
  .strict();

export const idParamSchema = z
  .object({
    id: z.string().trim().min(1).max(40),
  })
  .strict();

export const slugParamSchema = z
  .object({
    slug: z.string().trim().min(2).max(120),
  })
  .strict();

export const roleSchema = z.nativeEnum(UserRole);

export type CreateNewsPostInput = z.infer<typeof createNewsPostSchema>;
export type UpdateNewsPostInput = z.infer<typeof updateNewsPostSchema>;
export type NewsContentInput = z.infer<typeof newsContentDocumentSchema>;

export function parseNewsContent(input: unknown): NewsContentDocument {
  return newsContentDocumentSchema.parse(input) as NewsContentDocument;
}

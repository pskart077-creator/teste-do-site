import { randomBytes } from "node:crypto";
import { NewsStatus, type Prisma, type UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/news/api";
import {
  ensureValidSlug,
  estimateReadingTime,
  nowUtc,
  sanitizeMultilineText,
  sanitizeOptionalAssetUrl,
  sanitizeOptionalUrl,
  sanitizePlainText,
  toUtcDateOrNull,
} from "@/lib/news/helpers";
import {
  mapPostToAdminList,
  mapPostToPublicCard,
  mapPostToPublicDetail,
} from "@/lib/news/mappings";
import { canManageTaxonomy, canPublish } from "@/lib/news/permissions";
import {
  sanitizeCanonicalUrl,
  sanitizeHexColor,
  sanitizeNewsContentDocument,
  sanitizeSeoKeywords,
  sanitizeSlugOrNull,
} from "@/lib/news/sanitizers";
import type {
  AdminNewsDashboardOverview,
  AdminNewsQueryInput,
  AuthenticatedAdmin,
  PublicNewsQueryInput,
} from "@/lib/news/types";
import type { CreateNewsPostInput, UpdateNewsPostInput } from "@/lib/news/validators";

const publicPostInclude = {
  category: true,
  author: true,
  tags: {
    include: {
      tag: true,
    },
  },
} satisfies Prisma.NewsPostInclude;

const adminPostInclude = {
  category: true,
  author: true,
  tags: {
    include: {
      tag: true,
    },
  },
} satisfies Prisma.NewsPostInclude;

const MAX_SANITIZED_SLUG_LENGTH = ensureValidSlug("a".repeat(256)).length;

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function composeSlugCandidate(baseSlug: string, suffix: string) {
  if (!suffix) {
    return ensureValidSlug(baseSlug);
  }

  const maxBaseLength = Math.max(1, MAX_SANITIZED_SLUG_LENGTH - suffix.length);
  const trimmedBase = baseSlug.slice(0, maxBaseLength).replace(/-+$/g, "");
  return ensureValidSlug(`${trimmedBase || baseSlug.slice(0, maxBaseLength)}${suffix}`);
}

async function buildUniqueSlugFromDesired(
  desiredSlug: string,
  exists: (candidate: string) => Promise<boolean>,
) {
  const baseSlug = ensureValidSlug(desiredSlug);
  const maxAttempts = 160;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const suffix =
      attempt === 0
        ? ""
        : attempt <= 40
          ? `-${attempt + 1}`
          : `-${randomBytes(2).toString("hex")}`;

    const candidate = composeSlugCandidate(baseSlug, suffix);
    if (!(await exists(candidate))) {
      return candidate;
    }
  }

  throw new ApiError(500, "SLUG_GENERATION_FAILED", "Não foi possível gerar slug único.");
}

async function buildUniquePostSlug(desiredSlug: string, excludePostId?: string) {
  return buildUniqueSlugFromDesired(desiredSlug, async (candidate) => {
    const existing = await prisma.newsPost.findFirst({
      where: {
        slug: candidate,
        deletedAt: null,
        ...(excludePostId
          ? {
              id: {
                not: excludePostId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    return Boolean(existing);
  });
}

async function buildUniqueCategorySlug(desiredSlug: string, excludeCategoryId?: string) {
  return buildUniqueSlugFromDesired(desiredSlug, async (candidate) => {
    const existing = await prisma.newsCategory.findFirst({
      where: {
        slug: candidate,
        deletedAt: null,
        ...(excludeCategoryId
          ? {
              id: {
                not: excludeCategoryId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    return Boolean(existing);
  });
}

async function buildUniqueTagSlug(desiredSlug: string, excludeTagId?: string) {
  return buildUniqueSlugFromDesired(desiredSlug, async (candidate) => {
    const existing = await prisma.newsTag.findFirst({
      where: {
        slug: candidate,
        deletedAt: null,
        ...(excludeTagId
          ? {
              id: {
                not: excludeTagId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    return Boolean(existing);
  });
}

function normalizeStatusLifecycle(input: {
  status?: NewsStatus;
  publishedAt?: string | null;
  scheduledAt?: string | null;
}) {
  const status = input.status ?? NewsStatus.DRAFT;
  const providedPublishedAt = toUtcDateOrNull(input.publishedAt);
  const providedScheduledAt = toUtcDateOrNull(input.scheduledAt);

  if (status === NewsStatus.SCHEDULED) {
    if (!providedScheduledAt) {
      throw new ApiError(
        400,
        "SCHEDULED_DATE_REQUIRED",
        "Data de agendamento obrigatória para status agendado.",
      );
    }

    if (providedScheduledAt.getTime() <= Date.now()) {
      return {
        status: NewsStatus.PUBLISHED,
        publishedAt: providedScheduledAt,
        scheduledAt: providedScheduledAt,
      };
    }

    return {
      status: NewsStatus.SCHEDULED,
      publishedAt: null,
      scheduledAt: providedScheduledAt,
    };
  }

  if (status === NewsStatus.PUBLISHED) {
    const publicationDate = providedPublishedAt ?? nowUtc();

    if (publicationDate.getTime() > Date.now() + 60_000) {
      throw new ApiError(
        400,
        "PUBLISHED_AT_IN_FUTURE",
        "Data de publicação futura não permitida para status publicado. Use status agendado.",
      );
    }

    return {
      status: NewsStatus.PUBLISHED,
      publishedAt: publicationDate,
      scheduledAt: providedScheduledAt,
    };
  }

  if (status === NewsStatus.ARCHIVED) {
    return {
      status: NewsStatus.ARCHIVED,
      publishedAt: providedPublishedAt,
      scheduledAt: null,
    };
  }

  return {
    status: NewsStatus.DRAFT,
    publishedAt: providedPublishedAt,
    scheduledAt: providedScheduledAt,
  };
}

function buildPostData(
  input: CreateNewsPostInput,
  authorId: string,
  slug: string,
): Prisma.NewsPostUncheckedCreateInput {
  const content = sanitizeNewsContentDocument(input.content);
  const lifecycle = normalizeStatusLifecycle({
    status: input.status,
    publishedAt: input.publishedAt,
    scheduledAt: input.scheduledAt,
  });

  const ctaButtonUrl = sanitizeOptionalUrl(input.ctaButtonUrl ?? undefined);

  return {
    title: sanitizePlainText(input.title, 180),
    slug,
    excerpt: sanitizeMultilineText(input.excerpt, 420),
    content: content as Prisma.InputJsonValue,
    coverImageUrl: sanitizeOptionalAssetUrl(input.coverImageUrl ?? undefined),
    coverImageAlt: sanitizePlainText(input.coverImageAlt ?? "", 220) || null,
    categoryId: input.categoryId,
    authorId,
    status: lifecycle.status,
    publishedAt: lifecycle.publishedAt,
    scheduledAt: lifecycle.scheduledAt,
    readingTime: estimateReadingTime(content),
    featured: Boolean(input.featured),
    highlightOnHome: Boolean(input.highlightOnHome),
    canonicalUrl: sanitizeCanonicalUrl(input.canonicalUrl),
    allowIndexing: Boolean(input.allowIndexing),
    seoTitle: sanitizePlainText(input.seoTitle ?? "", 180) || null,
    seoDescription: sanitizeMultilineText(input.seoDescription ?? "", 320) || null,
    seoKeywords: sanitizeSeoKeywords(input.seoKeywords),
    ogTitle: sanitizePlainText(input.ogTitle ?? "", 180) || null,
    ogDescription: sanitizeMultilineText(input.ogDescription ?? "", 320) || null,
    ogImage: sanitizeOptionalAssetUrl(input.ogImage ?? undefined),
    twitterTitle: sanitizePlainText(input.twitterTitle ?? "", 180) || null,
    twitterDescription: sanitizeMultilineText(input.twitterDescription ?? "", 320) || null,
    ctaTitle: sanitizePlainText(input.ctaTitle ?? "", 120) || null,
    ctaDescription: sanitizeMultilineText(input.ctaDescription ?? "", 420) || null,
    ctaButtonLabel: sanitizePlainText(input.ctaButtonLabel ?? "", 60) || null,
    ctaButtonUrl,
  };
}

function buildUpdateData(input: UpdateNewsPostInput): Prisma.NewsPostUncheckedUpdateInput {
  const data: Prisma.NewsPostUncheckedUpdateInput = {};

  if (input.title !== undefined) {
    data.title = sanitizePlainText(input.title ?? "", 180);
  }
  if (input.excerpt !== undefined) {
    data.excerpt = sanitizeMultilineText(input.excerpt ?? "", 420);
  }
  if (input.content !== undefined) {
    const content = sanitizeNewsContentDocument(input.content);
    data.content = content as Prisma.InputJsonValue;
    data.readingTime = estimateReadingTime(content);
  }
  if (input.coverImageUrl !== undefined) {
    data.coverImageUrl = sanitizeOptionalAssetUrl(input.coverImageUrl ?? undefined);
  }
  if (input.coverImageAlt !== undefined) {
    data.coverImageAlt = sanitizePlainText(input.coverImageAlt ?? "", 220) || null;
  }
  if (input.categoryId !== undefined) {
    data.categoryId = input.categoryId;
  }
  if (input.featured !== undefined) {
    data.featured = Boolean(input.featured);
  }
  if (input.highlightOnHome !== undefined) {
    data.highlightOnHome = Boolean(input.highlightOnHome);
  }
  if (input.canonicalUrl !== undefined) {
    data.canonicalUrl = sanitizeCanonicalUrl(input.canonicalUrl);
  }
  if (input.allowIndexing !== undefined) {
    data.allowIndexing = Boolean(input.allowIndexing);
  }
  if (input.seoTitle !== undefined) {
    data.seoTitle = sanitizePlainText(input.seoTitle ?? "", 180) || null;
  }
  if (input.seoDescription !== undefined) {
    data.seoDescription = sanitizeMultilineText(input.seoDescription ?? "", 320) || null;
  }
  if (input.seoKeywords !== undefined) {
    data.seoKeywords = sanitizeSeoKeywords(input.seoKeywords);
  }
  if (input.ogTitle !== undefined) {
    data.ogTitle = sanitizePlainText(input.ogTitle ?? "", 180) || null;
  }
  if (input.ogDescription !== undefined) {
    data.ogDescription = sanitizeMultilineText(input.ogDescription ?? "", 320) || null;
  }
  if (input.ogImage !== undefined) {
    data.ogImage = sanitizeOptionalAssetUrl(input.ogImage ?? undefined);
  }
  if (input.twitterTitle !== undefined) {
    data.twitterTitle = sanitizePlainText(input.twitterTitle ?? "", 180) || null;
  }
  if (input.twitterDescription !== undefined) {
    data.twitterDescription =
      sanitizeMultilineText(input.twitterDescription ?? "", 320) || null;
  }
  if (input.ctaTitle !== undefined) {
    data.ctaTitle = sanitizePlainText(input.ctaTitle ?? "", 120) || null;
  }
  if (input.ctaDescription !== undefined) {
    data.ctaDescription = sanitizeMultilineText(input.ctaDescription ?? "", 420) || null;
  }
  if (input.ctaButtonLabel !== undefined) {
    data.ctaButtonLabel = sanitizePlainText(input.ctaButtonLabel ?? "", 60) || null;
  }
  if (input.ctaButtonUrl !== undefined) {
    data.ctaButtonUrl = sanitizeOptionalUrl(input.ctaButtonUrl ?? undefined);
  }

  if (input.status !== undefined || input.publishedAt !== undefined || input.scheduledAt !== undefined) {
    const lifecycle = normalizeStatusLifecycle({
      status: input.status,
      publishedAt: input.publishedAt,
      scheduledAt: input.scheduledAt,
    });

    data.status = lifecycle.status;
    data.publishedAt = lifecycle.publishedAt;
    data.scheduledAt = lifecycle.scheduledAt;
  }

  return data;
}

function dedupeTagIds(tagIds: string[] | undefined) {
  if (!tagIds) {
    return [];
  }
  return Array.from(new Set(tagIds));
}

async function ensureExistingCategoryId(categoryId: string) {
  const category = await prisma.newsCategory.findFirst({
    where: {
      id: categoryId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!category) {
    throw new ApiError(400, "CATEGORY_NOT_FOUND", "Categoria selecionada não encontrada.");
  }

  return category.id;
}

async function resolveExistingTagIds(tagIds: string[] | undefined) {
  const deduped = dedupeTagIds(tagIds);
  if (deduped.length === 0) {
    return [];
  }

  const existingTags = await prisma.newsTag.findMany({
    where: {
      id: {
        in: deduped,
      },
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  const allowed = new Set(existingTags.map((tag) => tag.id));
  return deduped.filter((tagId) => allowed.has(tagId));
}

export async function publishDueScheduledPosts() {
  if (!hasDatabaseUrl()) {
    return;
  }

  await prisma.newsPost.updateMany({
    where: {
      status: NewsStatus.SCHEDULED,
      scheduledAt: {
        lte: nowUtc(),
      },
      deletedAt: null,
    },
    data: {
      status: NewsStatus.PUBLISHED,
      publishedAt: nowUtc(),
    },
  });
}

export async function listPublicNews(input: PublicNewsQueryInput) {
  if (!hasDatabaseUrl()) {
    return {
      items: [],
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total: 0,
        totalPages: 1,
      },
    };
  }

  await publishDueScheduledPosts();

  const where: Prisma.NewsPostWhereInput = {
    status: NewsStatus.PUBLISHED,
    deletedAt: null,
    publishedAt: {
      lte: nowUtc(),
    },
    ...(input.search
      ? {
          OR: [
            {
              title: {
                contains: input.search,
              },
            },
            {
              excerpt: {
                contains: input.search,
              },
            },
          ],
        }
      : {}),
    ...(input.category
      ? {
          category: {
            slug: input.category,
          },
        }
      : {}),
    ...(input.tag
      ? {
          tags: {
            some: {
              tag: {
                slug: input.tag,
              },
            },
          },
        }
      : {}),
    ...(input.featuredOnly
      ? {
          featured: true,
        }
      : {}),
  };

  const [count, posts] = await Promise.all([
    prisma.newsPost.count({ where }),
    prisma.newsPost.findMany({
      where,
      include: publicPostInclude,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
  ]);

  return {
    items: posts.map(mapPostToPublicCard),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / input.pageSize)),
    },
  };
}

export async function getPublicNewsBySlug(slug: string) {
  if (!hasDatabaseUrl()) {
    return null;
  }

  await publishDueScheduledPosts();

  const post = await prisma.newsPost.findFirst({
    where: {
      slug,
      status: NewsStatus.PUBLISHED,
      deletedAt: null,
      publishedAt: {
        lte: nowUtc(),
      },
    },
    include: publicPostInclude,
  });

  if (!post) {
    return null;
  }

  return mapPostToPublicDetail(post);
}

export async function getRelatedPublicNews(postId: string, categoryId: string, take = 3) {
  if (!hasDatabaseUrl()) {
    return [];
  }

  const posts = await prisma.newsPost.findMany({
    where: {
      id: {
        not: postId,
      },
      categoryId,
      status: NewsStatus.PUBLISHED,
      deletedAt: null,
      publishedAt: {
        lte: nowUtc(),
      },
    },
    include: publicPostInclude,
    orderBy: {
      publishedAt: "desc",
    },
    take,
  });

  return posts.map(mapPostToPublicCard);
}

export async function getRecentPublicNews(
  options?: {
    excludePostIds?: string[];
    take?: number;
  },
) {
  if (!hasDatabaseUrl()) {
    return [];
  }

  await publishDueScheduledPosts();

  const excludePostIds = Array.from(new Set(options?.excludePostIds ?? [])).filter(Boolean);
  const take = Math.max(1, Math.min(12, options?.take ?? 4));

  const posts = await prisma.newsPost.findMany({
    where: {
      status: NewsStatus.PUBLISHED,
      deletedAt: null,
      publishedAt: {
        lte: nowUtc(),
      },
      ...(excludePostIds.length > 0
        ? {
            id: {
              notIn: excludePostIds,
            },
          }
        : {}),
    },
    include: publicPostInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take,
  });

  return posts.map(mapPostToPublicCard);
}

export async function listAdminNews(input: AdminNewsQueryInput) {
  const where: Prisma.NewsPostWhereInput = {
    deletedAt: null,
    ...(input.search
      ? {
          OR: [
            {
              title: {
                contains: input.search,
              },
            },
            {
              slug: {
                contains: input.search,
              },
            },
          ],
        }
      : {}),
    ...(input.status
      ? {
          status: input.status,
        }
      : {}),
    ...(input.categoryId
      ? {
          categoryId: input.categoryId,
        }
      : {}),
    ...(input.tagId
      ? {
          tags: {
            some: {
              tagId: input.tagId,
            },
          },
        }
      : {}),
  };

  const orderBy: Prisma.NewsPostOrderByWithRelationInput[] =
    input.orderBy === "oldest"
      ? [{ createdAt: "asc" }]
      : input.orderBy === "updated"
        ? [{ updatedAt: "desc" }]
        : [{ createdAt: "desc" }];

  const [count, posts] = await Promise.all([
    prisma.newsPost.count({ where }),
    prisma.newsPost.findMany({
      where,
      include: adminPostInclude,
      orderBy,
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
  ]);

  return {
    items: posts.map(mapPostToAdminList),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / input.pageSize)),
    },
  };
}

export async function getAdminNewsDashboardOverview(): Promise<AdminNewsDashboardOverview> {
  const now = nowUtc();
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const in7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [statusBuckets, featuredCount, highlightedCount, scheduledSoonCount, updatedLast7dCount] =
    await Promise.all([
      prisma.newsPost.groupBy({
        by: ["status"],
        where: {
          deletedAt: null,
        },
        _count: {
          _all: true,
        },
      }),
      prisma.newsPost.count({
        where: {
          deletedAt: null,
          featured: true,
        },
      }),
      prisma.newsPost.count({
        where: {
          deletedAt: null,
          highlightOnHome: true,
        },
      }),
      prisma.newsPost.count({
        where: {
          deletedAt: null,
          status: NewsStatus.SCHEDULED,
          scheduledAt: {
            gte: now,
            lte: in48Hours,
          },
        },
      }),
      prisma.newsPost.count({
        where: {
          deletedAt: null,
          updatedAt: {
            gte: in7DaysAgo,
          },
        },
      }),
    ]);

  const countByStatus: Record<NewsStatus, number> = {
    DRAFT: 0,
    SCHEDULED: 0,
    PUBLISHED: 0,
    ARCHIVED: 0,
  };

  for (const bucket of statusBuckets) {
    countByStatus[bucket.status] = bucket._count._all;
  }

  const totalPosts =
    countByStatus.DRAFT +
    countByStatus.SCHEDULED +
    countByStatus.PUBLISHED +
    countByStatus.ARCHIVED;

  const [categoryGroups, recentUpdatesRaw] = await Promise.all([
    prisma.newsPost.groupBy({
      by: ["categoryId"],
      where: {
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.newsPost.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
        author: {
          select: {
            displayName: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 8,
    }),
  ]);

  const topCategoryGroups = [...categoryGroups]
    .sort((left, right) => right._count._all - left._count._all)
    .slice(0, 5);

  const topCategoryIds = topCategoryGroups.map((group) => group.categoryId);
  const categoryNames = topCategoryIds.length
    ? await prisma.newsCategory.findMany({
        where: {
          id: {
            in: topCategoryIds,
          },
        },
        select: {
          id: true,
          name: true,
        },
      })
    : [];

  const categoryNameById = new Map(categoryNames.map((category) => [category.id, category.name]));

  return {
    generatedAt: now.toISOString(),
    counts: {
      total: totalPosts,
      draft: countByStatus.DRAFT,
      scheduled: countByStatus.SCHEDULED,
      published: countByStatus.PUBLISHED,
      archived: countByStatus.ARCHIVED,
      featured: featuredCount,
      highlighted: highlightedCount,
      scheduledNext48h: scheduledSoonCount,
      updatedLast7d: updatedLast7dCount,
    },
    topCategories: topCategoryGroups.map((group) => ({
      id: group.categoryId,
      name: categoryNameById.get(group.categoryId) ?? "Categoria removida",
      postCount: group._count._all,
    })),
    recentUpdates: recentUpdatesRaw.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      status: item.status,
      updatedAt: item.updatedAt.toISOString(),
      authorName: item.author.displayName,
      categoryName: item.category.name,
    })),
  };
}

export async function getAdminNewsById(id: string) {
  return prisma.newsPost.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: adminPostInclude,
  });
}

export async function createNewsPost(input: CreateNewsPostInput, actor: AuthenticatedAdmin) {
  const slugCandidate = sanitizeSlugOrNull(input.slug) ?? input.title;
  const slug = await buildUniquePostSlug(slugCandidate);
  const categoryId = await ensureExistingCategoryId(input.categoryId);
  const tagIds = await resolveExistingTagIds(input.tagIds);

  return prisma.$transaction(async (tx) => {
    const post = await tx.newsPost.create({
      data: buildPostData(
        {
          ...input,
          categoryId,
        },
        actor.id,
        slug,
      ),
    });

    if (tagIds.length > 0) {
      await tx.newsPostTag.createMany({
        data: tagIds.map((tagId) => ({
          postId: post.id,
          tagId,
        })),
      });
    }

    return tx.newsPost.findUnique({
      where: { id: post.id },
      include: adminPostInclude,
    });
  });
}

export async function updateNewsPost(
  postId: string,
  input: UpdateNewsPostInput,
  actor: AuthenticatedAdmin,
) {
  const existing = await prisma.newsPost.findFirst({
    where: {
      id: postId,
      deletedAt: null,
    },
    include: {
      tags: true,
    },
  });

  if (!existing) {
    throw new ApiError(404, "NEWS_NOT_FOUND", "Notícia não encontrada.");
  }

  if (actor.role === "AUTHOR" && existing.authorId !== actor.id) {
    throw new ApiError(403, "FORBIDDEN", "Sem permissão para editar esta notícia.");
  }

  if (
    actor.role === "AUTHOR" &&
    (input.status === NewsStatus.PUBLISHED ||
      input.status === NewsStatus.SCHEDULED ||
      input.status === NewsStatus.ARCHIVED ||
      input.publishedAt !== undefined ||
      input.scheduledAt !== undefined ||
      input.featured !== undefined ||
      input.highlightOnHome !== undefined)
  ) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Seu perfil não possui permissão para alterar status editorial ou destaque.",
    );
  }

  const data = buildUpdateData(input);

  if (input.slug !== undefined) {
    const slugCandidate = sanitizeSlugOrNull(input.slug) ?? existing.title;
    data.slug = await buildUniquePostSlug(slugCandidate, existing.id);
  }

  if (input.categoryId !== undefined) {
    data.categoryId = await ensureExistingCategoryId(input.categoryId);
  }

  const tagIdsToPersist =
    input.tagIds !== undefined ? await resolveExistingTagIds(input.tagIds) : null;

  return prisma.$transaction(async (tx) => {
    const post = await tx.newsPost.update({
      where: {
        id: existing.id,
      },
      data,
    });

    if (tagIdsToPersist) {
      await tx.newsPostTag.deleteMany({
        where: {
          postId: post.id,
        },
      });

      if (tagIdsToPersist.length > 0) {
        await tx.newsPostTag.createMany({
          data: tagIdsToPersist.map((tagId) => ({
            postId: post.id,
            tagId,
          })),
        });
      }
    }

    return tx.newsPost.findUnique({
      where: {
        id: post.id,
      },
      include: adminPostInclude,
    });
  });
}

export async function deleteNewsPost(postId: string, actor: AuthenticatedAdmin) {
  const existing = await prisma.newsPost.findFirst({
    where: {
      id: postId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new ApiError(404, "NEWS_NOT_FOUND", "Notícia não encontrada.");
  }

  if (actor.role === "AUTHOR") {
    throw new ApiError(403, "FORBIDDEN", "Sem permissão para excluir notícias.");
  }

  await prisma.newsPost.update({
    where: { id: postId },
    data: {
      deletedAt: nowUtc(),
      status: NewsStatus.ARCHIVED,
    },
  });
}

export async function duplicateNewsPost(postId: string, actor: AuthenticatedAdmin) {
  const original = await prisma.newsPost.findFirst({
    where: {
      id: postId,
      deletedAt: null,
    },
    include: {
      tags: true,
    },
  });

  if (!original) {
    throw new ApiError(404, "NEWS_NOT_FOUND", "Notícia não encontrada.");
  }

  const slug = await buildUniquePostSlug(`${original.slug}-copy`);

  return prisma.$transaction(async (tx) => {
    const duplicated = await tx.newsPost.create({
      data: {
        title: `${original.title} (Copia)`,
        slug,
        excerpt: original.excerpt,
        content: (original.content ?? {}) as Prisma.InputJsonValue,
        coverImageUrl: original.coverImageUrl,
        coverImageAlt: original.coverImageAlt,
        categoryId: original.categoryId,
        authorId: actor.id,
        status: NewsStatus.DRAFT,
        readingTime: original.readingTime,
        featured: false,
        highlightOnHome: false,
        canonicalUrl: null,
        allowIndexing: false,
        seoTitle: original.seoTitle,
        seoDescription: original.seoDescription,
        seoKeywords: original.seoKeywords,
        ogTitle: original.ogTitle,
        ogDescription: original.ogDescription,
        ogImage: original.ogImage,
        twitterTitle: original.twitterTitle,
        twitterDescription: original.twitterDescription,
        ctaTitle: original.ctaTitle,
        ctaDescription: original.ctaDescription,
        ctaButtonLabel: original.ctaButtonLabel,
        ctaButtonUrl: original.ctaButtonUrl,
      },
    });

    if (original.tags.length > 0) {
      await tx.newsPostTag.createMany({
        data: original.tags.map((tagRelation) => ({
          postId: duplicated.id,
          tagId: tagRelation.tagId,
        })),
      });
    }

    return tx.newsPost.findUnique({
      where: { id: duplicated.id },
      include: adminPostInclude,
    });
  });
}

export async function publishNewsPost(
  postId: string,
  publishedAt: string | null | undefined,
  actorRole: UserRole,
) {
  if (!canPublish(actorRole)) {
    throw new ApiError(403, "FORBIDDEN", "Sem permissão para publicar notícia.");
  }

  const existing = await prisma.newsPost.findFirst({
    where: {
      id: postId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new ApiError(404, "NEWS_NOT_FOUND", "Notícia não encontrada.");
  }

  const publicationDate = toUtcDateOrNull(publishedAt) ?? nowUtc();

  return prisma.newsPost.update({
    where: { id: postId },
    data: {
      status: NewsStatus.PUBLISHED,
      publishedAt: publicationDate,
      scheduledAt: publicationDate,
    },
    include: adminPostInclude,
  });
}

export async function listNewsCategories() {
  const categories = await prisma.newsCategory.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      name: "asc",
    },
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    color: category.color,
    allowIndexing: category.allowIndexing,
    postCount: category._count.posts,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  }));
}

export async function createNewsCategory(
  input: {
    name: string;
    slug?: string | null;
    description?: string | null;
    color?: string | null;
    allowIndexing?: boolean;
  },
  actorRole: UserRole,
) {
  if (!canManageTaxonomy(actorRole)) {
    throw new ApiError(403, "FORBIDDEN", "Sem permissão para criar categoria.");
  }

  const generatedSlug = await buildUniqueCategorySlug(input.slug ?? input.name);

  return prisma.newsCategory.create({
    data: {
      name: sanitizePlainText(input.name, 120),
      slug: generatedSlug,
      description: sanitizeMultilineText(input.description ?? "", 400) || null,
      color: sanitizeHexColor(input.color),
      allowIndexing: input.allowIndexing ?? true,
    },
  });
}

export async function updateNewsCategory(
  id: string,
  input: {
    name?: string | null;
    slug?: string | null;
    description?: string | null;
    color?: string | null;
    allowIndexing?: boolean;
  },
  actorRole: UserRole,
) {
  if (!canManageTaxonomy(actorRole)) {
    throw new ApiError(403, "FORBIDDEN", "Sem permissão para editar categoria.");
  }

  const existing = await prisma.newsCategory.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new ApiError(404, "CATEGORY_NOT_FOUND", "Categoria não encontrada.");
  }

  const data: Prisma.NewsCategoryUncheckedUpdateInput = {};

  if (input.name !== undefined) {
    data.name = sanitizePlainText(input.name ?? "", 120);
  }
  if (input.description !== undefined) {
    data.description = sanitizeMultilineText(input.description ?? "", 400) || null;
  }
  if (input.color !== undefined) {
    data.color = sanitizeHexColor(input.color);
  }
  if (input.allowIndexing !== undefined) {
    data.allowIndexing = Boolean(input.allowIndexing);
  }
  if (input.slug !== undefined) {
    const slugCandidate = sanitizeSlugOrNull(input.slug) ?? existing.slug;
    data.slug = await buildUniqueCategorySlug(slugCandidate, existing.id);
  }

  return prisma.newsCategory.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteNewsCategory(id: string, actorRole: UserRole) {
  if (!canManageTaxonomy(actorRole)) {
    throw new ApiError(403, "FORBIDDEN", "Sem permissão para remover categoria.");
  }

  const inUse = await prisma.newsPost.count({
    where: {
      categoryId: id,
      deletedAt: null,
    },
  });

  if (inUse > 0) {
    throw new ApiError(
      409,
      "CATEGORY_IN_USE",
      "Categoria vinculada a notícias. Remova os vinculos antes de excluir.",
    );
  }

  await prisma.newsCategory.update({
    where: {
      id,
    },
    data: {
      deletedAt: nowUtc(),
    },
  });
}

export async function listNewsTags() {
  const tags = await prisma.newsTag.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      name: "asc",
    },
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    postCount: tag._count.posts,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
  }));
}

export async function createNewsTag(
  input: { name: string; slug?: string | null },
  actorRole: UserRole,
) {
  if (!canManageTaxonomy(actorRole)) {
    throw new ApiError(403, "FORBIDDEN", "Sem permissão para criar tag.");
  }

  const desiredSlug = sanitizeSlugOrNull(input.slug) ?? input.name;
  const slug = await buildUniqueTagSlug(desiredSlug);

  return prisma.newsTag.create({
    data: {
      name: sanitizePlainText(input.name, 80),
      slug,
    },
  });
}

export async function updateNewsTag(
  id: string,
  input: { name?: string | null; slug?: string | null },
  actorRole: UserRole,
) {
  if (!canManageTaxonomy(actorRole)) {
    throw new ApiError(403, "FORBIDDEN", "Sem permissão para editar tag.");
  }

  const existing = await prisma.newsTag.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new ApiError(404, "TAG_NOT_FOUND", "Tag não encontrada.");
  }

  const data: Prisma.NewsTagUncheckedUpdateInput = {};

  if (input.name !== undefined) {
    data.name = sanitizePlainText(input.name ?? "", 80);
  }

  if (input.slug !== undefined) {
    const slug = sanitizeSlugOrNull(input.slug) ?? existing.slug;
    data.slug = await buildUniqueTagSlug(slug, existing.id);
  }

  return prisma.newsTag.update({
    where: { id },
    data,
  });
}

export async function deleteNewsTag(id: string, actorRole: UserRole) {
  if (!canManageTaxonomy(actorRole)) {
    throw new ApiError(403, "FORBIDDEN", "Sem permissão para remover tag.");
  }

  await prisma.newsTag.update({
    where: {
      id,
    },
    data: {
      deletedAt: nowUtc(),
    },
  });
}

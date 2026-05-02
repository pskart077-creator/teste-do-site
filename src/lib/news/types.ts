import type { NewsStatus, UserRole } from "@prisma/client";

export type NewsHeadingBlock = {
  type: "heading";
  text: string;
  level: 2 | 3 | 4;
};

export type NewsParagraphBlock = {
  type: "paragraph";
  text: string;
};

export type NewsListBlock = {
  type: "list";
  ordered: boolean;
  items: string[];
};

export type NewsQuoteBlock = {
  type: "quote";
  text: string;
  cite?: string;
};

export type NewsImageBlock = {
  type: "image";
  url: string;
  alt: string;
  caption?: string;
};

export type NewsCalloutBlock = {
  type: "callout";
  variant: "info" | "warning" | "success";
  title?: string;
  text: string;
};

export type NewsFaqBlock = {
  type: "faq";
  items: Array<{
    question: string;
    answer: string;
  }>;
};

export type NewsCtaBlock = {
  type: "cta";
  title: string;
  text: string;
  buttonLabel: string;
  buttonUrl: string;
};

export type NewsTableBlock = {
  type: "table";
  headers: string[];
  rows: string[][];
};

export type NewsEmbedBlock = {
  type: "embed";
  provider: "youtube" | "vimeo" | "generic";
  url: string;
};

export type NewsDividerBlock = {
  type: "divider";
};

export type NewsContentBlock =
  | NewsHeadingBlock
  | NewsParagraphBlock
  | NewsListBlock
  | NewsQuoteBlock
  | NewsImageBlock
  | NewsCalloutBlock
  | NewsFaqBlock
  | NewsCtaBlock
  | NewsTableBlock
  | NewsEmbedBlock
  | NewsDividerBlock;

export type NewsContentLegacyDocument = {
  version: 1;
  blocks: NewsContentBlock[];
};

export type NewsContentHtmlDocument = {
  version: 2;
  format: "html";
  html: string;
};

export type NewsContentDocument = NewsContentLegacyDocument | NewsContentHtmlDocument;

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  sessionId: string;
  csrfToken: string;
};

export type PublicNewsQueryInput = {
  page: number;
  pageSize: number;
  search: string;
  category: string;
  tag: string;
  featuredOnly: boolean;
};

export type AdminNewsQueryInput = {
  page: number;
  pageSize: number;
  search: string;
  status?: NewsStatus;
  categoryId?: string;
  tagId?: string;
  orderBy: "newest" | "oldest" | "updated";
};

export type AdminNewsDashboardOverview = {
  generatedAt: string;
  counts: {
    total: number;
    draft: number;
    scheduled: number;
    published: number;
    archived: number;
    featured: number;
    highlighted: number;
    scheduledNext48h: number;
    updatedLast7d: number;
  };
  topCategories: Array<{
    id: string;
    name: string;
    postCount: number;
  }>;
  recentUpdates: Array<{
    id: string;
    title: string;
    slug: string;
    status: NewsStatus;
    updatedAt: string;
    authorName: string;
    categoryName: string;
  }>;
};

export type NewsActionName =
  | "news:create"
  | "news:update"
  | "news:delete"
  | "news:publish"
  | "news:upload"
  | "news:category:create"
  | "news:category:update"
  | "news:category:delete"
  | "news:tag:create"
  | "news:tag:update"
  | "news:tag:delete";

export type PermissionContext = {
  actorRole: UserRole;
  actorId: string;
  postAuthorId?: string;
};

export type NewsPostLifecycle = {
  status: NewsStatus;
  scheduledAt?: Date | null;
  publishedAt?: Date | null;
};

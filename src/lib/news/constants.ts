import type { NewsStatus, UserRole } from "@prisma/client";

export const NEWS_SESSION_COOKIE = "credpago_admin_session";
export const NEWS_CSRF_COOKIE = "credpago_admin_csrf";

export const NEWS_SESSION_TTL_HOURS = Number(
  process.env.Credpagos_SESSION_TTL_HOURS ?? "12",
);

export const NEWS_MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

export const NEWS_ALLOWED_UPLOAD_MIME: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/avif": [".avif"],
};

export const NEWS_ALLOWED_UPLOAD_EXTENSIONS = new Set(
  Object.values(NEWS_ALLOWED_UPLOAD_MIME).flat(),
);

export const NEWS_DEFAULT_PAGE_SIZE = 12;
export const NEWS_MAX_PAGE_SIZE = 30;

export const NEWS_ADMIN_PAGE_SIZE = 20;
export const NEWS_ADMIN_MAX_PAGE_SIZE = 100;

export const NEWS_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const NEWS_STATUS_LABEL: Record<NewsStatus, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  PUBLISHED: "Publicada",
  ARCHIVED: "Arquivada",
};

export const NEWS_ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  EDITOR: "Editor",
  AUTHOR: "Autor",
};

export const SENSITIVE_HTTP_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const RATE_LIMIT_WINDOWS = {
  login: { limit: 6, windowMs: 15 * 60 * 1000 },
  adminApi: { limit: 180, windowMs: 60 * 1000 },
  upload: { limit: 30, windowMs: 10 * 60 * 1000 },
  publicApi: { limit: 300, windowMs: 60 * 1000 },
};

export const NEWS_CONTENT_BLOCK_LIMIT = 120;
export const NEWS_TAG_LIMIT = 20;

export const SAFE_EMBED_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "youtu.be",
  "player.vimeo.com",
  "vimeo.com",
]);
import { UserRole } from "@prisma/client";
import type { NewsActionName, PermissionContext } from "@/lib/news/types";

const ROLE_PERMISSIONS: Record<UserRole, Set<NewsActionName>> = {
  SUPER_ADMIN: new Set<NewsActionName>([
    "news:create",
    "news:update",
    "news:delete",
    "news:publish",
    "news:upload",
    "news:category:create",
    "news:category:update",
    "news:category:delete",
    "news:tag:create",
    "news:tag:update",
    "news:tag:delete",
  ]),
  EDITOR: new Set<NewsActionName>([
    "news:create",
    "news:update",
    "news:delete",
    "news:publish",
    "news:upload",
    "news:category:create",
    "news:category:update",
    "news:tag:create",
    "news:tag:update",
  ]),
  AUTHOR: new Set<NewsActionName>([
    "news:create",
    "news:update",
    "news:upload",
  ]),
};

export class PermissionError extends Error {
  constructor(message = "Sem permissão para esta operação.") {
    super(message);
    this.name = "PermissionError";
  }
}

export function hasPermission(action: NewsActionName, context: PermissionContext) {
  const allowed = ROLE_PERMISSIONS[context.actorRole]?.has(action) ?? false;
  if (!allowed) {
    return false;
  }

  if (context.actorRole !== UserRole.AUTHOR) {
    return true;
  }

  if (action === "news:update") {
    return Boolean(context.postAuthorId) && context.postAuthorId === context.actorId;
  }

  return action === "news:create" || action === "news:upload";
}

export function assertPermission(action: NewsActionName, context: PermissionContext) {
  if (!hasPermission(action, context)) {
    throw new PermissionError();
  }
}

export function canAccessAdmin(role: UserRole | null | undefined) {
  if (!role) {
    return false;
  }
  return role === UserRole.SUPER_ADMIN || role === UserRole.EDITOR || role === UserRole.AUTHOR;
}

export function canPublish(role: UserRole | null | undefined) {
  return role === UserRole.SUPER_ADMIN || role === UserRole.EDITOR;
}

export function canManageTaxonomy(role: UserRole | null | undefined) {
  return role === UserRole.SUPER_ADMIN || role === UserRole.EDITOR;
}

export function isSuperAdmin(role: UserRole | null | undefined) {
  return role === UserRole.SUPER_ADMIN;
}

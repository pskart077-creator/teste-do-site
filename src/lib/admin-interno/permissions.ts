import { InternalAdminRoleKey } from "@prisma/client";

export type InternalPermission =
  | "dashboard:view"
  | "leads:read"
  | "leads:update"
  | "leads:assign"
  | "leads:note"
  | "leads:export"
  | "users:read"
  | "users:manage"
  | "settings:read"
  | "settings:manage"
  | "audit:read"
  | "analytics:read"
  | "crm:read"
  | "crm:manage"
  | "chat:read"
  | "chat:manage";

const SUPERADMIN_PERMISSIONS: InternalPermission[] = [
  "dashboard:view",
  "leads:read",
  "leads:update",
  "leads:assign",
  "leads:note",
  "leads:export",
  "users:read",
  "users:manage",
  "settings:read",
  "settings:manage",
  "audit:read",
  "analytics:read",
  "crm:read",
  "crm:manage",
  "chat:read",
  "chat:manage",
];

const ADMIN_PERMISSIONS: InternalPermission[] = [
  "dashboard:view",
  "leads:read",
  "leads:update",
  "leads:assign",
  "leads:note",
  "leads:export",
  "users:read",
  "users:manage",
  "settings:read",
  "settings:manage",
  "audit:read",
  "analytics:read",
  "crm:read",
  "crm:manage",
  "chat:read",
  "chat:manage",
];

const VIEWER_PERMISSIONS: InternalPermission[] = [
  "dashboard:view",
  "leads:read",
  "users:read",
  "settings:read",
  "audit:read",
  "analytics:read",
  "crm:read",
  "chat:read",
];

const ROLE_PERMISSIONS: Record<InternalAdminRoleKey, Set<InternalPermission>> = {
  SUPERADMIN: new Set(SUPERADMIN_PERMISSIONS),
  ADMIN: new Set(ADMIN_PERMISSIONS),
  VISUALIZADOR: new Set(VIEWER_PERMISSIONS),
};

export function hasPermission(role: InternalAdminRoleKey, permission: InternalPermission) {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function canManageAdminUser(
  actorRole: InternalAdminRoleKey,
  targetRole: InternalAdminRoleKey,
) {
  if (actorRole === "SUPERADMIN") {
    return true;
  }

  if (actorRole === "ADMIN") {
    return targetRole !== "SUPERADMIN";
  }

  return false;
}

export function canAssignAdminRole(
  actorRole: InternalAdminRoleKey,
  nextRole: InternalAdminRoleKey,
) {
  if (actorRole === "SUPERADMIN") {
    return true;
  }

  if (actorRole === "ADMIN") {
    return nextRole !== "SUPERADMIN";
  }

  return false;
}

import type { InternalPermission } from "@/lib/admin-interno/permissions";
import { fromUnknownError, ok } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { hasPermission } from "@/lib/admin-interno/permissions";
import type { NextRequest } from "next/server";

const KNOWN_PERMISSIONS: InternalPermission[] = [
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
];

export async function GET(request: NextRequest) {
  try {
    const session = await requireInternalApiSession(request);

    return ok({
      user: {
        id: session.userId,
        email: session.email,
        fullName: session.fullName,
        role: session.role,
      },
      permissions: KNOWN_PERMISSIONS.filter((permission) =>
        hasPermission(session.role, permission),
      ),
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}

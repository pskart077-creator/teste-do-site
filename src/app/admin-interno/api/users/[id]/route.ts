import type { NextRequest } from "next/server";
import { fromUnknownError, InternalApiError, ok, parseJsonBody } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import { canAssignAdminRole, canManageAdminUser } from "@/lib/admin-interno/permissions";
import { sanitizeText } from "@/lib/admin-interno/sanitize";
import { updateAdminUserSchema } from "@/lib/admin-interno/validators";
import { prisma } from "@/lib/db/prisma";

function selectUserFields() {
  return {
    id: true,
    email: true,
    fullName: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    role: {
      select: {
        key: true,
        name: true,
      },
    },
  } as const;
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const session = await requireInternalApiSession(request, {
      permission: "users:manage",
      requireCsrf: true,
    });

    const { id } = await context.params;
    const body = updateAdminUserSchema.parse(await parseJsonBody(request));

    const existing = await prisma.internalAdminUser.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        role: true,
      },
    });

    if (!existing) {
      throw new InternalApiError(404, "USER_NOT_FOUND", "Usuário não encontrado.");
    }

    if (!canManageAdminUser(session.role, existing.role.key)) {
      throw new InternalApiError(403, "FORBIDDEN", "Permissão insuficiente para editar este usuário.");
    }

    if (session.userId === id && body.isActive === false) {
      throw new InternalApiError(400, "INVALID_OPERATION", "Você não pode desativar seu próprio usuário.");
    }

    let nextRoleId: string | undefined;
    if (body.role) {
      const role = await prisma.internalAdminRole.findUnique({
        where: {
          key: body.role,
        },
        select: {
          id: true,
          key: true,
        },
      });

      if (!role) {
        throw new InternalApiError(400, "INVALID_ROLE", "Papel inválido.");
      }

      if (!canAssignAdminRole(session.role, role.key)) {
        throw new InternalApiError(
          403,
          "FORBIDDEN",
          "Você não possui permissão para atribuir este papel.",
        );
      }

      nextRoleId = role.id;
    }

    const updated = await prisma.internalAdminUser.update({
      where: {
        id,
      },
      data: {
        fullName: body.fullName ? sanitizeText(body.fullName, 120) : undefined,
        roleId: nextRoleId,
        isActive: body.isActive,
        deletedAt: body.isActive === false ? new Date() : body.isActive === true ? null : undefined,
      },
      select: selectUserFields(),
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "USER_UPDATED",
      entityType: "admin_user",
      entityId: updated.id,
      context: {
        changedFullName: body.fullName ? true : false,
        changedRole: body.role ? true : false,
        changedActive: typeof body.isActive === "boolean",
      },
    });

    if (body.role && body.role !== existing.role.key) {
      await writeAuditLog({
        actorId: session.userId,
        action: "USER_ROLE_CHANGED",
        entityType: "admin_user",
        entityId: updated.id,
        context: {
          from: existing.role.key,
          to: body.role,
        },
      });
    }

    if (typeof body.isActive === "boolean" && body.isActive !== existing.isActive) {
      await writeAuditLog({
        actorId: session.userId,
        action: body.isActive ? "USER_REACTIVATED" : "USER_DEACTIVATED",
        entityType: "admin_user",
        entityId: updated.id,
      });
    }

    return ok({ user: updated });
  } catch (error) {
    return fromUnknownError(error);
  }
}

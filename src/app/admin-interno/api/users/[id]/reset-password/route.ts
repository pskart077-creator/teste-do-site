import type { NextRequest } from "next/server";
import { fromUnknownError, InternalApiError, ok, parseJsonBody } from "@/lib/admin-interno/api";
import { requireInternalApiSession, updateInternalAdminPassword } from "@/lib/admin-interno/auth";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import { canManageAdminUser } from "@/lib/admin-interno/permissions";
import { validateStrongPassword } from "@/lib/admin-interno/password-policy";
import { resetPasswordSchema } from "@/lib/admin-interno/validators";
import { prisma } from "@/lib/db/prisma";

export async function POST(
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
    const body = resetPasswordSchema.parse(await parseJsonBody(request));
    const passwordValidation = validateStrongPassword(body.password);

    if (!passwordValidation.valid) {
      throw new InternalApiError(400, "WEAK_PASSWORD", "Senha fraca.", {
        issues: passwordValidation.issues,
      });
    }

    const user = await prisma.internalAdminUser.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        role: {
          select: {
            key: true,
          },
        },
      },
    });

    if (!user) {
      throw new InternalApiError(404, "USER_NOT_FOUND", "Usuário não encontrado.");
    }

    if (!canManageAdminUser(session.role, user.role.key)) {
      throw new InternalApiError(403, "FORBIDDEN", "Permissão insuficiente para redefinir esta senha.");
    }

    await updateInternalAdminPassword(id, body.password);

    await prisma.internalAdminSession.updateMany({
      where: {
        userId: id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: "password_reset",
      },
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "USER_PASSWORD_RESET",
      entityType: "admin_user",
      entityId: id,
    });

    return ok({
      reset: true,
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}

import { fromUnknownError, InternalApiError, ok, parseJsonBody } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import { validateStrongPassword } from "@/lib/admin-interno/password-policy";
import { canAssignAdminRole } from "@/lib/admin-interno/permissions";
import { sanitizeEmail, sanitizeText } from "@/lib/admin-interno/sanitize";
import { hashPassword } from "@/lib/admin-interno/security";
import { createAdminUserSchema } from "@/lib/admin-interno/validators";
import { prisma } from "@/lib/db/prisma";
import type { NextRequest } from "next/server";

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

export async function GET(request: NextRequest) {
  try {
    await requireInternalApiSession(request, {
      permission: "users:read",
    });

    const users = await prisma.internalAdminUser.findMany({
      where: {
        deletedAt: null,
      },
      select: selectUserFields(),
      orderBy: {
        createdAt: "desc",
      },
    });

    return ok({ users });
  } catch (error) {
    return fromUnknownError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireInternalApiSession(request, {
      permission: "users:manage",
      requireCsrf: true,
    });

    const body = createAdminUserSchema.parse(await parseJsonBody(request));
    const passwordValidation = validateStrongPassword(body.password);
    if (!passwordValidation.valid) {
      throw new InternalApiError(400, "WEAK_PASSWORD", "Senha fraca.", {
        issues: passwordValidation.issues,
      });
    }

    const email = sanitizeEmail(body.email);
    const exists = await prisma.internalAdminUser.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (exists) {
      throw new InternalApiError(409, "USER_ALREADY_EXISTS", "Já existe usuário com este e-mail.");
    }

    const passwordHash = await hashPassword(body.password);

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

    const created = await prisma.internalAdminUser.create({
      data: {
        email,
        fullName: sanitizeText(body.fullName, 120),
        passwordHash,
        roleId: role.id,
        isActive: true,
        createdById: session.userId,
        lastPasswordChangeAt: new Date(),
      },
      select: selectUserFields(),
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "USER_CREATED",
      entityType: "admin_user",
      entityId: created.id,
      context: {
        email: created.email,
        role: created.role.key,
      },
    });

    return ok({
      user: created,
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}

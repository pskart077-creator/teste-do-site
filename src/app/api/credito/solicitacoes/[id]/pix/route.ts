import type { NextRequest } from "next/server";
import { ApiError, fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { requireApiAdmin } from "@/lib/news/auth";
import { prisma } from "@/lib/db/prisma";
import { getCreditClientSession } from "@/lib/credit/auth";
import { createPixChargeForContract } from "@/services/credit/pix/createPixCharge";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const scope = new URL(request.url).searchParams.get("scope");

    if (scope === "admin") {
      await requireApiAdmin(request);
      const charges = await prisma.pixCharge.findMany({
        where: {
          applicationId: id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return ok({ charges });
    }

    const session = await getCreditClientSession();
    if (!session) {
      throw new ApiError(401, "UNAUTHENTICATED", "Faça login para consultar cobranças.");
    }

    const application = await prisma.creditApplication.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!application) {
      throw new ApiError(404, "NOT_FOUND", "Solicitação não encontrada.");
    }
    if (application.customer.userId !== session.userId) {
      throw new ApiError(403, "FORBIDDEN", "Acesso não permitido.");
    }

    const charges = await prisma.pixCharge.findMany({
      where: {
        applicationId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return ok({ charges });
  } catch (error) {
    return fromUnknownError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireApiAdmin(request);

    const { id } = await context.params;
    const body = await parseJsonBody<{
      amount: number;
      description: string;
      type: "INSTALLMENT" | "SETTLEMENT" | "CONTRACT_ENTRY" | "ADMIN_FEE";
      contractId?: string;
      metadata?: Record<string, unknown>;
    }>(request, 80_000);

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError(400, "INVALID_AMOUNT", "Valor inválido para cobrança PIX.");
    }

    const charge = await createPixChargeForContract({
      applicationId: id,
      contractId: body.contractId,
      amount,
      description: body.description || "Cobrança PIX Credpagos",
      type: body.type,
      metadata: body.metadata,
    });

    return ok({ charge }, { status: 201 });
  } catch (error) {
    return fromUnknownError(error);
  }
}

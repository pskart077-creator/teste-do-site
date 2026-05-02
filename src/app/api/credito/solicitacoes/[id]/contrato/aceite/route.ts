import type { NextRequest } from "next/server";
import { ApiError, fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { getRequestIp, getUserAgent } from "@/lib/news/http";
import { prisma } from "@/lib/db/prisma";
import { getCreditClientSession } from "@/lib/credit/auth";
import { updateApplicationStatus } from "@/services/credit/updateApplicationStatus";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getCreditClientSession();
    if (!session) {
      throw new ApiError(401, "UNAUTHENTICATED", "Faça login para continuar.");
    }

    const { id } = await context.params;
    const body = await parseJsonBody<{ accepted: boolean }>(request, 20_000);
    if (!body.accepted) {
      throw new ApiError(400, "ACCEPT_REQUIRED", "Confirme o aceite para continuar.");
    }

    const application = await prisma.creditApplication.findUnique({
      where: { id },
      include: {
        customer: true,
        contracts: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!application) {
      throw new ApiError(404, "NOT_FOUND", "Solicitação não encontrada.");
    }

    if (application.customer.userId !== session.userId) {
      throw new ApiError(403, "FORBIDDEN", "Você não possui acesso a esta solicitação.");
    }

    const contract = application.contracts[0];
    if (!contract) {
      throw new ApiError(404, "CONTRACT_NOT_FOUND", "Contrato não encontrado.");
    }

    const signedContract = await prisma.creditContract.update({
      where: {
        id: contract.id,
      },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedIp: getRequestIp(request),
        acceptedUserAgent: getUserAgent(request),
      },
    });

    await updateApplicationStatus({
      applicationId: id,
      toStatus: "CONTRACT_SIGNED",
      actorType: "CUSTOMER",
      actorId: session.userId,
      note: "Cliente assinou o contrato digitalmente.",
    });

    await updateApplicationStatus({
      applicationId: id,
      toStatus: "AWAITING_RELEASE",
      actorType: "SYSTEM",
      note: "Aguardando validação operacional para liberação.",
    });

    return ok({ contract: signedContract });
  } catch (error) {
    return fromUnknownError(error);
  }
}

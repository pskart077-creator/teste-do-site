import type { NextRequest } from "next/server";
import { ApiError, fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { prisma } from "@/lib/db/prisma";
import { getCreditClientSession } from "@/lib/credit/auth";
import { updateApplicationStatus } from "@/services/credit/updateApplicationStatus";
import { generateContract } from "@/services/credit/generateContract";

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
    const body = await parseJsonBody<{ action: "accept" | "reject" }>(request, 20_000);
    const action = body.action;

    const application = await prisma.creditApplication.findUnique({
      where: { id },
      include: {
        customer: true,
        proposals: {
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

    const proposal = application.proposals[0];
    if (!proposal) {
      throw new ApiError(404, "PROPOSAL_NOT_FOUND", "Proposta não encontrada.");
    }

    if (action === "accept") {
      const acceptedProposal = await prisma.creditProposal.update({
        where: {
          id: proposal.id,
        },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });

      await updateApplicationStatus({
        applicationId: id,
        toStatus: "PROPOSAL_ACCEPTED",
        actorType: "CUSTOMER",
        actorId: session.userId,
        note: "Cliente aceitou proposta.",
      });

      const contractData = generateContract({
        application,
        customer: application.customer,
        proposal: acceptedProposal,
      });

      const contract = await prisma.creditContract.create({
        data: {
          applicationId: id,
          proposalId: acceptedProposal.id,
          contractNumber: contractData.contractNumber,
          content: contractData.content,
          status: "AVAILABLE",
        },
      });

      await updateApplicationStatus({
        applicationId: id,
        toStatus: "CONTRACT_GENERATED",
        actorType: "SYSTEM",
        note: "Contrato gerado após aceite da proposta.",
      });

      return ok({ proposal: acceptedProposal, contract });
    }

    const rejectedProposal = await prisma.creditProposal.update({
      where: { id: proposal.id },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
      },
    });

    await updateApplicationStatus({
      applicationId: id,
      toStatus: "CANCELED",
      actorType: "CUSTOMER",
      actorId: session.userId,
      note: "Cliente recusou proposta.",
    });

    return ok({ proposal: rejectedProposal });
  } catch (error) {
    return fromUnknownError(error);
  }
}

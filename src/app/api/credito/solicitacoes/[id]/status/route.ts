import type { NextRequest } from "next/server";
import { ApiError, fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { requireApiAdmin } from "@/lib/news/auth";
import { prisma } from "@/lib/db/prisma";
import { getOrCreateCreditRules } from "@/lib/credit/rules";
import { generateProposal } from "@/services/credit/generateProposal";
import { generateContract } from "@/services/credit/generateContract";
import { updateApplicationStatus } from "@/services/credit/updateApplicationStatus";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireApiAdmin(request);
    const { id } = await context.params;
    const body = await parseJsonBody<{
      toStatus: string;
      note?: string;
    }>(request, 60_000);

    const toStatus = body.toStatus as
      | "IN_ANALYSIS"
      | "DOCUMENTS_PENDING"
      | "PRE_APPROVED"
      | "PROPOSAL_AVAILABLE"
      | "PROPOSAL_ACCEPTED"
      | "CONTRACT_GENERATED"
      | "CONTRACT_SIGNED"
      | "AWAITING_RELEASE"
      | "CREDIT_RELEASED"
      | "REFUSED"
      | "CANCELED";

    const allowedStatuses = new Set([
      "IN_ANALYSIS",
      "DOCUMENTS_PENDING",
      "PRE_APPROVED",
      "PROPOSAL_AVAILABLE",
      "PROPOSAL_ACCEPTED",
      "CONTRACT_GENERATED",
      "CONTRACT_SIGNED",
      "AWAITING_RELEASE",
      "CREDIT_RELEASED",
      "REFUSED",
      "CANCELED",
    ]);
    if (!allowedStatuses.has(toStatus)) {
      throw new ApiError(400, "INVALID_STATUS", "Status de destino inválido.");
    }

    const application = await prisma.creditApplication.findUnique({
      where: { id },
      include: {
        customer: true,
        analysis: true,
        proposals: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!application) {
      return Response.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Solicitação não encontrada.",
          },
        },
        { status: 404 },
      );
    }

    if (toStatus === "PROPOSAL_AVAILABLE" && !application.proposals.length && application.analysis) {
      const rules = await getOrCreateCreditRules();
      const proposalValues = generateProposal({
        application,
        analysis: application.analysis,
        defaultInterestRate: rules.defaultInterestRate,
      });
      await prisma.creditProposal.create({
        data: {
          applicationId: application.id,
          ...proposalValues,
          status: "AVAILABLE",
          availableAt: new Date(),
        },
      });
    }

    if (toStatus === "CONTRACT_GENERATED") {
      const proposal = application.proposals[0];
      if (proposal) {
        const contractData = generateContract({
          application,
          customer: application.customer,
          proposal,
        });
        await prisma.creditContract.create({
          data: {
            applicationId: application.id,
            proposalId: proposal.id,
            contractNumber: contractData.contractNumber,
            content: contractData.content,
            status: "AVAILABLE",
          },
        });
      }
    }

    const updated = await updateApplicationStatus({
      applicationId: id,
      toStatus,
      actorType: "ADMIN",
      actorId: session.id,
      note: body.note,
    });

    return ok({ application: updated });
  } catch (error) {
    return fromUnknownError(error);
  }
}

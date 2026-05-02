import type { NextRequest } from "next/server";
import { fromUnknownError, ok } from "@/lib/news/api";
import { prisma } from "@/lib/db/prisma";
import { requireApiAdmin } from "@/lib/news/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const scope = new URL(request.url).searchParams.get("scope");

    const application = await prisma.creditApplication.findUnique({
      where: { id },
      include: {
        customer: true,
        personData: true,
        companyData: true,
        partners: true,
        addresses: true,
        bankData: true,
        documents: true,
        analysis: true,
        proposals: {
          orderBy: {
            createdAt: "desc",
          },
        },
        contracts: {
          orderBy: {
            createdAt: "desc",
          },
        },
        pixCharges: {
          orderBy: {
            createdAt: "desc",
          },
        },
        history: {
          orderBy: {
            createdAt: "asc",
          },
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

    if (scope === "admin") {
      await requireApiAdmin(request);
      return ok({ application });
    }

    return ok({
      application: {
        id: application.id,
        protocol: application.protocol,
        status: application.status,
        profileType: application.profileType,
        requestedAmount: application.requestedAmount,
        estimatedNetAmount: application.estimatedNetAmount,
        desiredTerm: application.desiredTerm,
        desiredDueDay: application.desiredDueDay,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
        customerName: application.customer.name,
        documentsPending: application.documents.filter((doc) => doc.status !== "APPROVED"),
        proposal: application.proposals[0] ?? null,
        contract: application.contracts[0] ?? null,
        timeline: application.history,
      },
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}

import { ApiError, fromUnknownError, ok } from "@/lib/news/api";
import { getCreditClientSession } from "@/lib/credit/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await getCreditClientSession();
    if (!session) {
      throw new ApiError(401, "UNAUTHENTICATED", "Faça login para continuar.");
    }

    const profiles = await prisma.customerProfile.findMany({
      where: {
        userId: session.userId,
      },
      include: {
        applications: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            analysis: true,
            proposals: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            contracts: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    return ok({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      profiles,
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}

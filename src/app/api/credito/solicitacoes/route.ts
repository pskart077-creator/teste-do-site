import type { NextRequest } from "next/server";
import { fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { getRequestIp, requireRateLimit } from "@/lib/news/http";
import { validateCreditPayload } from "@/lib/credit/validators";
import { requireApiAdmin } from "@/lib/news/auth";
import { prisma } from "@/lib/db/prisma";
import { calculateCreditSimulation } from "@/services/credit/calculateCreditSimulation";
import { generateCreditProtocol } from "@/services/credit/generateCreditProtocol";

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    requireRateLimit(`credit-create:${ip}`, { limit: 20, windowMs: 10 * 60_000 });

    const body = await parseJsonBody(request, 700_000);
    const payload = validateCreditPayload(body);
    const simulation = calculateCreditSimulation({
      requestedAmount: payload.request.requestedAmount,
      operationalAdjustmentPercent: 23,
      desiredTerm: payload.request.desiredTerm,
      monthlyIncome:
        payload.mode === "PF"
          ? payload.pfData?.monthlyIncome ?? 0
          : payload.mode === "MEI"
            ? payload.meiData?.monthlyRevenue ?? 0
            : payload.pjData?.averageProfit || payload.pjData?.monthlyRevenue || 0,
    });

    return ok(
      {
        id: `sim-${Date.now()}`,
        protocol: generateCreditProtocol(),
        status: "PROPOSAL_AVAILABLE",
        requestedAmount: simulation.requestedAmount,
        approvedAmount: simulation.approvedAmount,
        estimatedNetAmount: simulation.approvedEstimatedNetAmount,
        approvedTerm: payload.request.desiredTerm,
        approvedInstallmentAmount: simulation.approvedInstallmentAmount,
        maxInstallmentAmount: simulation.maxInstallmentAmount,
        incomeCapacityApplied: simulation.incomeCapacityApplied,
        isApproved: true,
        score: 0,
        riskLevel: "MEDIUM",
        recommendation: "APPROVE",
        simulation,
        statusUrl: "",
      },
      { status: 201 },
    );
  } catch (error) {
    return fromUnknownError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireApiAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));
    const profileType = searchParams.get("profileType");
    const status = searchParams.get("status");
    const query = searchParams.get("q")?.trim();

    const where = {
      ...(profileType ? { profileType: profileType as never } : {}),
      ...(status ? { status: status as never } : {}),
      ...(query
        ? {
            OR: [
              { protocol: { contains: query, mode: "insensitive" as const } },
              {
                customer: {
                  OR: [
                    { name: { contains: query, mode: "insensitive" as const } },
                    { document: { contains: query, mode: "insensitive" as const } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.creditApplication.findMany({
        where,
        include: {
          customer: true,
          analysis: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.creditApplication.count({ where }),
    ]);

    return ok({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}

import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { getRequestIp, requireRateLimit } from "@/lib/news/http";
import { prisma } from "@/lib/db/prisma";
import { createCardIssuanceToken } from "@/services/credit/cardIssuance";
import { calculateInitialCreditLimit } from "@/services/credit/calculateInitialCreditLimit";
import { scheduleCardApprovalEmailOnce } from "@/services/credit/sendCardApprovalEmail";

const cardRequestSchema = z.object({
  protocol: z.string().trim().min(8).max(80),
  cpf: z.string().trim().min(11).max(14),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(10).max(32),
  birthDate: z.string().trim().min(4).max(30),
  monthlyIncome: z.number().min(0),
  motherName: z.string().trim().min(2).max(120),
  profession: z.string().trim().min(2).max(120),
  customProfession: z.string().trim().max(120).optional(),
  zipCode: z.string().trim().min(8).max(12),
  street: z.string().trim().min(2).max(160),
  number: z.string().trim().max(20),
  complement: z.string().trim().max(120).optional(),
  neighborhood: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(2),
  city: z.string().trim().min(2).max(120),
  invoiceDueDay: z.string().trim().min(2).max(40),
});

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    requireRateLimit(`card-credit-request:${ip}`, { limit: 12, windowMs: 10 * 60_000 });

    const body = await parseJsonBody(request, 80_000);
    const payload = cardRequestSchema.parse(body);
    const normalizedEmail = payload.email.toLowerCase().trim();
    const limitResult = calculateInitialCreditLimit({
      monthlyIncome: payload.monthlyIncome,
    });

    let cardRequest = await prisma.cardCreditRequest.findUnique({
      where: {
        protocol: payload.protocol,
      },
    });

    if (!cardRequest) {
      cardRequest = await prisma.cardCreditRequest.create({
        data: {
          protocol: payload.protocol,
          status: "APPROVED",
          fullName: payload.fullName.trim(),
          email: normalizedEmail,
          phone: payload.phone.trim(),
          cpf: onlyDigits(payload.cpf),
          birthDate: payload.birthDate.trim(),
          monthlyIncome: limitResult.monthlyIncome,
          motherName: payload.motherName.trim(),
          profession: payload.profession.trim(),
          customProfession: normalizeOptionalText(payload.customProfession),
          zipCode: payload.zipCode.trim(),
          street: payload.street.trim(),
          number: normalizeOptionalText(payload.number),
          complement: normalizeOptionalText(payload.complement),
          neighborhood: payload.neighborhood.trim(),
          state: payload.state.trim().toUpperCase(),
          city: payload.city.trim(),
          invoiceDueDay: payload.invoiceDueDay.trim(),
          approvedLimit: limitResult.suggestedLimit,
          issuanceToken: createCardIssuanceToken(),
          issuanceTokenCreatedAt: new Date(),
        },
      });
    }

    if (cardRequest.email !== normalizedEmail) {
      throw new ApiError(
        409,
        "PROTOCOL_ALREADY_USED",
        "Este protocolo já está associado a outro e-mail.",
      );
    }

    try {
      await scheduleCardApprovalEmailOnce(cardRequest.id, {
        baseUrl: request.nextUrl.origin,
      });
    } catch (error) {
      console.error("[card-credit-request] approval email scheduling failed", {
        cardRequestId: cardRequest.id,
        protocol: cardRequest.protocol,
        error,
      });
    }

    return ok(
      {
        request: {
          id: cardRequest.id,
          protocol: cardRequest.protocol,
          email: cardRequest.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return fromUnknownError(error);
  }
}

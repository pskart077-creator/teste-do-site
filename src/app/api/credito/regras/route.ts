import type { NextRequest } from "next/server";
import { fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { requireApiAdmin } from "@/lib/news/auth";
import { getOrCreateCreditRules, updateCreditRules } from "@/lib/credit/rules";

export async function GET(request: NextRequest) {
  try {
    await requireApiAdmin(request);
    const rules = await getOrCreateCreditRules();
    return ok({ rules });
  } catch (error) {
    return fromUnknownError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireApiAdmin(request);
    const body = await parseJsonBody<Record<string, unknown>>(request, 120_000);
    const toNumber = (value: unknown) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    };
    const toString = (value: unknown) => {
      if (typeof value !== "string") {
        return undefined;
      }
      return value.trim();
    };

    const rules = await updateCreditRules({
      minAmountPf: toNumber(body.minAmountPf),
      maxAmountPf: toNumber(body.maxAmountPf),
      minAmountMei: toNumber(body.minAmountMei),
      maxAmountMei: toNumber(body.maxAmountMei),
      minAmountPj: toNumber(body.minAmountPj),
      maxAmountPj: toNumber(body.maxAmountPj),
      defaultOperationalAdjustmentPercent: toNumber(body.defaultOperationalAdjustmentPercent),
      minScore: toNumber(body.minScore),
      minTerm: toNumber(body.minTerm),
      maxTerm: toNumber(body.maxTerm),
      defaultInterestRate: toNumber(body.defaultInterestRate),
      analysisMessage: toString(body.analysisMessage),
      preApprovedMessage: toString(body.preApprovedMessage),
      refusedMessage: toString(body.refusedMessage),
      pendingDocumentsMessage: toString(body.pendingDocumentsMessage),
      releasedMessage: toString(body.releasedMessage),
    });
    return ok({ rules });
  } catch (error) {
    return fromUnknownError(error);
  }
}

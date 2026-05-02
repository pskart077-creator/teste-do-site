import type { NextRequest } from "next/server";
import { fromUnknownError, ok } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { listLeads } from "@/lib/admin-interno/leads";
import { leadQuerySchema } from "@/lib/admin-interno/validators";

export async function GET(request: NextRequest) {
  try {
    await requireInternalApiSession(request, {
      permission: "leads:read",
    });

    const params = request.nextUrl.searchParams;
    const query = leadQuerySchema.parse({
      page: params.get("page") ?? undefined,
      pageSize: params.get("pageSize") ?? undefined,
      status: params.get("status") ?? undefined,
      source: params.get("source") ?? undefined,
      assigneeId: params.get("assigneeId") ?? undefined,
      from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined,
      q: params.get("q") ?? undefined,
    });

    const result = await listLeads(query);
    return ok(result);
  } catch (error) {
    return fromUnknownError(error);
  }
}

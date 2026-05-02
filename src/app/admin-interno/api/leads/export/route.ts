import type { Lead } from "@prisma/client";
import type { NextRequest } from "next/server";
import { fromUnknownError } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import { getLeadEmailDisplay } from "@/lib/admin-interno/lead-email";
import { listLeads } from "@/lib/admin-interno/leads";
import { sanitizeCsvCell } from "@/lib/admin-interno/sanitize";
import { leadQuerySchema } from "@/lib/admin-interno/validators";

function asCsvValue(value: string | number | null | undefined) {
  const safe = sanitizeCsvCell(value == null ? "" : String(value));
  const escaped = safe.replace(/"/g, '""');
  return `"${escaped}"`;
}

function toCsvRow(lead: Lead & { assignee?: { fullName: string | null } | null }) {
  return [
    lead.id,
    lead.name,
    getLeadEmailDisplay(lead.email),
    lead.phone ?? "",
    lead.company ?? "",
    lead.source ?? "",
    lead.sourcePage ?? "",
    lead.campaign ?? "",
    lead.utmSource ?? "",
    lead.utmMedium ?? "",
    lead.utmCampaign ?? "",
    lead.utmContent ?? "",
    lead.utmTerm ?? "",
    lead.message ?? "",
    lead.status,
    lead.priority,
    lead.assignee?.fullName ?? "",
    lead.createdAt.toISOString(),
    lead.updatedAt.toISOString(),
  ]
    .map((value) => asCsvValue(value))
    .join(",");
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireInternalApiSession(request, {
      permission: "leads:export",
    });

    const params = request.nextUrl.searchParams;
    const query = leadQuerySchema.parse({
      page: 1,
      pageSize: 100,
      status: params.get("status") ?? undefined,
      source: params.get("source") ?? undefined,
      assigneeId: params.get("assigneeId") ?? undefined,
      from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined,
      q: params.get("q") ?? undefined,
    });

    const rows: (Lead & { assignee?: { fullName: string | null } | null })[] = [];
    const firstPage = await listLeads(query);
    rows.push(...(firstPage.leads as (Lead & { assignee?: { fullName: string | null } | null })[]));

    const maxPages = Math.min(firstPage.totalPages, 50);

    for (let page = 2; page <= maxPages; page += 1) {
      const current = await listLeads({
        ...query,
        page,
      });
      rows.push(...(current.leads as (Lead & { assignee?: { fullName: string | null } | null })[]));
    }

    const header = [
      "id",
      "nome",
      "email",
      "telefone",
      "empresa",
      "origem",
      "pagina_origem",
      "campanha",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "mensagem",
      "status",
      "prioridade",
      "responsavel",
      "created_at",
      "updated_at",
    ];

    const csv = [header.map((item) => asCsvValue(item)).join(","), ...rows.map((row) => toCsvRow(row))].join("\n");

    await writeAuditLog({
      actorId: session.userId,
      action: "LEAD_EXPORTED",
      entityType: "lead_export",
      context: {
        total: rows.length,
        filters: {
          status: query.status ?? null,
          source: query.source ?? null,
          assigneeId: query.assigneeId ?? null,
          from: query.from ?? null,
          to: query.to ?? null,
          q: query.q ?? null,
        },
      },
    });

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}

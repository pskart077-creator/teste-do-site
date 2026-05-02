import { LeadsKanbanClient } from "@/components/admin-interno/leads-kanban-client";
import { requireInternalPageSession } from "@/lib/admin-interno/auth";
import { listLeadsForKanban } from "@/lib/admin-interno/leads";
import { hasPermission } from "@/lib/admin-interno/permissions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InternalLeadsKanbanPage() {
  const session = await requireInternalPageSession("leads:read");

  const result = await listLeadsForKanban({
    limit: 400,
  });

  return (
    <LeadsKanbanClient
      canUpdate={hasPermission(session.role, "leads:update")}
      leads={result.leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        source: lead.source,
        status: lead.status,
        priority: lead.priority,
        createdAt: lead.createdAt.toISOString(),
        assignee: lead.assignee
          ? {
              id: lead.assignee.id,
              fullName: lead.assignee.fullName,
            }
          : null,
      }))}
    />
  );
}

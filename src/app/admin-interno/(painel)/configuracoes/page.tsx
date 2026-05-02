import { RecipientsClient } from "@/components/admin-interno/recipients-client";
import { requireInternalPageSession } from "@/lib/admin-interno/auth";
import { isNotificationEmailConfigured } from "@/lib/admin-interno/notifications";
import { hasPermission } from "@/lib/admin-interno/permissions";
import { prisma } from "@/lib/db/prisma";

export default async function InternalSettingsPage() {
  const session = await requireInternalPageSession("settings:read");

  const recipients = await prisma.notificationRecipient.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const smtpReady = isNotificationEmailConfigured();

  return (
    <div className="admin-page-stack">
      <section className="admin-card">
        <h2>Status da infraestrutura</h2>
        <div className="admin-status-grid">
          <div className="admin-status-item">
            <span>SMTP configurado</span>
            <strong>{smtpReady ? "Sim" : "Não"}</strong>
          </div>
          <div className="admin-status-item">
            <span>Total de destinatários</span>
            <strong>{recipients.length}</strong>
          </div>
        </div>
      </section>

      <RecipientsClient
        recipients={recipients}
        canManage={hasPermission(session.role, "settings:manage")}
      />
    </div>
  );
}
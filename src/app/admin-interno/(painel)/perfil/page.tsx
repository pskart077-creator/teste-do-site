import { requireInternalPageSession } from "@/lib/admin-interno/auth";
import { INTERNAL_ROLE_LABEL } from "@/lib/admin-interno/constants";

export default async function InternalProfilePage() {
  const session = await requireInternalPageSession("dashboard:view");

  return (
    <div className="admin-page-stack">
      <section className="admin-card">
        <h2>Perfil interno</h2>
        <div className="admin-status-grid">
          <div className="admin-status-item">
            <span>Nome</span>
            <strong>{session.fullName}</strong>
          </div>
          <div className="admin-status-item">
            <span>E-mail</span>
            <strong>{session.email}</strong>
          </div>
          <div className="admin-status-item">
            <span>Papel</span>
            <strong>{INTERNAL_ROLE_LABEL[session.role]}</strong>
          </div>
          <div className="admin-status-item">
            <span>Sessão</span>
            <strong>{session.sessionId.slice(0, 8).toUpperCase()}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
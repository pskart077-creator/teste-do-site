"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Recipient = {
  id: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
};

type RecipientsClientProps = {
  recipients: Recipient[];
  canManage: boolean;
};

function readCookie(name: string) {
  const found = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((item) => item.startsWith(`${name}=`));

  return found ? decodeURIComponent(found.slice(name.length + 1)) : "";
}

async function internalFetch(url: string, init: RequestInit) {
  return fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-admin-csrf-token": readCookie("credpago_internal_admin_csrf"),
      ...(init.headers ?? {}),
    },
  });
}

export function RecipientsClient({ recipients, canManage }: RecipientsClientProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || isPending) {
      return;
    }

    setIsPending(true);
    setError(null);
    setFeedback(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await internalFetch("/admin-interno/api/settings/recipients", {
        method: "POST",
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          fullName: String(form.get("fullName") ?? ""),
          isActive: form.get("isActive") === "on",
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error?.message ?? "Falha ao salvar destinatário.");
        return;
      }

      setFeedback("Destinatário salvo com sucesso.");
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setError("Falha de conexão ao salvar destinatário.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>, recipientId: string) {
    event.preventDefault();
    if (!canManage || isPending) {
      return;
    }

    setIsPending(true);
    setError(null);
    setFeedback(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await internalFetch(`/admin-interno/api/settings/recipients/${recipientId}`, {
        method: "PATCH",
        body: JSON.stringify({
          fullName: String(form.get("fullName") ?? ""),
          isActive: form.get("isActive") === "on",
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error?.message ?? "Falha ao atualizar destinatário.");
        return;
      }

      setFeedback("Destinatário atualizado.");
      router.refresh();
    } catch {
      setError("Falha de conexão ao atualizar destinatário.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete(recipientId: string) {
    if (!canManage || isPending) {
      return;
    }

    setIsPending(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await internalFetch(`/admin-interno/api/settings/recipients/${recipientId}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error?.message ?? "Falha ao remover destinatário.");
        return;
      }

      setFeedback("Destinatário removido.");
      router.refresh();
    } catch {
      setError("Falha de conexão ao remover destinatário.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleProcessQueue() {
    if (isPending) {
      return;
    }

    setIsPending(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await internalFetch("/admin-interno/api/notifications/process", {
        method: "POST",
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error?.message ?? "Falha ao processar fila de notificacoes.");
        return;
      }

      const data = result.data;
      setFeedback(
        `Fila processada: ${data.processed ?? 0} jobs, ${data.sent ?? 0} enviados, ${data.failed ?? 0} falharam.`,
      );
      router.refresh();
    } catch {
      setError("Falha de conexão ao processar fila.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="admin-page-stack">
      <section className="admin-card">
        <div className="admin-card-header">
          <h2>Destinatários de alerta</h2>
          <button
            type="button"
            className="admin-ghost-button"
            onClick={handleProcessQueue}
            disabled={isPending}
          >
            Processar fila agora
          </button>
        </div>

        <form className="admin-form-grid" onSubmit={handleCreate}>
          <label>
            E-mail
            <input name="email" type="email" required maxLength={254} placeholder="alertas@empresa.com" />
          </label>

          <label>
            Nome
            <input name="fullName" maxLength={120} placeholder="Time Comercial" />
          </label>

          <label className="admin-checkbox-line">
            <input name="isActive" type="checkbox" defaultChecked />
            Ativo
          </label>

          <button type="submit" className="admin-primary-button" disabled={!canManage || isPending}>
            Adicionar destinatário
          </button>
        </form>
      </section>

      {feedback ? <p className="admin-feedback success">{feedback}</p> : null}
      {error ? <p className="admin-feedback error">{error}</p> : null}

      <section className="admin-card">
        <h2>Lista de destinatários</h2>
        <div className="admin-users-stack">
          {recipients.map((recipient) => (
            <article key={recipient.id} className="admin-user-item">
              <header>
                <strong>{recipient.fullName || "Sem nome"}</strong>
                <span>{recipient.email}</span>
              </header>

              <form className="admin-user-form" onSubmit={(event) => handleUpdate(event, recipient.id)}>
                <label>
                  Nome
                  <input name="fullName" defaultValue={recipient.fullName ?? ""} maxLength={120} />
                </label>

                <label className="admin-checkbox-line">
                  <input name="isActive" type="checkbox" defaultChecked={recipient.isActive} />
                  Ativo
                </label>

                <button type="submit" className="admin-ghost-button" disabled={!canManage || isPending}>
                  Salvar
                </button>

                <button
                  type="button"
                  className="admin-danger-button"
                  onClick={() => handleDelete(recipient.id)}
                  disabled={!canManage || isPending}
                >
                  Remover
                </button>
              </form>
            </article>
          ))}
          {!recipients.length ? <p>Nenhum destinatário cadastrado.</p> : null}
        </div>
      </section>
    </div>
  );
}

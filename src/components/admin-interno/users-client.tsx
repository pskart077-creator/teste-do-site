"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { INTERNAL_ROLE_LABEL } from "@/lib/admin-interno/constants";

type InternalAdminRoleKey = "SUPERADMIN" | "ADMIN" | "VISUALIZADOR";

const INTERNAL_ADMIN_ROLE_OPTIONS: InternalAdminRoleKey[] = [
  "SUPERADMIN",
  "ADMIN",
  "VISUALIZADOR",
];

type UserItem = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  role: {
    key: InternalAdminRoleKey;
    name: string;
  };
};

type UsersClientProps = {
  users: UserItem[];
  canManage: boolean;
};

type InternalApiResponse = {
  success?: boolean;
  error?: {
    message?: string;
    details?: {
      issues?: string[];
    };
  };
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

function getErrorMessage(result: InternalApiResponse | null, fallback: string) {
  const issues = result?.error?.details?.issues;
  if (issues?.length) {
    return issues.join(" ");
  }

  return result?.error?.message ?? fallback;
}

export function UsersClient({ users, canManage }: UsersClientProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

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
      const response = await internalFetch("/admin-interno/api/users", {
        method: "POST",
        body: JSON.stringify({
          fullName: String(form.get("fullName") ?? ""),
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          role: String(form.get("role") ?? "ADMIN"),
        }),
      });

      const result = (await response.json().catch(() => null)) as InternalApiResponse | null;
      if (!response.ok || !result?.success) {
        setError(getErrorMessage(result, "Falha ao criar usuário."));
        return;
      }

      setFeedback("Usuário criado com sucesso.");
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setError("Falha de conexão ao criar usuário.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>, userId: string) {
    event.preventDefault();
    if (!canManage || isPending) {
      return;
    }

    setIsPending(true);
    setError(null);
    setFeedback(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await internalFetch(`/admin-interno/api/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({
          fullName: String(form.get("fullName") ?? ""),
          role: String(form.get("role") ?? "ADMIN"),
          isActive: form.get("isActive") === "on",
        }),
      });

      const result = (await response.json().catch(() => null)) as InternalApiResponse | null;
      if (!response.ok || !result?.success) {
        setError(getErrorMessage(result, "Falha ao atualizar usuário."));
        return;
      }

      setFeedback("Usuário atualizado.");
      router.refresh();
    } catch {
      setError("Falha de conexão ao atualizar usuário.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>, userId: string) {
    event.preventDefault();
    if (!canManage || isPending) {
      return;
    }

    setIsPending(true);
    setError(null);
    setFeedback(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await internalFetch(`/admin-interno/api/users/${userId}/reset-password`, {
        method: "POST",
        body: JSON.stringify({
          password: String(form.get("password") ?? ""),
        }),
      });

      const result = (await response.json().catch(() => null)) as InternalApiResponse | null;
      if (!response.ok || !result?.success) {
        setError(getErrorMessage(result, "Falha ao redefinir senha."));
        return;
      }

      setFeedback("Senha redefinida com sucesso.");
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setError("Falha de conexão ao redefinir senha.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="admin-page-stack">
      <section className="admin-card">
        <h2>Novo usuário administrativo</h2>
        <form className="admin-form-grid" onSubmit={handleCreate}>
          <label>
            Nome completo
            <input name="fullName" required maxLength={120} placeholder="Nome do usuário" />
          </label>

          <label>
            E-mail
            <input name="email" type="email" required maxLength={254} placeholder="usuario@empresa.com" />
          </label>

          <label>
            Papel
            <select name="role" defaultValue="ADMIN">
              {INTERNAL_ADMIN_ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {INTERNAL_ROLE_LABEL[role]}
                </option>
              ))}
            </select>
          </label>

          <label>
            Senha inicial
            <input
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={256}
              placeholder="Senha forte"
            />
          </label>

          <button type="submit" className="admin-primary-button" disabled={!canManage || isPending}>
            Criar usuário
          </button>
        </form>
      </section>

      {feedback ? <p className="admin-feedback success">{feedback}</p> : null}
      {error ? <p className="admin-feedback error">{error}</p> : null}

      <section className="admin-card">
        <h2>Usuários cadastrados</h2>
        <div className="admin-users-stack">
          {users.map((user) => (
            <article className="admin-user-item" key={user.id}>
              <header>
                <strong>{user.fullName}</strong>
                <span>{user.email}</span>
              </header>

              <form className="admin-user-form" onSubmit={(event) => handleUpdate(event, user.id)}>
                <label>
                  Nome
                  <input name="fullName" defaultValue={user.fullName} maxLength={120} required />
                </label>

                <label>
                  Papel
                  <select name="role" defaultValue={user.role.key}>
                    {INTERNAL_ADMIN_ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {INTERNAL_ROLE_LABEL[role]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-checkbox-line">
                  <input name="isActive" type="checkbox" defaultChecked={user.isActive} />
                  Usuário ativo
                </label>

                <button type="submit" className="admin-ghost-button" disabled={!canManage || isPending}>
                  Salvar
                </button>
              </form>

              <form
                className="admin-user-reset-form"
                onSubmit={(event) => handleResetPassword(event, user.id)}
              >
                <label>
                  Nova senha
                  <input
                    name="password"
                    type="password"
                    minLength={12}
                    maxLength={256}
                    required
                    placeholder="Nova senha forte"
                  />
                </label>
                <button type="submit" className="admin-ghost-button" disabled={!canManage || isPending}>
                  Redefinir senha
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
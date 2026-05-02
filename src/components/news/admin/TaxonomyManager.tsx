"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  allowIndexing?: boolean;
  postCount?: number;
};

type TagItem = {
  id: string;
  name: string;
  slug: string;
  postCount?: number;
};

type TaxonomyManagerProps = {
  type: "categories" | "tags";
  items: CategoryItem[] | TagItem[];
};

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }
  const parts = document.cookie.split(";").map((entry) => entry.trim());
  for (const part of parts) {
    if (!part.startsWith(`${name}=`)) {
      continue;
    }
    return decodeURIComponent(part.slice(name.length + 1));
  }
  return "";
}

function buildRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function TaxonomyManager({ type, items }: TaxonomyManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [allowIndexing, setAllowIndexing] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const endpoint = `/api/admin/${type}`;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      setError(null);
      setSuccess(null);

      const csrf = readCookie("credpago_admin_csrf");
      const payload =
        type === "categories"
          ? {
              name,
              slug,
              description,
              color,
              allowIndexing,
            }
          : {
              name,
              slug,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
          "x-request-id": buildRequestId(),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error?.message ?? "Não foi possível criar.");
        return;
      }

      setSuccess(type === "categories" ? "Categoria criada." : "Tag criada.");
      setName("");
      setSlug("");
      setDescription("");
      setColor("");
      setAllowIndexing(true);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    if (!window.confirm("Tem certeza que deseja remover este item?")) {
      return;
    }

    startTransition(async () => {
      setError(null);
      setSuccess(null);
      const csrf = readCookie("credpago_admin_csrf");

      const response = await fetch(`${endpoint}/${id}`, {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
          "x-request-id": buildRequestId(),
        },
        body: JSON.stringify({}),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error?.message ?? "Não foi possível remover.");
        return;
      }

      setSuccess("Item removido com sucesso.");
      router.refresh();
    });
  };

  return (
    <div className="credpago-news-admin-grid">
      <section className="credpago-news-admin-panel">
        <h2>{type === "categories" ? "Nova categoria" : "Nova tag"}</h2>

        <form style={{ display: "grid", gap: "0.7rem" }} onSubmit={submit}>
          <input
            className="credpago-news-admin-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome"
            required
          />

          <input
            className="credpago-news-admin-input"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="Slug (opcional)"
          />

          {type === "categories" ? (
            <>
              <textarea
                className="credpago-news-admin-textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descrição"
              />

              <input
                className="credpago-news-admin-input"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                placeholder="#22c55e"
              />

              <label>
                <input
                  type="checkbox"
                  checked={allowIndexing}
                  onChange={(event) => setAllowIndexing(event.target.checked)}
                />
                Permitir indexação
              </label>
            </>
          ) : null}

          <button className="credpago-news-admin-button" type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </button>
        </form>

        {error ? <p className="credpago-news-admin-error">{error}</p> : null}
        {success ? <p className="credpago-news-admin-success">{success}</p> : null}
      </section>

      <section className="credpago-news-admin-panel">
        <h2>{type === "categories" ? "Categorias" : "Tags"}</h2>

        <table className="credpago-news-admin-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Slug</th>
              <th>Posts</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4}>Nenhum item cadastrado.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.slug}</td>
                  <td>{String(item.postCount ?? 0)}</td>
                  <td>
                    <button
                      className="credpago-news-admin-button is-danger"
                      type="button"
                      disabled={isPending}
                      onClick={() => remove(item.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

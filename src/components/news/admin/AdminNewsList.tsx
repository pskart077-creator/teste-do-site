"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { NewsStatus, UserRole } from "@prisma/client";
import type { AdminNewsListDto } from "@/lib/news/mappings";
import type { AdminNewsDashboardOverview } from "@/lib/news/types";
import NewsStatusBadge from "@/components/news/shared/NewsStatusBadge";

type Option = {
  id: string;
  name: string;
};

type AdminNewsListProps = {
  items: AdminNewsListDto[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search: string;
    status?: NewsStatus;
    categoryId?: string;
    tagId?: string;
    orderBy: "newest" | "oldest" | "updated";
  };
  categories: Option[];
  tags: Option[];
  role: UserRole;
  dashboard: AdminNewsDashboardOverview;
  baseQuery: string;
};

function getCookie(name: string) {
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

function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildPageHref(baseQuery: string, page: number) {
  const searchParams = new URLSearchParams(baseQuery);
  if (page <= 1) {
    searchParams.delete("page");
  } else {
    searchParams.set("page", String(page));
  }
  const query = searchParams.toString();
  return query ? `/admin/news?${query}` : "/admin/news";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminNewsList({
  items,
  pagination,
  filters,
  categories,
  tags,
  role,
  dashboard,
  baseQuery,
}: AdminNewsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canPublish = role === "SUPER_ADMIN" || role === "EDITOR";
  const canDelete = role === "SUPER_ADMIN" || role === "EDITOR";

  const kpis = [
    {
      label: "Total de notícias",
      value: dashboard.counts.total,
      tone: "neutral",
    },
    {
      label: "Publicadas",
      value: dashboard.counts.published,
      tone: "success",
    },
    {
      label: "Rascunhos",
      value: dashboard.counts.draft,
      tone: "warning",
    },
    {
      label: "Agendadas (48h)",
      value: dashboard.counts.scheduledNext48h,
      tone: "info",
    },
    {
      label: "Destaques",
      value: dashboard.counts.featured,
      tone: "neutral",
    },
    {
      label: "Atualizadas (7d)",
      value: dashboard.counts.updatedLast7d,
      tone: "success",
    },
  ] as const;

  const mutate = (endpoint: string, options: RequestInit, successMessage: string) => {
    startTransition(async () => {
      setError(null);
      setMessage(null);

      const csrfToken = getCookie("credpago_admin_csrf");
      const headers = new Headers(options.headers);
      headers.set("content-type", "application/json");
      headers.set("x-csrf-token", csrfToken);
      headers.set("x-request-id", createRequestId());

      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        setError(payload?.error?.message ?? "Falha na operação.");
        return;
      }

      setMessage(successMessage);
      router.refresh();
    });
  };

  return (
    <section className="credpago-news-admin-card">
      <div className="credpago-news-admin-dashboard-hero">
        <div>
          <p className="credpago-news-admin-eyebrow">News Operations</p>
          <h2 className="credpago-news-admin-title">Central de comando editorial</h2>
          <p className="credpago-news-admin-user">
            Proteções ativas: sessão segura, CSRF, replay protection e rate limit.
          </p>
        </div>

        <div className="credpago-news-admin-dashboard-meta">
          <span>Snapshot</span>
          <strong>{formatDateTime(dashboard.generatedAt)}</strong>
        </div>
      </div>

      <section className="credpago-news-admin-kpi-grid" aria-label="Indicadores de operação">
        {kpis.map((item) => (
          <article key={item.label} className="credpago-news-admin-kpi-card" data-tone={item.tone}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="credpago-news-admin-insight-grid">
        <article className="credpago-news-admin-panel">
          <h3>Top categorias</h3>
          {dashboard.topCategories.length === 0 ? (
            <p className="credpago-news-admin-user">Sem categorias com notícias publicadas.</p>
          ) : (
            <ul className="credpago-news-admin-ranking-list">
              {dashboard.topCategories.map((category) => (
                <li key={category.id}>
                  <span>{category.name}</span>
                  <strong>{category.postCount}</strong>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="credpago-news-admin-panel">
          <h3>Últimas alterações</h3>
          {dashboard.recentUpdates.length === 0 ? (
            <p className="credpago-news-admin-user">Nenhuma atualização recente.</p>
          ) : (
            <ul className="credpago-news-admin-update-list">
              {dashboard.recentUpdates.map((item) => (
                <li key={item.id}>
                  <Link href={`/admin/news/${item.id}`}>
                    <strong>{item.title}</strong>
                    <span>
                      {item.categoryName} · {item.authorName} · {formatDateTime(item.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <form className="credpago-news-admin-toolbar" method="GET" action="/admin/news">
        <input
          className="credpago-news-admin-input"
          type="search"
          name="search"
          defaultValue={filters.search}
          placeholder="Buscar por título ou slug"
        />

        <select className="credpago-news-admin-select" name="status" defaultValue={filters.status || ""}>
          <option value="">Todos status</option>
          <option value="DRAFT">Rascunho</option>
          <option value="SCHEDULED">Agendada</option>
          <option value="PUBLISHED">Publicada</option>
          <option value="ARCHIVED">Arquivada</option>
        </select>

        <select
          className="credpago-news-admin-select"
          name="categoryId"
          defaultValue={filters.categoryId || ""}
        >
          <option value="">Todas categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select className="credpago-news-admin-select" name="tagId" defaultValue={filters.tagId || ""}>
          <option value="">Todas tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>

        <select className="credpago-news-admin-select" name="orderBy" defaultValue={filters.orderBy}>
          <option value="newest">Mais novas</option>
          <option value="oldest">Mais antigas</option>
          <option value="updated">Atualizadas</option>
        </select>

        <button type="submit" className="credpago-news-admin-button">
          Filtrar
        </button>
      </form>

      {error ? <p className="credpago-news-admin-error">{error}</p> : null}
      {message ? <p className="credpago-news-admin-success">{message}</p> : null}

      <div className="credpago-news-admin-table-wrap">
        <table className="credpago-news-admin-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Status</th>
              <th>Categoria</th>
              <th>Tags</th>
              <th>Publicação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6}>Nenhuma notícia encontrada com os filtros atuais.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: "grid", gap: "0.2rem" }}>
                      <strong>{item.title}</strong>
                      <span style={{ opacity: 0.72 }}>{item.slug}</span>
                    </div>
                  </td>
                  <td>
                    <NewsStatusBadge status={item.status} />
                  </td>
                  <td>{item.category.name}</td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                      {item.tags.map((tag) => (
                        <span key={tag.id} className="credpago-news-chip">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {item.publishedAt
                      ? new Date(item.publishedAt).toLocaleDateString("pt-BR")
                      : item.scheduledAt
                        ? `Agendada: ${new Date(item.scheduledAt).toLocaleString("pt-BR")}`
                        : "-"}
                  </td>
                  <td>
                    <div className="credpago-news-admin-actions">
                      <Link className="credpago-news-admin-button is-muted" href={`/admin/news/${item.id}`}>
                        Editar
                      </Link>

                      <Link className="credpago-news-admin-button is-muted" href={`/news/${item.slug}`}>
                        Preview
                      </Link>

                      <button
                        className="credpago-news-admin-button is-muted"
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          mutate(
                            `/api/admin/news/${item.id}/duplicate`,
                            {
                              method: "POST",
                              body: JSON.stringify({}),
                            },
                            "Notícia duplicada com sucesso.",
                          )
                        }
                      >
                        Duplicar
                      </button>

                      {canPublish ? (
                        <button
                          className="credpago-news-admin-button"
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            mutate(
                              `/api/admin/news/${item.id}/publish`,
                              {
                                method: "POST",
                                body: JSON.stringify({}),
                              },
                              "Notícia publicada com sucesso.",
                            )
                          }
                        >
                          Publicar
                        </button>
                      ) : null}

                      {canDelete ? (
                        <button
                          className="credpago-news-admin-button is-danger"
                          type="button"
                          disabled={isPending}
                          onClick={() => {
                            if (!window.confirm("Tem certeza que deseja excluir esta notícia?")) {
                              return;
                            }
                            mutate(
                              `/api/admin/news/${item.id}`,
                              {
                                method: "DELETE",
                                body: JSON.stringify({}),
                              },
                              "Notícia excluída com sucesso.",
                            );
                          }}
                        >
                          Excluir
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="credpago-news-pager" style={{ justifyContent: "flex-end" }}>
        {pagination.page > 1 ? (
          <Link href={buildPageHref(baseQuery, pagination.page - 1)}>Anterior</Link>
        ) : (
          <span>Anterior</span>
        )}
        <span className="is-active">
          {pagination.page}/{pagination.totalPages}
        </span>
        {pagination.page < pagination.totalPages ? (
          <Link href={buildPageHref(baseQuery, pagination.page + 1)}>Próxima</Link>
        ) : (
          <span>Próxima</span>
        )}
      </div>
    </section>
  );
}

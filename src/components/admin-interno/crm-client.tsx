"use client";

import { FormEvent, useMemo, useState } from "react";
import { CRM_STAGE_LABEL, CRM_STAGE_ORDER } from "@/lib/admin-interno/constants";
import { getLeadEmailDisplay } from "@/lib/admin-interno/lead-email";

type CrmDealStage =
  | "NOVO_CONTATO"
  | "DIAGNOSTICO"
  | "PROPOSTA"
  | "NEGOCIACAO"
  | "GANHO"
  | "PERDIDO";

type CrmTaskStatus = "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELED";

type DealActivity = {
  id: string;
  type: string;
  description: string;
  createdAt: string | Date;
  actor: {
    id: string;
    fullName: string;
  } | null;
};

type DealTask = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | Date | null;
  status: CrmTaskStatus;
  assignee: {
    id: string;
    fullName: string;
  } | null;
};

type DealRecord = {
  id: string;
  title: string;
  stage: CrmDealStage;
  valueCents: number | null;
  currency: string;
  probability: number;
  source: string | null;
  notes: string | null;
  ownerId: string | null;
  owner: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  lead: {
    id: string;
    name: string;
    email: string;
    company: string | null;
  } | null;
  account: {
    id: string;
    name: string;
  } | null;
  contact: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
  } | null;
  activities: DealActivity[];
  tasks: DealTask[];
  updatedAt: string | Date;
};

type StageSummary = {
  stage: CrmDealStage;
  count: number;
  valueCents: number;
};

type CrmClientProps = {
  canManage: boolean;
  deals: DealRecord[];
  byStage: StageSummary[];
  metrics: {
    totalDeals: number;
    openDeals: number;
    wonDeals: number;
    openValueCents: number;
    wonValueCents: number;
  };
  users: Array<{
    id: string;
    fullName: string;
  }>;
  leads: Array<{
    id: string;
    name: string;
    email: string;
    company: string | null;
  }>;
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

function formatMoney(valueCents: number | null, currency = "BRL") {
  if (valueCents == null) {
    return "-";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(valueCents / 100);
}

function asDateLabel(value: string | Date | null | undefined) {
  if (!value) {
    return "-";
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("pt-BR");
}

function normalizeDeal(input: DealRecord): DealRecord {
  return {
    ...input,
    activities: input.activities.map((item) => ({
      ...item,
      createdAt:
        item.createdAt instanceof Date
          ? item.createdAt.toISOString()
          : item.createdAt,
    })),
    tasks: input.tasks.map((item) => ({
      ...item,
      dueAt:
        item.dueAt instanceof Date
          ? item.dueAt.toISOString()
          : item.dueAt,
    })),
    updatedAt:
      input.updatedAt instanceof Date ? input.updatedAt.toISOString() : input.updatedAt,
  };
}

export function CrmClient(props: CrmClientProps) {
  const [deals, setDeals] = useState<DealRecord[]>(
    props.deals.map((deal) => normalizeDeal(deal)),
  );
  const [search, setSearch] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredDeals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return deals;
    }

    return deals.filter((deal) => {
      const values = [
        deal.title,
        deal.lead?.name ?? "",
        deal.lead?.email ?? "",
        deal.account?.name ?? "",
        deal.contact?.fullName ?? "",
        deal.source ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return values.includes(query);
    });
  }, [deals, search]);

  const board = useMemo(() => {
    const base = Object.fromEntries(
      CRM_STAGE_ORDER.map((stage) => [stage, [] as DealRecord[]]),
    ) as Record<CrmDealStage, DealRecord[]>;

    for (const deal of filteredDeals) {
      base[deal.stage].push(deal);
    }

    return base;
  }, [filteredDeals]);

  function upsertDeal(nextDeal: DealRecord) {
    const normalized = normalizeDeal(nextDeal);
    setDeals((previous) => {
      const currentIndex = previous.findIndex((item) => item.id === normalized.id);
      if (currentIndex === -1) {
        return [normalized, ...previous];
      }

      return previous.map((item) => (item.id === normalized.id ? normalized : item));
    });
  }

  async function handleCreateDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!props.canManage || isPending) {
      return;
    }

    setIsPending(true);
    setError(null);
    setFeedback(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await internalFetch("/admin-interno/api/crm/deals", {
        method: "POST",
        body: JSON.stringify({
          title: String(form.get("title") ?? ""),
          stage: String(form.get("stage") ?? "NOVO_CONTATO"),
          leadId: String(form.get("leadId") ?? "") || null,
          ownerId: String(form.get("ownerId") ?? "") || null,
          valueCents: form.get("valueCents")
            ? Number(form.get("valueCents"))
            : null,
          source: String(form.get("source") ?? "") || null,
          notes: String(form.get("notes") ?? "") || null,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error?.message ?? "Falha ao criar negócio.");
        return;
      }

      upsertDeal(result.data.deal as DealRecord);
      setFeedback("Negócio criado com sucesso.");
      event.currentTarget.reset();
    } catch {
      setError("Falha de conexão ao criar negócio.");
    } finally {
      setIsPending(false);
    }
  }

  async function updateDeal(dealId: string, payload: Record<string, unknown>) {
    if (!props.canManage || isPending) {
      return;
    }

    setIsPending(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await internalFetch(`/admin-interno/api/crm/deals/${dealId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error?.message ?? "Falha ao atualizar negócio.");
        return;
      }

      upsertDeal(result.data.deal as DealRecord);
      setFeedback("Negócio atualizado.");
    } catch {
      setError("Falha de conexão ao atualizar negócio.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleAddActivity(
    event: FormEvent<HTMLFormElement>,
    dealId: string,
  ) {
    event.preventDefault();
    if (!props.canManage || isPending) {
      return;
    }

    setIsPending(true);
    setError(null);
    setFeedback(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      type: String(form.get("type") ?? "NOTE"),
      description: String(form.get("description") ?? ""),
    };

    try {
      const response = await internalFetch(
        `/admin-interno/api/crm/deals/${dealId}/activities`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error?.message ?? "Falha ao adicionar atividade.");
        return;
      }

      const activity = result.data.activity as DealActivity;
      setDeals((previous) =>
        previous.map((deal) =>
          deal.id === dealId
            ? { ...deal, activities: [activity, ...deal.activities].slice(0, 8) }
            : deal,
        ),
      );
      setFeedback("Atividade registrada.");
      event.currentTarget.reset();
    } catch {
      setError("Falha de conexão ao adicionar atividade.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleAddTask(event: FormEvent<HTMLFormElement>, dealId: string) {
    event.preventDefault();
    if (!props.canManage || isPending) {
      return;
    }

    setIsPending(true);
    setError(null);
    setFeedback(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await internalFetch(`/admin-interno/api/crm/deals/${dealId}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title: String(form.get("title") ?? ""),
          dueAt: String(form.get("dueAt") ?? "") || null,
          assigneeId: String(form.get("assigneeId") ?? "") || null,
          description: String(form.get("description") ?? "") || null,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error?.message ?? "Falha ao criar tarefa.");
        return;
      }

      const task = result.data.task as DealTask;
      setDeals((previous) =>
        previous.map((deal) =>
          deal.id === dealId ? { ...deal, tasks: [task, ...deal.tasks].slice(0, 12) } : deal,
        ),
      );
      setFeedback("Tarefa criada.");
      event.currentTarget.reset();
    } catch {
      setError("Falha de conexão ao criar tarefa.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleTaskStatusChange(
    dealId: string,
    taskId: string,
    nextStatus: CrmTaskStatus,
  ) {
    if (!props.canManage || isPending) {
      return;
    }

    setIsPending(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await internalFetch(
        `/admin-interno/api/crm/deals/${dealId}/tasks/${taskId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatus,
          }),
        },
      );

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error?.message ?? "Falha ao atualizar tarefa.");
        return;
      }

      const task = result.data.task as DealTask;
      setDeals((previous) =>
        previous.map((deal) => ({
          ...deal,
          tasks: deal.tasks.map((item) => (item.id === task.id ? task : item)),
        })),
      );
      setFeedback("Tarefa atualizada.");
    } catch {
      setError("Falha de conexão ao atualizar tarefa.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="admin-page-stack">
      <section className="admin-metrics-grid">
        <article className="admin-metric-card">
          <p>Total de negócios</p>
          <strong>{props.metrics.totalDeals}</strong>
        </article>
        <article className="admin-metric-card">
          <p>Negócios abertos</p>
          <strong>{props.metrics.openDeals}</strong>
        </article>
        <article className="admin-metric-card">
          <p>Negócios ganhos</p>
          <strong>{props.metrics.wonDeals}</strong>
        </article>
        <article className="admin-metric-card">
          <p>Pipeline aberto</p>
          <strong>{formatMoney(props.metrics.openValueCents)}</strong>
        </article>
        <article className="admin-metric-card">
          <p>Valor ganho</p>
          <strong>{formatMoney(props.metrics.wonValueCents)}</strong>
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <h2>CRM Comercial</h2>
          <label>
            Buscar negócio
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Título, contato, conta ou lead"
            />
          </label>
        </div>

        <form className="admin-form-grid admin-crm-create" onSubmit={handleCreateDeal}>
          <label>
            Título
            <input name="title" required maxLength={180} placeholder="Ex: Contrato anual Credpagos Pay" />
          </label>

          <label>
            Etapa
            <select name="stage" defaultValue="NOVO_CONTATO">
              {CRM_STAGE_ORDER.map((stage) => (
                <option key={stage} value={stage}>
                  {CRM_STAGE_LABEL[stage]}
                </option>
              ))}
            </select>
          </label>

          <label>
            Lead
            <select name="leadId" defaultValue="">
              <option value="">Sem lead vinculado</option>
              {props.leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} ({getLeadEmailDisplay(lead.email)})
                </option>
              ))}
            </select>
          </label>

          <label>
            Responsável
            <select name="ownerId" defaultValue="">
              <option value="">Não atribuído</option>
              {props.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Valor (centavos)
            <input name="valueCents" type="number" min={0} step={100} placeholder="100000" />
          </label>

          <label>
            Origem
            <input name="source" maxLength={120} placeholder="Inbound / evento / referral" />
          </label>

          <label>
            Observações
            <input name="notes" maxLength={5000} placeholder="Contexto inicial da oportunidade" />
          </label>

          <button
            type="submit"
            className="admin-primary-button"
            disabled={!props.canManage || isPending}
          >
            Criar negócio
          </button>
        </form>
      </section>

      {feedback ? <p className="admin-feedback success">{feedback}</p> : null}
      {error ? <p className="admin-feedback error">{error}</p> : null}

      <section className="admin-crm-board">
        {CRM_STAGE_ORDER.map((stage) => (
          <article key={stage} className="admin-crm-column">
            <header className="admin-crm-column-header">
              <h3>{CRM_STAGE_LABEL[stage]}</h3>
              <span>{board[stage].length}</span>
            </header>

            <div className="admin-crm-column-body">
              {board[stage].map((deal) => (
                <section key={deal.id} className="admin-crm-card">
                  <header>
                    <strong>{deal.title}</strong>
                    <span>{formatMoney(deal.valueCents, deal.currency)}</span>
                  </header>

                  <p>
                    Lead: {deal.lead?.name ?? "-"} | Conta: {deal.account?.name ?? "-"}
                  </p>
                  <p>
                    Contato: {deal.contact?.fullName ?? "-"} | Fonte: {deal.source ?? "-"}
                  </p>
                  <p>Atualizado: {asDateLabel(deal.updatedAt)}</p>

                  <div className="admin-crm-card-controls">
                    <label>
                      Etapa
                      <select
                        value={deal.stage}
                        onChange={(event) =>
                          void updateDeal(deal.id, {
                            stage: event.target.value,
                          })
                        }
                        disabled={!props.canManage || isPending}
                      >
                        {CRM_STAGE_ORDER.map((option) => (
                          <option key={option} value={option}>
                            {CRM_STAGE_LABEL[option]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Responsável
                      <select
                        value={deal.ownerId ?? ""}
                        onChange={(event) =>
                          void updateDeal(deal.id, {
                            ownerId: event.target.value || null,
                          })
                        }
                        disabled={!props.canManage || isPending}
                      >
                        <option value="">Não atribuído</option>
                        {props.users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.fullName}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <form
                    className="admin-crm-inline-form"
                    onSubmit={(event) => handleAddActivity(event, deal.id)}
                  >
                    <label>
                      Nova atividade
                      <select name="type" defaultValue="NOTE">
                        <option value="NOTE">Nota</option>
                        <option value="CALL">Ligação</option>
                        <option value="EMAIL">E-mail</option>
                        <option value="MEETING">Reunião</option>
                      </select>
                    </label>
                    <label>
                      Descrição
                      <input name="description" required maxLength={2000} />
                    </label>
                    <button
                      type="submit"
                      className="admin-ghost-button"
                      disabled={!props.canManage || isPending}
                    >
                      Registrar
                    </button>
                  </form>

                  <ul className="admin-crm-list">
                    {deal.activities.map((activity) => (
                      <li key={activity.id}>
                        <strong>{activity.type}</strong>
                        <p>{activity.description}</p>
                        <small>
                          {activity.actor?.fullName ?? "Sistema"} em{" "}
                          {asDateLabel(activity.createdAt)}
                        </small>
                      </li>
                    ))}
                    {!deal.activities.length ? <li>Sem atividades.</li> : null}
                  </ul>

                  <form
                    className="admin-crm-inline-form"
                    onSubmit={(event) => handleAddTask(event, deal.id)}
                  >
                    <label>
                      Tarefa
                      <input name="title" required maxLength={180} />
                    </label>
                    <label>
                      Prazo
                      <input name="dueAt" type="datetime-local" />
                    </label>
                    <label>
                      Responsável
                      <select name="assigneeId" defaultValue="">
                        <option value="">Não atribuído</option>
                        {props.users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.fullName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="submit"
                      className="admin-ghost-button"
                      disabled={!props.canManage || isPending}
                    >
                      Criar tarefa
                    </button>
                  </form>

                  <ul className="admin-crm-list">
                    {deal.tasks.map((task) => (
                      <li key={task.id}>
                        <strong>{task.title}</strong>
                        <p>
                          {task.assignee?.fullName ?? "Sem responsável"} | Prazo:{" "}
                          {asDateLabel(task.dueAt)}
                        </p>
                        <label>
                          Status
                          <select
                            value={task.status}
                            onChange={(event) =>
                              void handleTaskStatusChange(
                                deal.id,
                                task.id,
                                event.target.value as CrmTaskStatus,
                              )
                            }
                            disabled={!props.canManage || isPending}
                          >
                            <option value="OPEN">Aberta</option>
                            <option value="IN_PROGRESS">Em andamento</option>
                            <option value="DONE">Concluída</option>
                            <option value="CANCELED">Cancelada</option>
                          </select>
                        </label>
                      </li>
                    ))}
                    {!deal.tasks.length ? <li>Sem tarefas.</li> : null}
                  </ul>
                </section>
              ))}
              {!board[stage].length ? (
                <p className="admin-crm-empty">Nenhum negócio nesta etapa.</p>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

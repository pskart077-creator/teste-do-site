"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CHAT_PRIORITY_LABEL,
  CHAT_PRIORITY_ORDER,
  CHAT_STATUS_LABEL,
  CHAT_STATUS_ORDER,
} from "@/lib/admin-interno/constants";

type ChatConversationStatus =
  | "OPEN"
  | "WAITING_ATTENDANT"
  | "WAITING_VISITOR"
  | "RESOLVED"
  | "ARCHIVED";

type ChatConversationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
type ChatMessageSenderType = "VISITOR" | "ATTENDANT" | "SYSTEM";
type ChatProtocolStep = "ASK_NAME" | "ASK_PHONE" | "READY";

type ChatProtocolState = {
  step: ChatProtocolStep;
  nameCollected: boolean;
  phoneCollected: boolean;
  isQualifiedForAttendant: boolean;
};

type ChatMessage = {
  id: string;
  senderType: ChatMessageSenderType;
  body: string;
  createdAt: string | Date;
  senderAdmin: {
    id: string;
    fullName: string;
  } | null;
};

type ChatDealSummary = {
  id: string;
  title: string;
  stage: string;
  valueCents: number | null;
  updatedAt: string | Date;
  owner: {
    id: string;
    fullName: string;
  } | null;
};

type ChatContactSummary = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  account: {
    id: string;
    name: string;
  } | null;
};

type ChatLeadSummary = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: string;
  priority: string;
  crmContact: ChatContactSummary | null;
  crmDeals: ChatDealSummary[];
};

type ChatConversationListItem = {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  visitorPhone: string | null;
  source: string | null;
  sourcePage: string | null;
  status: ChatConversationStatus;
  priority: ChatConversationPriority;
  assignedToId: string | null;
  assignedTo: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  unreadForAdmin: number;
  unreadForVisitor: number;
  lastMessageAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  latestMessage: ChatMessage | null;
  protocol?: ChatProtocolState;
};

type ChatConversationDetail = {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  visitorPhone: string | null;
  source: string | null;
  sourcePage: string | null;
  campaign: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  status: ChatConversationStatus;
  priority: ChatConversationPriority;
  assignedToId: string | null;
  assignedTo: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  unreadForAdmin: number;
  unreadForVisitor: number;
  lastMessageAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  protocol: ChatProtocolState;
  lead: ChatLeadSummary | null;
  identity: {
    matchedLead: ChatLeadSummary | null;
    matchedCrmContact: ChatContactSummary | null;
    recentDeals: ChatDealSummary[];
  };
  messages: ChatMessage[];
};

type InternalChatClientProps = {
  canManage: boolean;
  currentUserId: string;
  users: Array<{
    id: string;
    fullName: string;
  }>;
  initialList: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    conversations: ChatConversationListItem[];
    metrics: {
      unreadCount: number;
      byStatus: Array<{
        status: ChatConversationStatus;
        _count: {
          _all: number;
        };
      }>;
    };
  };
  initialSelectedConversation: ChatConversationDetail | null;
};

function readCookie(name: string) {
  const found = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((item) => item.startsWith(`${name}=`));

  return found ? decodeURIComponent(found.slice(name.length + 1)) : "";
}

async function internalFetch(url: string, init?: RequestInit) {
  return fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-admin-csrf-token": readCookie("credpago_internal_admin_csrf"),
      ...(init?.headers ?? {}),
    },
  });
}

function toDateLabel(value: string | Date | null | undefined) {
  if (!value) {
    return "-";
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("pt-BR");
}

function toConversationTimeLabel(value: string | Date | null | undefined) {
  if (!value) {
    return "-";
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  const now = new Date();
  const isSameDay =
    parsed.getDate() === now.getDate() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getFullYear() === now.getFullYear();

  if (isSameDay) {
    return parsed.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function initialsFromName(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  if (!text) {
    return "CL";
  }

  const parts = text.split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "CL";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function toMoneyLabel(valueCents: number | null | undefined) {
  if (typeof valueCents !== "number") {
    return "-";
  }

  return (valueCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function protocolStepLabel(step: ChatProtocolStep) {
  if (step === "ASK_NAME") {
    return "Aguardando nome completo";
  }

  if (step === "ASK_PHONE") {
    return "Aguardando telefone";
  }

  return "Cadastro qualificado";
}

function buildListUrl(input: {
  page?: number;
  pageSize?: number;
  status?: ChatConversationStatus | "";
  q?: string;
  onlyUnread?: boolean;
}) {
  const search = new URLSearchParams();
  if (input.page) {
    search.set("page", String(input.page));
  }
  if (input.pageSize) {
    search.set("pageSize", String(input.pageSize));
  }
  if (input.status) {
    search.set("status", input.status);
  }
  if (input.q?.trim()) {
    search.set("q", input.q.trim());
  }
  if (input.onlyUnread) {
    search.set("onlyUnread", "1");
  }

  return `/admin-interno/api/chat/conversations?${search.toString()}`;
}

export function InternalChatClient(props: InternalChatClientProps) {
  const [conversations, setConversations] = useState(props.initialList.conversations);
  const [metrics, setMetrics] = useState(props.initialList.metrics);
  const [selectedId, setSelectedId] = useState<string | null>(
    props.initialSelectedConversation?.id ?? props.initialList.conversations[0]?.id ?? null,
  );
  const [selectedConversation, setSelectedConversation] = useState<ChatConversationDetail | null>(
    props.initialSelectedConversation,
  );
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ChatConversationStatus | "">("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [conversationStatus, setConversationStatus] = useState<ChatConversationStatus>("OPEN");
  const [conversationPriority, setConversationPriority] =
    useState<ChatConversationPriority>("NORMAL");
  const [assigneeId, setAssigneeId] = useState("");
  const messagesWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedConversation) {
      return;
    }

    setConversationStatus(selectedConversation.status);
    setConversationPriority(selectedConversation.priority);
    setAssigneeId(selectedConversation.assignedToId ?? "");
  }, [selectedConversation]);

  useEffect(() => {
    if (!messagesWrapRef.current) {
      return;
    }

    messagesWrapRef.current.scrollTop = messagesWrapRef.current.scrollHeight;
  }, [selectedConversation?.messages.length]);

  const statusCounter = useMemo(() => {
    const map = new Map<ChatConversationStatus, number>();
    for (const item of metrics.byStatus) {
      map.set(item.status, item._count._all);
    }
    return map;
  }, [metrics.byStatus]);
  const isClaimedByAnotherAttendant = Boolean(
    selectedConversation?.assignedToId &&
    selectedConversation.assignedToId !== props.currentUserId,
  );

  const refreshList = useCallback(async (overrides?: {
    q?: string;
    status?: ChatConversationStatus | "";
    onlyUnread?: boolean;
  }) => {
    const query = overrides?.q ?? appliedQuery;
    const status = overrides?.status ?? statusFilter;
    const unreadOnly = overrides?.onlyUnread ?? onlyUnread;

    const response = await fetch(
      buildListUrl({
        page: 1,
        pageSize: 24,
        status,
        q: query,
        onlyUnread: unreadOnly,
      }),
      {
        credentials: "include",
        cache: "no-store",
      },
    );

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      throw new Error(result?.error?.message ?? "Falha ao atualizar a fila de chat.");
    }

    const nextConversations = result.data.conversations as ChatConversationListItem[];
    setConversations(nextConversations);
    setMetrics(result.data.metrics);

    if (!nextConversations.length) {
      setSelectedId(null);
      setSelectedConversation(null);
      return;
    }

    if (!selectedId || !nextConversations.find((item) => item.id === selectedId)) {
      setSelectedId(nextConversations[0].id);
    }
  }, [appliedQuery, onlyUnread, selectedId, statusFilter]);

  const refreshConversation = useCallback(async (conversationId: string, trackView = false) => {
    const response = await fetch(
      `/admin-interno/api/chat/conversations/${conversationId}${trackView ? "?trackView=1" : ""
      }`,
      {
        credentials: "include",
        cache: "no-store",
      },
    );

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      throw new Error(result?.error?.message ?? "Falha ao carregar a conversa.");
    }

    setSelectedConversation(result.data as ChatConversationDetail);
  }, []);

  async function markAsRead(conversationId: string) {
    const response = await internalFetch(`/admin-interno/api/chat/conversations/${conversationId}/read`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      throw new Error(result?.error?.message ?? "Falha ao marcar conversa como lida.");
    }
  }

  async function handleSelectConversation(conversationId: string) {
    setSelectedId(conversationId);
    setError(null);
    setFeedback(null);

    try {
      await Promise.all([refreshConversation(conversationId, true), markAsRead(conversationId)]);
      await refreshList();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao abrir conversa.");
    }
  }

  const runRefreshCycle = useCallback(async () => {
    try {
      await refreshList();
      if (selectedId) {
        await refreshConversation(selectedId);
      }
    } catch {
      // polling silently retries
    }
  }, [refreshConversation, refreshList, selectedId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.hidden) {
        return;
      }
      void runRefreshCycle();
    }, 3500);

    return () => {
      window.clearInterval(interval);
    };
  }, [runRefreshCycle]);

  async function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = queryInput.trim();
    setAppliedQuery(nextQuery);
    setError(null);
    try {
      await refreshList({
        q: nextQuery,
      });
      if (selectedId) {
        await refreshConversation(selectedId);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao aplicar filtros.");
    }
  }

  async function handleSaveConversation() {
    if (!selectedConversation || !props.canManage || isPending || isClaimedByAnotherAttendant) {
      return;
    }

    setIsPending(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await internalFetch(
        `/admin-interno/api/chat/conversations/${selectedConversation.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: conversationStatus,
            priority: conversationPriority,
            assignedToId: assigneeId || null,
          }),
        },
      );

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error?.message ?? "Falha ao atualizar conversa.");
        return;
      }

      setFeedback("Conversa atualizada.");
      await Promise.all([refreshList(), refreshConversation(selectedConversation.id)]);
    } catch {
      setError("Falha de conexão ao atualizar conversa.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !selectedConversation ||
      !message.trim() ||
      !props.canManage ||
      isPending ||
      isClaimedByAnotherAttendant
    ) {
      return;
    }

    setIsPending(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await internalFetch(
        `/admin-interno/api/chat/conversations/${selectedConversation.id}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            message,
          }),
        },
      );

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error?.message ?? "Falha ao enviar mensagem.");
        return;
      }

      setMessage("");
      setFeedback("Mensagem enviada.");
      await Promise.all([refreshList(), refreshConversation(selectedConversation.id)]);
    } catch {
      setError("Falha de conexão ao enviar mensagem.");
    } finally {
      setIsPending(false);
    }
  }

  const selectedProtocol = selectedConversation?.protocol ?? null;
  const claimedAttendantName = selectedConversation?.assignedTo?.fullName ?? "Outro atendente";
  const matchedLead =
    selectedConversation?.identity?.matchedLead ??
    selectedConversation?.lead ??
    null;
  const matchedContact =
    selectedConversation?.identity?.matchedCrmContact ??
    matchedLead?.crmContact ??
    null;
  const recentDeals =
    selectedConversation?.identity?.recentDeals?.length
      ? selectedConversation.identity.recentDeals
      : matchedLead?.crmDeals ?? [];

  return (
    <div className="admin-page-stack admin-page-stack--chat">
      <section className="admin-card admin-chat-layout admin-chat-layout--whatsapp">
        <aside className="admin-chat-sidebar">
          <header className="admin-chat-sidebar-header">
            <h2>Conversas</h2>
            <p>{metrics.unreadCount} não lida(s)</p>
          </header>

          <form className="admin-chat-filters" onSubmit={handleApplyFilters}>
            <label>
              Buscar
              <input
                type="search"
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="Nome, e-mail, telefone, origem"
              />
            </label>

            <div className="admin-chat-filters-row">
              <label>
                Status
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as ChatConversationStatus | "")
                  }
                >
                  <option value="">Todos</option>
                  {CHAT_STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {CHAT_STATUS_LABEL[status]} ({statusCounter.get(status) ?? 0})
                    </option>
                  ))}
                </select>
              </label>

              <button type="submit" className="admin-ghost-button">
                Aplicar
              </button>
            </div>

            <label className="admin-checkbox-line">
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={(event) => setOnlyUnread(event.target.checked)}
              />
              Somente não lidas
            </label>
          </form>

          <div className="admin-chat-list" role="list">
            {conversations.map((conversation) => {
              const displayName =
                conversation.visitorName ??
                conversation.visitorEmail ??
                conversation.visitorPhone ??
                "Visitante";
              const previewText = conversation.latestMessage?.body ?? "Sem mensagens ainda.";
              const assigneeLabel = conversation.assignedTo?.fullName ?? "Não atribuído";
              const stateText = conversation.protocol
                ? `${CHAT_STATUS_LABEL[conversation.status]} | ${protocolStepLabel(conversation.protocol.step)} | ${assigneeLabel}`
                : `${CHAT_STATUS_LABEL[conversation.status]} | ${assigneeLabel}`;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  className={
                    selectedId === conversation.id
                      ? "admin-chat-list-item is-active"
                      : "admin-chat-list-item"
                  }
                  onClick={() => void handleSelectConversation(conversation.id)}
                >
                  <span className="admin-chat-list-avatar" aria-hidden="true">
                    {initialsFromName(displayName)}
                  </span>

                  <div className="admin-chat-list-body">
                    <div className="admin-chat-list-top">
                      <strong>{displayName}</strong>
                      <span>{toConversationTimeLabel(conversation.lastMessageAt ?? conversation.createdAt)}</span>
                    </div>

                    <p className="admin-chat-list-contact">
                      {conversation.visitorEmail ?? conversation.visitorPhone ?? "Sem contato informado"}
                    </p>
                    <small className="admin-chat-last-message">{previewText}</small>
                    <small className="admin-chat-list-state">{stateText}</small>
                  </div>

                  {conversation.unreadForAdmin > 0 ? (
                    <span className="admin-chat-unread-badge">{conversation.unreadForAdmin}</span>
                  ) : null}
                </button>
              );
            })}

            {!conversations.length ? (
              <p className="admin-feedback">Nenhuma conversa encontrada para os filtros aplicados.</p>
            ) : null}
          </div>
        </aside>

        <div className="admin-chat-main">
          {selectedConversation ? (
            <>
              <header className="admin-chat-header">
                <div className="admin-chat-header-main">
                  <span className="admin-chat-header-avatar" aria-hidden="true">
                    {initialsFromName(
                      selectedConversation.visitorName ??
                      selectedConversation.visitorEmail ??
                      selectedConversation.visitorPhone ??
                      "Visitante",
                    )}
                  </span>

                  <div>
                    <h3>{selectedConversation.visitorName ?? "Visitante sem nome"}</h3>
                    <p>
                      {selectedConversation.visitorEmail ?? "Sem e-mail"}
                      {selectedConversation.visitorPhone ? ` | ${selectedConversation.visitorPhone}` : ""}
                    </p>
                    <small>
                      Origem: {selectedConversation.source ?? "-"} | Página:{" "}
                      {selectedConversation.sourcePage ?? "-"}
                    </small>
                    <small>
                      Atendente responsável: {selectedConversation.assignedTo?.fullName ?? "Não atribuído"}
                    </small>
                  </div>
                </div>

                {selectedConversation.lead ? (
                  <Link
                    className="admin-inline-link"
                    href={`/admin-interno/leads/${selectedConversation.lead.id}`}
                  >
                    Ver lead vinculado
                  </Link>
                ) : null}
              </header>

              {isClaimedByAnotherAttendant ? (
                <p className="admin-feedback error">
                  Esta conversa está em atendimento por {claimedAttendantName}. Você pode acompanhar, mas não pode assumir ou responder.
                </p>
              ) : null}

              <div className="admin-chat-thread-layout">
                <section className="admin-chat-thread">
                  <div className="admin-chat-messages" ref={messagesWrapRef}>
                    {selectedConversation.messages.map((item) => {
                      const isVisitor = item.senderType === "VISITOR";
                      const isSystem = item.senderType === "SYSTEM";
                      const senderLabel =
                        item.senderType === "ATTENDANT"
                          ? item.senderAdmin?.fullName ?? "Atendente"
                          : item.senderType === "SYSTEM"
                            ? "Sistema Credpagos"
                            : "Cliente";

                      return (
                        <article
                          key={item.id}
                          className={
                            isSystem
                              ? "admin-chat-row is-system"
                              : isVisitor
                                ? "admin-chat-row is-visitor"
                                : "admin-chat-row is-attendant"
                          }
                        >
                          {!isVisitor && !isSystem ? (
                            <span className="admin-chat-row-avatar" aria-hidden="true">
                              {initialsFromName(item.senderAdmin?.fullName ?? "Atendente")}
                            </span>
                          ) : null}

                          <div
                            className={
                              isSystem
                                ? "admin-chat-message is-system"
                                : isVisitor
                                  ? "admin-chat-message is-visitor"
                                  : "admin-chat-message is-attendant"
                            }
                          >
                            <header>
                              <strong>{senderLabel}</strong>
                              <span>{toDateLabel(item.createdAt)}</span>
                            </header>
                            <p>{item.body}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <form className="admin-chat-reply admin-chat-composer" onSubmit={handleSendMessage}>
                    <label className="admin-chat-composer-label">
                      Responder ao cliente
                      <div className="admin-chat-composer-row">
                        <textarea
                          value={message}
                          onChange={(event) => setMessage(event.target.value)}
                          rows={2}
                          maxLength={2400}
                          placeholder="Digite a resposta para o cliente..."
                        />
                        <button
                          type="submit"
                          className="admin-primary-button"
                          disabled={
                            !props.canManage ||
                            isPending ||
                            !message.trim() ||
                            isClaimedByAnotherAttendant
                          }
                        >
                          {isPending ? "Enviando..." : "Enviar"}
                        </button>
                      </div>
                    </label>
                  </form>
                </section>

                <aside className="admin-chat-context">
                  <div className="admin-chat-meta-grid">
                    <label>
                      Status
                      <select
                        value={conversationStatus}
                        disabled={!props.canManage || isClaimedByAnotherAttendant}
                        onChange={(event) =>
                          setConversationStatus(event.target.value as ChatConversationStatus)
                        }
                      >
                        {CHAT_STATUS_ORDER.map((status) => (
                          <option key={status} value={status}>
                            {CHAT_STATUS_LABEL[status]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Prioridade
                      <select
                        value={conversationPriority}
                        disabled={!props.canManage || isClaimedByAnotherAttendant}
                        onChange={(event) =>
                          setConversationPriority(event.target.value as ChatConversationPriority)
                        }
                      >
                        {CHAT_PRIORITY_ORDER.map((priority) => (
                          <option key={priority} value={priority}>
                            {CHAT_PRIORITY_LABEL[priority]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Responsável
                      <select
                        value={assigneeId}
                        disabled={!props.canManage || isClaimedByAnotherAttendant}
                        onChange={(event) => setAssigneeId(event.target.value)}
                      >
                        <option value="">Não atribuído</option>
                        {props.users.map((user) => {
                          const label = user.fullName.trim();
                          if (!label) {
                            return null;
                          }

                          return (
                            <option key={user.id} value={user.id}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </label>

                    <button
                      type="button"
                      className="admin-primary-button"
                      disabled={!props.canManage || isPending || isClaimedByAnotherAttendant}
                      onClick={() => void handleSaveConversation()}
                    >
                      {isPending ? "Salvando..." : "Salvar"}
                    </button>
                  </div>

                  <section className="admin-chat-protocol-grid">
                    <article className="admin-chat-protocol-card">
                      <h4>Protocolo</h4>
                      <p>{selectedProtocol ? protocolStepLabel(selectedProtocol.step) : "-"}</p>
                      <small>
                        Nome: {selectedProtocol?.nameCollected ? "ok" : "pendente"} | Telefone:{" "}
                        {selectedProtocol?.phoneCollected ? "ok" : "pendente"}
                      </small>
                    </article>

                    <article className="admin-chat-protocol-card">
                      <h4>Validação</h4>
                      {matchedLead ? (
                        <p>
                          Lead encontrado: <strong>{matchedLead.name}</strong>
                        </p>
                      ) : (
                        <p>Nenhum lead identificado até agora.</p>
                      )}
                      <small>
                        {matchedLead
                          ? `${matchedLead.status}${matchedLead.company ? ` | ${matchedLead.company}` : ""}`
                          : "Aguardando dados completos do cliente"}
                      </small>
                    </article>

                    <article className="admin-chat-protocol-card">
                      <h4>CRM</h4>
                      {matchedContact ? (
                        <p>
                          Contato: <strong>{matchedContact.fullName}</strong>
                        </p>
                      ) : (
                        <p>Nenhum contato CRM vinculado.</p>
                      )}
                      <small>{matchedContact?.account?.name ?? "Sem conta vinculada"}</small>
                    </article>
                  </section>

                  {recentDeals.length ? (
                    <section className="admin-chat-deals">
                      <h4>Negócios recentes</h4>
                      <div className="admin-chat-deals-list">
                        {recentDeals.map((deal) => (
                          <article key={deal.id} className="admin-chat-deal-card">
                            <strong>{deal.title}</strong>
                            <span>{deal.stage}</span>
                            <small>
                              {toMoneyLabel(deal.valueCents)} | Atualizado {toDateLabel(deal.updatedAt)}
                            </small>
                          </article>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </aside>
              </div>
            </>
          ) : (
            <div className="admin-chat-empty">
              <h3>Nenhuma conversa selecionada</h3>
              <p>Selecione uma conversa na fila para iniciar o atendimento.</p>
            </div>
          )}
        </div>
      </section>

      {feedback ? <p className="admin-feedback success">{feedback}</p> : null}
      {error ? <p className="admin-feedback error">{error}</p> : null}
    </div>
  );
}

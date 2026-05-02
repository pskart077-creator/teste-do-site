"use client";

import { MessageCircle } from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  senderType: "VISITOR" | "ATTENDANT" | "SYSTEM";
  body: string;
  createdAt: string;
  senderAdmin: {
    id: string;
    fullName: string;
  } | null;
};

type ChatConversation = {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  visitorPhone: string | null;
  status:
  | "OPEN"
  | "WAITING_ATTENDANT"
  | "WAITING_VISITOR"
  | "RESOLVED"
  | "ARCHIVED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  assignedTo: {
    id: string;
    fullName: string;
  } | null;
  unreadForVisitor: number;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  protocol: {
    step: "ASK_NAME" | "ASK_PHONE" | "READY";
    nameCollected: boolean;
    phoneCollected: boolean;
    isQualifiedForAttendant: boolean;
  };
};

function toTimeLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function parseApi<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | {
      success?: boolean;
      data?: T;
      error?: {
        message?: string;
      };
    }
    | null;

  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(payload?.error?.message ?? "Falha ao conectar com o atendimento.");
  }

  return payload.data;
}

function getAgentLabel(conversation: ChatConversation | null) {
  return conversation?.assignedTo?.fullName ?? "Equipe Credpagos";
}

function getSystemLabel() {
  return "Central de Atendimento Credpagos";
}

export default function PublicChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || !messagesRef.current) {
      return;
    }

    const node = messagesRef.current;
    node.scrollTop = node.scrollHeight;
  }, [isOpen, messages]);

  const protocolHint =
    conversation?.protocol.step === "ASK_NAME"
      ? "Etapa 1 de 2: informe seu nome completo."
      : conversation?.protocol.step === "ASK_PHONE"
        ? "Etapa 2 de 2: informe seu telefone com DDD."
        : null;

  const inputPlaceholder =
    conversation?.protocol.step === "ASK_NAME"
      ? "Digite seu nome completo..."
      : conversation?.protocol.step === "ASK_PHONE"
        ? "Digite seu telefone com DDD..."
        : "Sua resposta...";

  const ensureSession = useCallback(async () => {
    const locationUrl = new URL(window.location.href);
    const sourcePage = `${locationUrl.pathname}${locationUrl.search}`;

    const data = await parseApi<{
      conversation: ChatConversation;
      messages: ChatMessage[];
    }>(
      await fetch("/api/chat/public/session", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: locationUrl.host,
          sourcePage,
          utm_source: locationUrl.searchParams.get("utm_source"),
          utm_medium: locationUrl.searchParams.get("utm_medium"),
          utm_campaign: locationUrl.searchParams.get("utm_campaign"),
          utm_content: locationUrl.searchParams.get("utm_content"),
          utm_term: locationUrl.searchParams.get("utm_term"),
        }),
      }),
    );

    setConversation(data.conversation);
    setMessages(data.messages);
  }, []);

  const refreshMessages = useCallback(async () => {
    const data = await parseApi<{
      conversation: ChatConversation | null;
      messages: ChatMessage[];
    }>(
      await fetch("/api/chat/public/messages?markRead=1", {
        credentials: "include",
        cache: "no-store",
      }),
    );

    setConversation(data.conversation);
    setMessages(data.messages);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    void ensureSession()
      .then(() => {
        if (active) {
          setIsLoading(false);
        }
      })
      .catch((reason) => {
        if (!active) {
          return;
        }

        setError(reason instanceof Error ? reason.message : "Falha ao abrir atendimento.");
        setIsLoading(false);
      });

    const interval = window.setInterval(() => {
      if (!active) {
        return;
      }

      void refreshMessages().catch(() => undefined);
    }, 3000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [ensureSession, isOpen, refreshMessages]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!messageInput.trim() || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const data = await parseApi<{
        conversation: ChatConversation;
        messages: ChatMessage[];
      }>(
        await fetch("/api/chat/public/messages", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: messageInput,
          }),
        }),
      );

      setConversation(data.conversation);
      setMessages(data.messages);
      setMessageInput("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao enviar mensagem.");
    } finally {
      setIsSending(false);
    }
  }

  const agentLabel = getAgentLabel(conversation);
  const systemLabel = getSystemLabel();

  return (
    <div id="credpago-live-chat" className={isOpen ? "site-chat-widget is-open" : "site-chat-widget"}>
      {isOpen ? (
        <section className="site-chat-panel" aria-label="Atendimento online">
          <header className="site-chat-header">
            <div className="site-chat-agent">
              <div className="site-chat-avatar site-chat-avatar--brand" aria-hidden="true">
                <span className="site-chat-avatar-text">Go</span>
                <span className="site-chat-avatar-dot" />
              </div>

              <div className="site-chat-agent-copy">
                <strong>Equipe Credpagos</strong>
                <small>{conversation?.assignedTo ? "atendente online" : "online agora"}</small>
              </div>
            </div>

            <div className="site-chat-header-actions">
              <button
                type="button"
                className="site-chat-header-button is-ghost"
                aria-label="Mais opcoes"
              >
                <span aria-hidden="true">...</span>
              </button>

              <button
                type="button"
                className="site-chat-header-button"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar chat"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          </header>

          <div className="site-chat-body">
            {isLoading ? <p className="site-chat-state">Carregando atendimento...</p> : null}

            <div ref={messagesRef} className="site-chat-messages" role="log" aria-live="polite">
              {!messages.length ? (
                <p className="site-chat-state">Envie uma mensagem para iniciar o atendimento.</p>
              ) : null}

              {messages.map((item) => {
                const isAttendantSide = item.senderType !== "VISITOR";
                const senderName =
                  item.senderType === "ATTENDANT"
                    ? item.senderAdmin?.fullName ?? agentLabel
                    : item.senderType === "SYSTEM"
                      ? systemLabel
                      : "Você";

                return (
                  <article
                    key={item.id}
                    className={
                      isAttendantSide ? "site-chat-row is-attendant" : "site-chat-row is-visitor"
                    }
                  >
                    {isAttendantSide ? (
                      <div className="site-chat-avatar site-chat-avatar--mini" aria-hidden="true">
                        <span className="site-chat-avatar-text">Go</span>
                      </div>
                    ) : null}

                    <div
                      className={
                        isAttendantSide
                          ? "site-chat-message is-attendant"
                          : "site-chat-message is-visitor"
                      }
                    >
                      <header className="site-chat-message-header">
                        <strong>{senderName}</strong>
                      </header>

                      <p>{item.body}</p>

                      <footer className="site-chat-message-footer">
                        <span>{toTimeLabel(item.createdAt)}</span>
                      </footer>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <form className="site-chat-form" onSubmit={handleSendMessage}>
            {protocolHint ? <p className="site-chat-protocol-hint">{protocolHint}</p> : null}
            <div className="site-chat-input-shell">
              <input
                className="site-chat-input"
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                maxLength={1800}
                placeholder={inputPlaceholder}
                aria-label="Sua resposta"
              />

              <button
                type="submit"
                className="site-chat-send"
                disabled={isSending || !messageInput.trim()}
                aria-label="Enviar mensagem"
              >
                <span aria-hidden="true">&gt;</span>
              </button>
            </div>
          </form>

          {error ? <p className="site-chat-error">{error}</p> : null}
        </section>
      ) : null}

      {!isOpen ? (
        <button
          type="button"
          className="site-chat-toggle"
          onClick={() => setIsOpen((current) => !current)}
          aria-label="Abrir atendimento via chat"
        >
          <MessageCircle size={24} strokeWidth={2.1} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

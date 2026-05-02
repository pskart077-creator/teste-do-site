import type {
  ChatConversationPriority,
  ChatConversationStatus,
  CrmDealStage,
  InternalAdminRoleKey,
  InternalLeadPriority,
  InternalLeadStatus,
} from "@prisma/client";

export const INTERNAL_ADMIN_SESSION_COOKIE = "credpago_internal_admin_session";
export const INTERNAL_ADMIN_CSRF_COOKIE = "credpago_internal_admin_csrf";
export const ANALYTICS_VISITOR_COOKIE = "credpago_anonymous_id";
export const ANALYTICS_SESSION_COOKIE = "credpago_session_id";
export const CHAT_VISITOR_COOKIE = "credpago_chat_visitor";

export const INTERNAL_AUTH_COOKIE_PATH = "/admin-interno";

export const INTERNAL_SESSION_TTL_HOURS = Math.max(
  1,
  Number(process.env.INTERNAL_SESSION_TTL_HOURS ?? "8"),
);

export const INTERNAL_SESSION_IDLE_TIMEOUT_MINUTES = Math.max(
  5,
  Number(process.env.INTERNAL_SESSION_IDLE_TIMEOUT_MINUTES ?? "30"),
);

export const INTERNAL_LOGIN_USER_MAX_ATTEMPTS = Math.max(
  3,
  Number(process.env.INTERNAL_LOGIN_USER_MAX_ATTEMPTS ?? "5"),
);

export const INTERNAL_LOGIN_IP_MAX_ATTEMPTS = Math.max(
  5,
  Number(process.env.INTERNAL_LOGIN_IP_MAX_ATTEMPTS ?? "12"),
);

export const INTERNAL_LOGIN_WINDOW_MINUTES = Math.max(
  5,
  Number(process.env.INTERNAL_LOGIN_WINDOW_MINUTES ?? "15"),
);

export const INTERNAL_LOGIN_LOCK_MINUTES = Math.max(
  5,
  Number(process.env.INTERNAL_LOGIN_LOCK_MINUTES ?? "20"),
);

export const INTERNAL_PASSWORD_POLICY = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSymbol: true,
} as const;

export const INTERNAL_NOTE_MAX_LENGTH = 5_000;

export const INTERNAL_STATUS_LABEL: Record<InternalLeadStatus, string> = {
  NOVO: "Novo",
  EM_ANALISE: "Em análise",
  CONTATADO: "Contatado",
  QUALIFICADO: "Qualificado",
  CONVERTIDO: "Convertido",
  PERDIDO: "Perdido",
  SPAM: "Spam",
};

export const INTERNAL_PRIORITY_LABEL: Record<InternalLeadPriority, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const INTERNAL_ROLE_LABEL: Record<InternalAdminRoleKey, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN: "Admin",
  VISUALIZADOR: "Visualizador",
};

export const CRM_STAGE_LABEL: Record<CrmDealStage, string> = {
  NOVO_CONTATO: "Novo contato",
  DIAGNOSTICO: "Diagnóstico",
  PROPOSTA: "Proposta",
  NEGOCIACAO: "Negociação",
  GANHO: "Ganho",
  PERDIDO: "Perdido",
};

export const CRM_STAGE_ORDER: CrmDealStage[] = [
  "NOVO_CONTATO",
  "DIAGNOSTICO",
  "PROPOSTA",
  "NEGOCIACAO",
  "GANHO",
  "PERDIDO",
];

export const CHAT_STATUS_LABEL: Record<ChatConversationStatus, string> = {
  OPEN: "Aberto",
  WAITING_ATTENDANT: "Aguardando atendente",
  WAITING_VISITOR: "Aguardando cliente",
  RESOLVED: "Resolvido",
  ARCHIVED: "Arquivado",
};

export const CHAT_PRIORITY_LABEL: Record<ChatConversationPriority, string> = {
  LOW: "Baixa",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const CHAT_STATUS_ORDER: ChatConversationStatus[] = [
  "OPEN",
  "WAITING_ATTENDANT",
  "WAITING_VISITOR",
  "RESOLVED",
  "ARCHIVED",
];

export const CHAT_PRIORITY_ORDER: ChatConversationPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
];

export const INTERNAL_DEFAULT_PAGE_SIZE = 20;
export const INTERNAL_MAX_PAGE_SIZE = 100;

export const INTERNAL_NOTIFICATION_MAX_ATTEMPTS = Math.max(
  1,
  Number(process.env.INTERNAL_NOTIFICATION_MAX_ATTEMPTS ?? "5"),
);

export const INTERNAL_NOTIFICATION_RETRY_MINUTES = [1, 5, 15, 60, 180];

export const CHAT_VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;
export const CHAT_PUBLIC_MESSAGE_MAX_LENGTH = 1800;
export const CHAT_ADMIN_MESSAGE_MAX_LENGTH = 2400;
export const CHAT_VISITOR_IDLE_TIMEOUT_MINUTES = Math.max(
  1,
  Number(process.env.CHAT_VISITOR_IDLE_TIMEOUT_MINUTES ?? "10"),
);
export const CHAT_VISITOR_IDLE_TIMEOUT_MS = CHAT_VISITOR_IDLE_TIMEOUT_MINUTES * 60_000;
export const CHAT_PROTOCOL_MIN_PHONE_DIGITS = 10;
export const CHAT_PROTOCOL_MAX_PHONE_DIGITS = 13;
export const CHAT_PROTOCOL_PROMPT_NAME =
  "Para iniciar o atendimento, informe seu nome completo.";
export const CHAT_PROTOCOL_PROMPT_NAME_RETRY =
  "Não consegui validar o nome completo. Informe nome e sobrenome para continuar.";
export const CHAT_PROTOCOL_PROMPT_PHONE =
  "Obrigado. Agora informe o telefone para contato com DDD.";
export const CHAT_PROTOCOL_PROMPT_PHONE_RETRY =
  "Telefone inválido. Informe um número com DDD para prosseguirmos.";
export const CHAT_PROTOCOL_PROMPT_READY =
  "Perfeito, cadastro validado. Um atendente vai seguir com você em instantes.";
export const CHAT_PROTOCOL_PROMPT_IDLE_WARNING_8_MIN =
  "Estamos por aqui. Se desejar continuar, responda esta conversa. Ela será encerrada em 8 minutos por inatividade.";
export const CHAT_PROTOCOL_PROMPT_IDLE_WARNING_5_MIN =
  "Atendimento pausado por falta de resposta. Envie uma mensagem para continuar. Encerramento automático em 5 minutos.";
export const CHAT_PROTOCOL_PROMPT_IDLE_WARNING_2_MIN =
  "Último aviso: faltam 2 minutos para encerramento automático por inatividade. Responda para manter a conversa ativa.";
export const CHAT_PROTOCOL_PROMPT_TIMEOUT =
  "Conversa encerrada por inatividade. Para iniciar novamente, informe nome completo e telefone.";
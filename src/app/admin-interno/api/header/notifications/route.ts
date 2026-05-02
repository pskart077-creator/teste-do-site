import {
  ChatConversationStatus,
  InternalAuditAction,
  InternalNotificationJobStatus,
} from "@prisma/client";
import type { NextRequest } from "next/server";
import { fromUnknownError, ok } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { INTERNAL_STATUS_LABEL } from "@/lib/admin-interno/constants";
import { applyAdminSecurityHeaders } from "@/lib/admin-interno/http";
import { sanitizeText } from "@/lib/admin-interno/sanitize";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HeaderNotificationItem = {
  id: string;
  type: "lead" | "chat" | "security";
  title: string;
  description: string;
  href: string;
  createdAt: string;
};

function getSecurityActionCopy(action: InternalAuditAction) {
  switch (action) {
    case InternalAuditAction.LOGIN_FAILED:
      return {
        title: "Falha de login administrativo",
        href: "/admin-interno/auditoria",
      };
    case InternalAuditAction.SECURITY_LOCKOUT:
      return {
        title: "Bloqueio de segurança aplicado",
        href: "/admin-interno/auditoria",
      };
    case InternalAuditAction.NOTIFICATION_FAILED:
      return {
        title: "Falha no envio de alerta por e-mail",
        href: "/admin-interno/configuracoes",
      };
    default:
      return {
        title: "Evento de segurança registrado",
        href: "/admin-interno/auditoria",
      };
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireInternalApiSession(request, {
      permission: "dashboard:view",
    });

    const now = Date.now();
    const since24h = new Date(now - 24 * 60 * 60 * 1000);
    const since72h = new Date(now - 72 * 60 * 60 * 1000);

    const [
      unreadChats,
      newLeads24h,
      pendingNotificationJobs,
      failedNotificationJobs,
      latestLeads,
      latestUnreadChats,
      latestSecurityEvents,
    ] = await Promise.all([
      prisma.chatConversation.count({
        where: {
          deletedAt: null,
          unreadForAdmin: {
            gt: 0,
          },
          status: {
            in: [
              ChatConversationStatus.OPEN,
              ChatConversationStatus.WAITING_ATTENDANT,
              ChatConversationStatus.WAITING_VISITOR,
            ],
          },
        },
      }),
      prisma.lead.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: since24h,
          },
        },
      }),
      prisma.notificationJob.count({
        where: {
          status: {
            in: [InternalNotificationJobStatus.PENDING, InternalNotificationJobStatus.FAILED],
          },
        },
      }),
      prisma.notificationJob.count({
        where: {
          status: InternalNotificationJobStatus.DEAD,
        },
      }),
      prisma.lead.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.chatConversation.findMany({
        where: {
          deletedAt: null,
          unreadForAdmin: {
            gt: 0,
          },
        },
        orderBy: [{ unreadForAdmin: "desc" }, { lastMessageAt: "desc" }, { updatedAt: "desc" }],
        take: 5,
        select: {
          id: true,
          visitorName: true,
          unreadForAdmin: true,
          lastMessageAt: true,
          updatedAt: true,
        },
      }),
      prisma.auditLog.findMany({
        where: {
          action: {
            in: [
              InternalAuditAction.LOGIN_FAILED,
              InternalAuditAction.SECURITY_LOCKOUT,
              InternalAuditAction.NOTIFICATION_FAILED,
            ],
          },
          createdAt: {
            gte: since72h,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        select: {
          id: true,
          action: true,
          createdAt: true,
          actor: {
            select: {
              fullName: true,
            },
          },
        },
      }),
    ]);

    const leadItems: HeaderNotificationItem[] = latestLeads.map((lead) => ({
      id: `lead-${lead.id}`,
      type: "lead",
      title: `Novo lead: ${sanitizeText(lead.name, 90) || "Lead sem nome"}`,
      description: `Status atual: ${INTERNAL_STATUS_LABEL[lead.status]}`,
      href: `/admin-interno/leads/${lead.id}`,
      createdAt: lead.createdAt.toISOString(),
    }));

    const chatItems: HeaderNotificationItem[] = latestUnreadChats.map((conversation) => ({
      id: `chat-${conversation.id}`,
      type: "chat",
      title: `Chat pendente: ${sanitizeText(conversation.visitorName, 80) || "Visitante"}`,
      description: `${conversation.unreadForAdmin} mensagem(ns) não lida(s)`,
      href: "/admin-interno/chat",
      createdAt: (conversation.lastMessageAt ?? conversation.updatedAt).toISOString(),
    }));

    const securityItems: HeaderNotificationItem[] = latestSecurityEvents.map((event) => {
      const copy = getSecurityActionCopy(event.action);
      const actorName = sanitizeText(event.actor?.fullName, 80);
      const description = actorName
        ? `Acao registrada por ${actorName}`
        : "Acao registrada pelo sistema";

      return {
        id: `security-${event.id}`,
        type: "security",
        title: copy.title,
        description,
        href: copy.href,
        createdAt: event.createdAt.toISOString(),
      };
    });

    const items = [...leadItems, ...chatItems, ...securityItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    const unreadTotal = unreadChats + newLeads24h + pendingNotificationJobs + failedNotificationJobs;

    const response = ok({
      generatedAt: new Date().toISOString(),
      counters: {
        unreadChats,
        newLeads24h,
        pendingNotificationJobs,
        failedNotificationJobs,
        unreadTotal,
      },
      items,
    });

    return applyAdminSecurityHeaders(response);
  } catch (error) {
    const response = fromUnknownError(error);
    return applyAdminSecurityHeaders(response);
  }
}

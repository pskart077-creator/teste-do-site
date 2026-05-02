import {
  CrmActivityType,
  CrmDealStage,
  CrmTaskStatus,
  Prisma,
} from "@prisma/client";
import { InternalApiError } from "@/lib/admin-interno/api";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import { getLeadEmailValueOrNull } from "@/lib/admin-interno/lead-email";
import { sanitizeEmail, sanitizeLongText, sanitizeText } from "@/lib/admin-interno/sanitize";
import { prisma } from "@/lib/db/prisma";

type ListCrmDealsFilters = {
  stage?: CrmDealStage;
  ownerId?: string;
  q?: string;
  limit?: number;
};

function parseDate(value: string | null | undefined) {
  const normalized = sanitizeText(value, 40);
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

async function assertUserExists(tx: Prisma.TransactionClient, userId: string) {
  const user = await tx.internalAdminUser.findFirst({
    where: {
      id: userId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new InternalApiError(404, "USER_NOT_FOUND", "Usuário responsável não encontrado.");
  }
}

async function findOrCreateAccountByName(
  tx: Prisma.TransactionClient,
  accountName: string,
  ownerId?: string | null,
) {
  const normalized = sanitizeText(accountName, 180);
  if (!normalized) {
    return null;
  }

  const existing = await tx.crmAccount.findFirst({
    where: {
      deletedAt: null,
      name: {
        equals: normalized,
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    return existing;
  }

  return tx.crmAccount.create({
    data: {
      name: normalized,
      ownerId: ownerId ?? null,
    },
  });
}

async function ensureLeadContact(
  tx: Prisma.TransactionClient,
  leadId: string,
  ownerId?: string | null,
) {
  const lead = await tx.lead.findFirst({
    where: {
      id: leadId,
      deletedAt: null,
    },
  });

  if (!lead) {
    throw new InternalApiError(404, "LEAD_NOT_FOUND", "Lead informado não foi encontrado.");
  }

  const existingContact = await tx.crmContact.findUnique({
    where: {
      leadId: lead.id,
    },
  });

  if (existingContact) {
    return {
      lead,
      contact: existingContact,
    };
  }

  let accountId: string | null = null;
  if (lead.company) {
    const account = await findOrCreateAccountByName(tx, lead.company, ownerId);
    accountId = account?.id ?? null;
  }

  const contact = await tx.crmContact.create({
    data: {
      leadId: lead.id,
      accountId,
      fullName: sanitizeText(lead.name, 160),
      email: getLeadEmailValueOrNull(sanitizeEmail(lead.email)),
      phone: sanitizeText(lead.phone, 32) || null,
      isPrimary: true,
    },
  });

  return {
    lead,
    contact,
  };
}

export async function listCrmDeals(filters: ListCrmDealsFilters) {
  const limit = Math.min(200, Math.max(10, filters.limit ?? 120));

  const where: Prisma.CrmDealWhereInput = {
    deletedAt: null,
    ...(filters.stage ? { stage: filters.stage } : {}),
    ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
  };

  const queryTerm = sanitizeText(filters.q, 120);
  if (queryTerm) {
    where.OR = [
      {
        title: {
          contains: queryTerm,
          mode: "insensitive",
        },
      },
      {
        account: {
          name: {
            contains: queryTerm,
            mode: "insensitive",
          },
        },
      },
      {
        contact: {
          fullName: {
            contains: queryTerm,
            mode: "insensitive",
          },
        },
      },
      {
        lead: {
          name: {
            contains: queryTerm,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  const [deals, stageGroups, openAggregate, wonAggregate] = await Promise.all([
    prisma.crmDeal.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
          },
        },
        contact: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        activities: {
          include: {
            actor: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
        tasks: {
          orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
          take: 8,
          include: {
            assignee: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: [{ stage: "asc" }, { updatedAt: "desc" }],
      take: limit,
    }),
    prisma.crmDeal.groupBy({
      by: ["stage"],
      where,
      _count: {
        _all: true,
      },
      _sum: {
        valueCents: true,
      },
    }),
    prisma.crmDeal.aggregate({
      where: {
        ...where,
        stage: {
          in: [
            CrmDealStage.NOVO_CONTATO,
            CrmDealStage.DIAGNOSTICO,
            CrmDealStage.PROPOSTA,
            CrmDealStage.NEGOCIACAO,
          ],
        },
      },
      _sum: {
        valueCents: true,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.crmDeal.aggregate({
      where: {
        ...where,
        stage: CrmDealStage.GANHO,
      },
      _sum: {
        valueCents: true,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const byStage = stageGroups
    .map((stage) => ({
      stage: stage.stage,
      count: stage._count._all,
      valueCents: stage._sum.valueCents ?? 0,
    }))
    .sort((a, b) => a.stage.localeCompare(b.stage));

  return {
    deals,
    byStage,
    metrics: {
      totalDeals: deals.length,
      openDeals: openAggregate._count._all,
      wonDeals: wonAggregate._count._all,
      openValueCents: openAggregate._sum.valueCents ?? 0,
      wonValueCents: wonAggregate._sum.valueCents ?? 0,
    },
  };
}

export async function createCrmDeal(
  actorId: string,
  input: {
    title: string;
    stage?: CrmDealStage;
    valueCents?: number | null;
    currency?: string | null;
    probability?: number | null;
    expectedCloseAt?: string | null;
    source?: string | null;
    notes?: string | null;
    ownerId?: string | null;
    leadId?: string | null;
    accountId?: string | null;
    accountName?: string | null;
    contactId?: string | null;
  },
) {
  const stage = input.stage ?? CrmDealStage.NOVO_CONTATO;

  const created = await prisma.$transaction(async (tx) => {
    if (input.ownerId) {
      await assertUserExists(tx, input.ownerId);
    }

    let leadId = sanitizeText(input.leadId, 120) || null;
    let accountId = sanitizeText(input.accountId, 120) || null;
    let contactId = sanitizeText(input.contactId, 120) || null;

    if (leadId) {
      const ensured = await ensureLeadContact(tx, leadId, input.ownerId);
      contactId = contactId ?? ensured.contact.id;
      accountId = accountId ?? ensured.contact.accountId;
    }

    if (!accountId && input.accountName) {
      const account = await findOrCreateAccountByName(
        tx,
        input.accountName,
        input.ownerId,
      );
      accountId = account?.id ?? null;
    }

    if (accountId) {
      const account = await tx.crmAccount.findFirst({
        where: {
          id: accountId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!account) {
        throw new InternalApiError(404, "ACCOUNT_NOT_FOUND", "Conta CRM não encontrada.");
      }
    }

    if (contactId) {
      const contact = await tx.crmContact.findFirst({
        where: {
          id: contactId,
          deletedAt: null,
        },
        select: {
          id: true,
          accountId: true,
        },
      });

      if (!contact) {
        throw new InternalApiError(404, "CONTACT_NOT_FOUND", "Contato CRM não encontrado.");
      }

      if (!accountId && contact.accountId) {
        accountId = contact.accountId;
      }
    }

    const expectedCloseAt = parseDate(input.expectedCloseAt);

    const deal = await tx.crmDeal.create({
      data: {
        title: sanitizeText(input.title, 180),
        stage,
        valueCents:
          typeof input.valueCents === "number" && Number.isFinite(input.valueCents)
            ? Math.max(0, Math.floor(input.valueCents))
            : null,
        currency: sanitizeText(input.currency, 8) || "BRL",
        probability:
          typeof input.probability === "number" && Number.isFinite(input.probability)
            ? Math.min(100, Math.max(0, Math.floor(input.probability)))
            : 0,
        expectedCloseAt,
        source: sanitizeText(input.source, 120) || null,
        notes: sanitizeLongText(input.notes, 5000) || null,
        ownerId: input.ownerId || null,
        leadId,
        accountId,
        contactId,
      },
    });

    await tx.crmActivity.create({
      data: {
        dealId: deal.id,
        actorId,
        type: CrmActivityType.SYSTEM,
        description: `Negócio criado em ${stage}.`,
        metadata: {
          stage,
        },
      },
    });

    return tx.crmDeal.findUnique({
      where: {
        id: deal.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
          },
        },
        contact: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        activities: {
          include: {
            actor: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
          take: 8,
        },
      },
    });
  });

  if (!created) {
    throw new InternalApiError(500, "CRM_CREATE_FAILED", "Falha ao criar negócio.");
  }

  await writeAuditLog({
    actorId,
    action: "CRM_DEAL_CREATED",
    entityType: "crm_deal",
    entityId: created.id,
    context: {
      stage: created.stage,
      ownerId: created.ownerId,
      leadId: created.leadId,
    },
  });

  return created;
}

export async function updateCrmDeal(
  actorId: string,
  dealId: string,
  input: {
    title?: string;
    stage?: CrmDealStage;
    valueCents?: number | null;
    currency?: string | null;
    probability?: number | null;
    expectedCloseAt?: string | null;
    source?: string | null;
    notes?: string | null;
    ownerId?: string | null;
    accountId?: string | null;
    contactId?: string | null;
  },
) {
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.crmDeal.findFirst({
      where: {
        id: dealId,
        deletedAt: null,
      },
    });

    if (!current) {
      throw new InternalApiError(404, "DEAL_NOT_FOUND", "Negócio não encontrado.");
    }

    if (input.ownerId) {
      await assertUserExists(tx, input.ownerId);
    }

    if (input.accountId) {
      const account = await tx.crmAccount.findFirst({
        where: {
          id: input.accountId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });
      if (!account) {
        throw new InternalApiError(404, "ACCOUNT_NOT_FOUND", "Conta CRM não encontrada.");
      }
    }

    if (input.contactId) {
      const contact = await tx.crmContact.findFirst({
        where: {
          id: input.contactId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });
      if (!contact) {
        throw new InternalApiError(404, "CONTACT_NOT_FOUND", "Contato CRM não encontrado.");
      }
    }

    const expectedCloseAt =
      typeof input.expectedCloseAt === "string"
        ? parseDate(input.expectedCloseAt)
        : undefined;

    const next = await tx.crmDeal.update({
      where: {
        id: current.id,
      },
      data: {
        title: input.title ? sanitizeText(input.title, 180) : undefined,
        stage: input.stage,
        valueCents:
          typeof input.valueCents === "number" && Number.isFinite(input.valueCents)
            ? Math.max(0, Math.floor(input.valueCents))
            : input.valueCents === null
              ? null
              : undefined,
        currency:
          typeof input.currency === "string" ? sanitizeText(input.currency, 8) || "BRL" : undefined,
        probability:
          typeof input.probability === "number" && Number.isFinite(input.probability)
            ? Math.min(100, Math.max(0, Math.floor(input.probability)))
            : undefined,
        expectedCloseAt,
        source:
          typeof input.source === "string" ? sanitizeText(input.source, 120) || null : undefined,
        notes:
          typeof input.notes === "string"
            ? sanitizeLongText(input.notes, 5000) || null
            : undefined,
        ownerId:
          Object.prototype.hasOwnProperty.call(input, "ownerId")
            ? input.ownerId || null
            : undefined,
        accountId:
          Object.prototype.hasOwnProperty.call(input, "accountId")
            ? input.accountId || null
            : undefined,
        contactId:
          Object.prototype.hasOwnProperty.call(input, "contactId")
            ? input.contactId || null
            : undefined,
      },
    });

    if (input.stage && input.stage !== current.stage) {
      await tx.crmActivity.create({
        data: {
          dealId: current.id,
          actorId,
          type: CrmActivityType.STATUS_CHANGE,
          description: `Etapa alterada de ${current.stage} para ${input.stage}.`,
          metadata: {
            from: current.stage,
            to: input.stage,
          },
        },
      });
    }

    return {
      next,
      previousStage: current.stage,
      stageChanged: Boolean(input.stage && input.stage !== current.stage),
    };
  });

  await writeAuditLog({
    actorId,
    action: updated.stageChanged ? "CRM_DEAL_STAGE_CHANGED" : "CRM_DEAL_UPDATED",
    entityType: "crm_deal",
    entityId: dealId,
    context: {
      previousStage: updated.previousStage,
      nextStage: updated.next.stage,
    },
  });

  return prisma.crmDeal.findUnique({
    where: {
      id: dealId,
    },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      lead: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
      },
      account: {
        select: {
          id: true,
          name: true,
        },
      },
      contact: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      activities: {
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
      tasks: {
        include: {
          assignee: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
        take: 8,
      },
    },
  });
}

export async function addCrmActivity(
  actorId: string,
  dealId: string,
  input: {
    type?: CrmActivityType;
    description: string;
    metadata?: Record<string, unknown> | null;
  },
) {
  const deal = await prisma.crmDeal.findFirst({
    where: {
      id: dealId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!deal) {
    throw new InternalApiError(404, "DEAL_NOT_FOUND", "Negócio não encontrado.");
  }

  const activity = await prisma.crmActivity.create({
    data: {
      dealId,
      actorId,
      type: input.type ?? CrmActivityType.NOTE,
      description: sanitizeLongText(input.description, 2_000),
      metadata: input.metadata
        ? (input.metadata as Prisma.InputJsonValue)
        : undefined,
    },
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  await writeAuditLog({
    actorId,
    action: "CRM_ACTIVITY_ADDED",
    entityType: "crm_deal",
    entityId: dealId,
    context: {
      activityId: activity.id,
      type: activity.type,
    },
  });

  return activity;
}

export async function addCrmTask(
  actorId: string,
  dealId: string,
  input: {
    title: string;
    description?: string | null;
    dueAt?: string | null;
    assigneeId?: string | null;
    status?: CrmTaskStatus;
  },
) {
  const task = await prisma.$transaction(async (tx) => {
    const deal = await tx.crmDeal.findFirst({
      where: {
        id: dealId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!deal) {
      throw new InternalApiError(404, "DEAL_NOT_FOUND", "Negócio não encontrado.");
    }

    if (input.assigneeId) {
      await assertUserExists(tx, input.assigneeId);
    }

    const status = input.status ?? CrmTaskStatus.OPEN;
    const dueAt = parseDate(input.dueAt);

    return tx.crmTask.create({
      data: {
        dealId,
        assigneeId: input.assigneeId || null,
        title: sanitizeText(input.title, 180),
        description: sanitizeLongText(input.description, 1200) || null,
        dueAt,
        status,
        completedAt: status === CrmTaskStatus.DONE ? new Date() : null,
      },
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  });

  await writeAuditLog({
    actorId,
    action: "CRM_TASK_CREATED",
    entityType: "crm_task",
    entityId: task.id,
    context: {
      dealId,
      status: task.status,
    },
  });

  return task;
}

export async function updateCrmTask(
  actorId: string,
  dealId: string,
  taskId: string,
  input: {
    title?: string;
    description?: string | null;
    dueAt?: string | null;
    assigneeId?: string | null;
    status?: CrmTaskStatus;
  },
) {
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.crmTask.findUnique({
      where: {
        id: taskId,
      },
      include: {
        deal: {
          select: {
            id: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!current || current.deal.deletedAt) {
      throw new InternalApiError(404, "TASK_NOT_FOUND", "Tarefa CRM não encontrada.");
    }

    if (current.deal.id !== dealId) {
      throw new InternalApiError(404, "TASK_NOT_FOUND", "Tarefa CRM não encontrada.");
    }

    if (input.assigneeId) {
      await assertUserExists(tx, input.assigneeId);
    }

    const nextStatus = input.status ?? current.status;
    const dueAt =
      typeof input.dueAt === "string" ? parseDate(input.dueAt) : undefined;

    return tx.crmTask.update({
      where: {
        id: current.id,
      },
      data: {
        title: input.title ? sanitizeText(input.title, 180) : undefined,
        description:
          typeof input.description === "string"
            ? sanitizeLongText(input.description, 1200) || null
            : undefined,
        dueAt,
        assigneeId:
          Object.prototype.hasOwnProperty.call(input, "assigneeId")
            ? input.assigneeId || null
            : undefined,
        status: input.status,
        completedAt:
          nextStatus === CrmTaskStatus.DONE
            ? current.completedAt ?? new Date()
            : null,
      },
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  });

  await writeAuditLog({
    actorId,
    action: "CRM_TASK_UPDATED",
    entityType: "crm_task",
    entityId: updated.id,
    context: {
      status: updated.status,
    },
  });

  return updated;
}

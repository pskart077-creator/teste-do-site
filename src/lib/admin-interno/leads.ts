import {
  InternalLeadHistoryAction,
  InternalLeadPriority,
  InternalLeadStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import {
  INTERNAL_DEFAULT_PAGE_SIZE,
  INTERNAL_MAX_PAGE_SIZE,
  INTERNAL_NOTE_MAX_LENGTH,
} from "@/lib/admin-interno/constants";
import {
  sanitizeEmail,
  sanitizeLongText,
  sanitizePath,
  sanitizePhone,
  sanitizeSlug,
  sanitizeText,
} from "@/lib/admin-interno/sanitize";
import {
  buildPendingLeadEmail,
  getLeadEmailValueOrNull,
  isPendingLeadEmail,
} from "@/lib/admin-interno/lead-email";

type LeadFilters = {
  page?: number;
  pageSize?: number;
  status?: InternalLeadStatus;
  source?: string;
  assigneeId?: string;
  from?: string;
  to?: string;
  q?: string;
};

type LeadKanbanFilters = Omit<LeadFilters, "page" | "pageSize"> & {
  limit?: number;
};

function asDate(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildLeadWhere(filters: LeadFilters): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {
    deletedAt: null,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.source) {
    where.source = sanitizeText(filters.source, 120);
  }

  if (filters.assigneeId) {
    where.assigneeId = filters.assigneeId;
  }

  const fromDate = asDate(filters.from);
  const toDate = asDate(filters.to);

  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {}),
    };
  }

  if (filters.q) {
    const term = sanitizeText(filters.q, 120);
    if (term) {
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
        { company: { contains: term, mode: "insensitive" } },
      ];
    }
  }

  return where;
}

export async function listLeads(filters: LeadFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(
    INTERNAL_MAX_PAGE_SIZE,
    Math.max(1, filters.pageSize ?? INTERNAL_DEFAULT_PAGE_SIZE),
  );

  const where = buildLeadWhere(filters);

  const [total, leads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    }),
  ]);

  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    leads,
  };
}

export async function listLeadsForKanban(filters: LeadKanbanFilters) {
  const limit = Math.min(500, Math.max(50, filters.limit ?? 300));
  const where = buildLeadWhere(filters);

  const leads = await prisma.lead.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      assignee: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return {
    limit,
    leads,
  };
}

export async function getLeadById(leadId: string) {
  return prisma.lead.findFirst({
    where: {
      id: leadId,
      deletedAt: null,
    },
    include: {
      assignee: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      notes: {
        where: {
          deletedAt: null,
        },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      history: {
        include: {
          changedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      notifications: {
        include: {
          recipient: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

async function upsertTagIds(tx: Prisma.TransactionClient, rawTags: string[]) {
  if (!rawTags.length) {
    return [] as string[];
  }

  const uniqueBySlug = new Map<string, { name: string; slug: string }>();
  for (const rawTag of rawTags) {
    const name = sanitizeText(rawTag, 50);
    const slug = sanitizeSlug(name);
    if (!name || !slug) {
      continue;
    }

    if (!uniqueBySlug.has(slug)) {
      uniqueBySlug.set(slug, { name, slug });
    }
  }

  const uniqueTags = Array.from(uniqueBySlug.values());

  const tagIds: string[] = [];

  for (const tag of uniqueTags) {
    const existing = await tx.leadTag.findFirst({
      where: {
        OR: [{ slug: tag.slug }, { name: tag.name }],
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      tagIds.push(existing.id);
      continue;
    }

    const created = await tx.leadTag.create({
      data: {
        name: tag.name,
        slug: tag.slug,
      },
      select: {
        id: true,
      },
    });
    tagIds.push(created.id);
  }

  return tagIds;
}

export async function createLeadFromPublicInput(input: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  sourcePage?: string;
  campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  message?: string;
  tags?: string[];
  ipMasked?: string;
  userAgent?: string;
  captureStage?: "partial" | "complete";
  existingLeadId?: string;
}) {
  const captureStage = input.captureStage === "partial" ? "partial" : "complete";
  const sanitizedName = sanitizeText(input.name, 120);
  const sanitizedPhone = sanitizePhone(input.phone) || null;
  const sanitizedEmail = getLeadEmailValueOrNull(input.email);
  const resolvedEmail =
    sanitizedEmail || buildPendingLeadEmail(sanitizedPhone);
  const sanitizedTags = Array.from(
    new Set(
      [
        ...(input.tags ?? []),
        ...(captureStage === "partial" ? ["captura-inicial"] : []),
      ].filter(Boolean),
    ),
  );

  const result = await prisma.$transaction(async (tx) => {
    const existingLead =
      input.existingLeadId && captureStage
        ? await tx.lead.findFirst({
            where: {
              id: sanitizeText(input.existingLeadId, 120),
              deletedAt: null,
            },
          })
        : null;

    const canUpdateExisting =
      !!existingLead && isPendingLeadEmail(existingLead.email);

    const leadData = {
      name: sanitizedName,
      email: captureStage === "partial" && canUpdateExisting ? existingLead!.email : resolvedEmail,
      phone: sanitizedPhone,
      company: sanitizeText(input.company, 160) || null,
      source: sanitizeText(input.source, 120) || null,
      sourcePage: sanitizePath(input.sourcePage) || null,
      campaign: sanitizeText(input.campaign, 120) || null,
      utmSource: sanitizeText(input.utm_source, 120) || null,
      utmMedium: sanitizeText(input.utm_medium, 120) || null,
      utmCampaign: sanitizeText(input.utm_campaign, 120) || null,
      utmContent: sanitizeText(input.utm_content, 120) || null,
      utmTerm: sanitizeText(input.utm_term, 120) || null,
      message: sanitizeLongText(input.message, INTERNAL_NOTE_MAX_LENGTH) || null,
      status: InternalLeadStatus.NOVO,
      priority: InternalLeadPriority.MEDIA,
      ipMasked: sanitizeText(input.ipMasked, 80) || null,
      userAgent: sanitizeText(input.userAgent, 500) || null,
    } satisfies Prisma.LeadUncheckedCreateInput;

    let lead: Awaited<ReturnType<typeof tx.lead.create>>;
    let operation: "created" | "updated" = "created";

    if (canUpdateExisting) {
      lead = await tx.lead.update({
        where: {
          id: existingLead!.id,
        },
        data: leadData,
      });
      operation = "updated";
    } else {
      lead = await tx.lead.create({
        data: leadData,
      });
    }

    if (sanitizedTags.length) {
      const tagIds = await upsertTagIds(tx, sanitizedTags);
      if (tagIds.length) {
        await tx.leadTagRelation.createMany({
          data: tagIds.map((tagId) => ({
            leadId: lead.id,
            tagId,
          })),
          skipDuplicates: true,
        });
      }
    }

    await tx.leadStatusHistory.create({
      data: {
        leadId: lead.id,
        action:
          operation === "created"
            ? InternalLeadHistoryAction.CREATED
            : InternalLeadHistoryAction.UPDATED,
        toStatus: InternalLeadStatus.NOVO,
        toPriority: InternalLeadPriority.MEDIA,
        note:
          captureStage === "partial"
            ? "Captura inicial registrada na etapa 1 do formulário público."
            : operation === "updated"
              ? "Lead concluído a partir de uma captura inicial do formulário público."
              : "Lead recebido via endpoint público.",
      },
    });

    return {
      lead,
      operation,
    };
  });

  await writeAuditLog({
    actorId: null,
    action: "LEAD_RECEIVED",
    entityType: "lead",
    entityId: result.lead.id,
    ipMasked: sanitizeText(input.ipMasked, 80),
    userAgent: sanitizeText(input.userAgent, 500),
    context: {
      source: sanitizeText(input.source, 120),
      sourcePage: sanitizePath(input.sourcePage),
      captureStage,
      operation: result.operation,
    },
  });

  return {
    ...result,
    captureStage,
  };
}

export async function updateLead(
  leadId: string,
  actorId: string,
  changes: {
    status?: InternalLeadStatus;
    priority?: InternalLeadPriority;
    assigneeId?: string | null;
    tags?: string[];
  },
) {
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.lead.findFirst({
      where: {
        id: leadId,
        deletedAt: null,
      },
      include: {
        tags: true,
      },
    });

    if (!current) {
      throw new Error("LEAD_NOT_FOUND");
    }

    const data: Prisma.LeadUpdateInput = {};
    const historyEntries: Prisma.LeadStatusHistoryCreateManyInput[] = [];

    if (changes.status && changes.status !== current.status) {
      data.status = changes.status;
      historyEntries.push({
        leadId,
        action: InternalLeadHistoryAction.STATUS_CHANGED,
        changedById: actorId,
        fromStatus: current.status,
        toStatus: changes.status,
      });
    }

    if (changes.priority && changes.priority !== current.priority) {
      data.priority = changes.priority;
      historyEntries.push({
        leadId,
        action: InternalLeadHistoryAction.PRIORITY_CHANGED,
        changedById: actorId,
        fromPriority: current.priority,
        toPriority: changes.priority,
      });
    }

    if (Object.prototype.hasOwnProperty.call(changes, "assigneeId")) {
      const normalizedAssigneeId = changes.assigneeId || null;
      if (normalizedAssigneeId !== current.assigneeId) {
        data.assignee = normalizedAssigneeId
          ? {
              connect: {
                id: normalizedAssigneeId,
              },
            }
          : {
              disconnect: true,
            };

        historyEntries.push({
          leadId,
          action: InternalLeadHistoryAction.ASSIGNEE_CHANGED,
          changedById: actorId,
          fromAssigneeId: current.assigneeId,
          toAssigneeId: normalizedAssigneeId,
        });
      }
    }

    let tagsChanged = false;
    if (changes.tags) {
      const nextTagIds = await upsertTagIds(tx, changes.tags);
      const currentTagIds = new Set(current.tags.map((tag) => tag.tagId));
      const nextTagIdSet = new Set(nextTagIds);

      const toDelete = current.tags
        .filter((tag) => !nextTagIdSet.has(tag.tagId))
        .map((tag) => tag.tagId);
      const toCreate = nextTagIds.filter((tagId) => !currentTagIds.has(tagId));

      if (toDelete.length) {
        await tx.leadTagRelation.deleteMany({
          where: {
            leadId,
            tagId: {
              in: toDelete,
            },
          },
        });
      }

      if (toCreate.length) {
        await tx.leadTagRelation.createMany({
          data: toCreate.map((tagId) => ({
            leadId,
            tagId,
          })),
          skipDuplicates: true,
        });
      }

      tagsChanged = toDelete.length > 0 || toCreate.length > 0;
      if (tagsChanged) {
        historyEntries.push({
          leadId,
          action: InternalLeadHistoryAction.TAGS_UPDATED,
          changedById: actorId,
        });
      }
    }

    if (Object.keys(data).length) {
      await tx.lead.update({
        where: {
          id: leadId,
        },
        data,
      });
    }

    if (historyEntries.length) {
      await tx.leadStatusHistory.createMany({
        data: historyEntries,
      });
    }

    return {
      changedStatus: !!historyEntries.find((entry) => entry.action === InternalLeadHistoryAction.STATUS_CHANGED),
      changedPriority: !!historyEntries.find(
        (entry) => entry.action === InternalLeadHistoryAction.PRIORITY_CHANGED,
      ),
      changedAssignee: !!historyEntries.find(
        (entry) => entry.action === InternalLeadHistoryAction.ASSIGNEE_CHANGED,
      ),
      changedTags: tagsChanged,
    };
  });

  if (updated.changedStatus) {
    await writeAuditLog({
      actorId,
      action: "LEAD_STATUS_CHANGED",
      entityType: "lead",
      entityId: leadId,
    });
  }

  if (updated.changedPriority) {
    await writeAuditLog({
      actorId,
      action: "LEAD_PRIORITY_CHANGED",
      entityType: "lead",
      entityId: leadId,
    });
  }

  if (updated.changedAssignee) {
    await writeAuditLog({
      actorId,
      action: "LEAD_ASSIGNED",
      entityType: "lead",
      entityId: leadId,
    });
  }

  if (updated.changedTags) {
    await writeAuditLog({
      actorId,
      action: "LEAD_TAGS_UPDATED",
      entityType: "lead",
      entityId: leadId,
    });
  }

  return getLeadById(leadId);
}

export async function addLeadNote(leadId: string, actorId: string, note: string) {
  const sanitizedNote = sanitizeLongText(note, INTERNAL_NOTE_MAX_LENGTH);

  const created = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findFirst({
      where: {
        id: leadId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!lead) {
      throw new Error("LEAD_NOT_FOUND");
    }

    const newNote = await tx.leadNote.create({
      data: {
        leadId,
        authorId: actorId,
        note: sanitizedNote,
      },
    });

    await tx.leadStatusHistory.create({
      data: {
        leadId,
        action: InternalLeadHistoryAction.NOTE_ADDED,
        changedById: actorId,
        note: sanitizedNote.slice(0, 200),
      },
    });

    return newNote;
  });

  await writeAuditLog({
    actorId,
    action: "LEAD_NOTE_ADDED",
    entityType: "lead",
    entityId: leadId,
  });

  return created;
}

export async function getDashboardMetrics() {
  const [
    totalLeads,
    newLeads,
    qualifiedLeads,
    convertedLeads,
    recentLeads,
    byStatus,
  ] = await Promise.all([
    prisma.lead.count({ where: { deletedAt: null } }),
    prisma.lead.count({ where: { deletedAt: null, status: InternalLeadStatus.NOVO } }),
    prisma.lead.count({ where: { deletedAt: null, status: InternalLeadStatus.QUALIFICADO } }),
    prisma.lead.count({ where: { deletedAt: null, status: InternalLeadStatus.CONVERTIDO } }),
    prisma.lead.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        assignee: {
          select: {
            fullName: true,
          },
        },
      },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  return {
    totalLeads,
    newLeads,
    qualifiedLeads,
    convertedLeads,
    recentLeads,
    byStatus,
  };
}

const DASHBOARD_STATUS_ORDER: InternalLeadStatus[] = [
  InternalLeadStatus.NOVO,
  InternalLeadStatus.EM_ANALISE,
  InternalLeadStatus.CONTATADO,
  InternalLeadStatus.QUALIFICADO,
  InternalLeadStatus.CONVERTIDO,
  InternalLeadStatus.PERDIDO,
  InternalLeadStatus.SPAM,
];

const DASHBOARD_PRIORITY_ORDER: InternalLeadPriority[] = [
  InternalLeadPriority.BAIXA,
  InternalLeadPriority.MEDIA,
  InternalLeadPriority.ALTA,
  InternalLeadPriority.URGENTE,
];

function startOfDay(value: Date) {
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toPercentShare(count: number, total: number) {
  if (!total) {
    return 0;
  }

  return Number(((count / total) * 100).toFixed(1));
}

function toPercentChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function normalizeTrafficLabel(value: string | null) {
  const normalized = value?.trim();
  if (!normalized) {
    return "Sem origem";
  }

  return normalized;
}

function normalizeCampaignLabel(source: string | null, campaign: string | null) {
  const safeSource = source?.trim() || "origem direta";
  const safeCampaign = campaign?.trim() || "campanha n/d";
  return `${safeSource} / ${safeCampaign}`;
}

export async function getDashboardOverview(days = 30) {
  const numericDays = Number.isFinite(days) ? days : 30;
  const safeDays = Math.max(7, Math.min(180, Math.floor(numericDays)));

  const now = new Date();
  const rangeStart = startOfDay(addDays(now, -(safeDays - 1)));
  const previousRangeEnd = new Date(rangeStart.getTime() - 1);
  const previousRangeStart = startOfDay(addDays(rangeStart, -safeDays));

  const currentWhere: Prisma.LeadWhereInput = {
    deletedAt: null,
    createdAt: {
      gte: rangeStart,
      lte: now,
    },
  };

  const previousWhere: Prisma.LeadWhereInput = {
    deletedAt: null,
    createdAt: {
      gte: previousRangeStart,
      lte: previousRangeEnd,
    },
  };

  const [
    totalCurrent,
    totalPrevious,
    unassignedCurrent,
    unassignedPrevious,
    statusRowsCurrent,
    statusRowsPrevious,
    priorityRowsCurrent,
    sourceRows,
    campaignRows,
    assigneeRows,
    recentLeads,
    seriesRows,
  ] = await Promise.all([
    prisma.lead.count({ where: currentWhere }),
    prisma.lead.count({ where: previousWhere }),
    prisma.lead.count({
      where: {
        ...currentWhere,
        assigneeId: null,
      },
    }),
    prisma.lead.count({
      where: {
        ...previousWhere,
        assigneeId: null,
      },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: currentWhere,
      _count: { id: true },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: previousWhere,
      _count: { id: true },
    }),
    prisma.lead.groupBy({
      by: ["priority"],
      where: currentWhere,
      _count: { id: true },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: currentWhere,
      _count: { id: true },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 6,
    }),
    prisma.lead.groupBy({
      by: ["utmSource", "utmCampaign"],
      where: {
        ...currentWhere,
        OR: [{ utmSource: { not: null } }, { utmCampaign: { not: null } }],
      },
      _count: { id: true },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 6,
    }),
    prisma.lead.groupBy({
      by: ["assigneeId"],
      where: currentWhere,
      _count: { id: true },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 6,
    }),
    prisma.lead.findMany({
      where: currentWhere,
      orderBy: [{ createdAt: "desc" }],
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        source: true,
        status: true,
        createdAt: true,
        assignee: {
          select: {
            fullName: true,
          },
        },
      },
    }),
    prisma.lead.findMany({
      where: currentWhere,
      select: {
        createdAt: true,
        status: true,
      },
    }),
  ]);

  const currentStatusMap = new Map(
    statusRowsCurrent.map((item) => [item.status, item._count.id]),
  );
  const previousStatusMap = new Map(
    statusRowsPrevious.map((item) => [item.status, item._count.id]),
  );
  const currentPriorityMap = new Map(
    priorityRowsCurrent.map((item) => [item.priority, item._count.id]),
  );

  const currentNew = currentStatusMap.get(InternalLeadStatus.NOVO) ?? 0;
  const previousNew = previousStatusMap.get(InternalLeadStatus.NOVO) ?? 0;
  const currentQualified = currentStatusMap.get(InternalLeadStatus.QUALIFICADO) ?? 0;
  const previousQualified = previousStatusMap.get(InternalLeadStatus.QUALIFICADO) ?? 0;
  const currentConverted = currentStatusMap.get(InternalLeadStatus.CONVERTIDO) ?? 0;
  const previousConverted = previousStatusMap.get(InternalLeadStatus.CONVERTIDO) ?? 0;
  const currentLost = currentStatusMap.get(InternalLeadStatus.PERDIDO) ?? 0;
  const previousLost = previousStatusMap.get(InternalLeadStatus.PERDIDO) ?? 0;
  const currentSpam = currentStatusMap.get(InternalLeadStatus.SPAM) ?? 0;
  const previousSpam = previousStatusMap.get(InternalLeadStatus.SPAM) ?? 0;

  const currentConversionRate = totalCurrent
    ? Number(((currentConverted / totalCurrent) * 100).toFixed(1))
    : 0;
  const previousConversionRate = totalPrevious
    ? Number(((previousConverted / totalPrevious) * 100).toFixed(1))
    : 0;

  const assigneeIds = assigneeRows
    .map((item) => item.assigneeId)
    .filter((item): item is string => !!item);

  const assignees = assigneeIds.length
    ? await prisma.internalAdminUser.findMany({
        where: {
          id: {
            in: assigneeIds,
          },
        },
        select: {
          id: true,
          fullName: true,
        },
      })
    : [];

  const assigneeNameMap = new Map(assignees.map((item) => [item.id, item.fullName]));

  const dailySeries = Array.from({ length: safeDays }, (_, index) => {
    const date = startOfDay(addDays(rangeStart, index));
    return {
      key: toDateKey(date),
      date,
      label: date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      total: 0,
      converted: 0,
    };
  });

  const dailyIndexByKey = new Map(
    dailySeries.map((item, index) => [item.key, index]),
  );

  for (const row of seriesRows) {
    const index = dailyIndexByKey.get(toDateKey(row.createdAt));
    if (index === undefined) {
      continue;
    }

    dailySeries[index].total += 1;
    if (row.status === InternalLeadStatus.CONVERTIDO) {
      dailySeries[index].converted += 1;
    }
  }

  const maxDailyTotal = dailySeries.reduce((max, item) => Math.max(max, item.total), 0);
  const maxDailyConverted = dailySeries.reduce(
    (max, item) => Math.max(max, item.converted),
    0,
  );

  return {
    range: {
      days: safeDays,
      from: rangeStart,
      to: now,
      previousFrom: previousRangeStart,
      previousTo: previousRangeEnd,
    },
    metrics: {
      total: {
        value: totalCurrent,
        previous: totalPrevious,
        deltaPercent: toPercentChange(totalCurrent, totalPrevious),
      },
      newLeads: {
        value: currentNew,
        previous: previousNew,
        deltaPercent: toPercentChange(currentNew, previousNew),
      },
      qualified: {
        value: currentQualified,
        previous: previousQualified,
        deltaPercent: toPercentChange(currentQualified, previousQualified),
      },
      converted: {
        value: currentConverted,
        previous: previousConverted,
        deltaPercent: toPercentChange(currentConverted, previousConverted),
      },
      conversionRate: {
        value: currentConversionRate,
        previous: previousConversionRate,
        deltaPercent: toPercentChange(currentConversionRate, previousConversionRate),
      },
      lost: {
        value: currentLost,
        previous: previousLost,
        deltaPercent: toPercentChange(currentLost, previousLost),
      },
      spam: {
        value: currentSpam,
        previous: previousSpam,
        deltaPercent: toPercentChange(currentSpam, previousSpam),
      },
      averagePerDay: Number((totalCurrent / safeDays).toFixed(1)),
      unassigned: {
        value: unassignedCurrent,
        previous: unassignedPrevious,
        deltaPercent: toPercentChange(unassignedCurrent, unassignedPrevious),
      },
    },
    distributions: {
      status: DASHBOARD_STATUS_ORDER.map((status) => {
        const count = currentStatusMap.get(status) ?? 0;
        return {
          status,
          count,
          percent: toPercentShare(count, totalCurrent),
        };
      }),
      priority: DASHBOARD_PRIORITY_ORDER.map((priority) => {
        const count = currentPriorityMap.get(priority) ?? 0;
        return {
          priority,
          count,
          percent: toPercentShare(count, totalCurrent),
        };
      }),
      sources: sourceRows.map((item) => ({
        source: normalizeTrafficLabel(item.source),
        count: item._count.id,
        percent: toPercentShare(item._count.id, totalCurrent),
      })),
      campaigns: campaignRows.map((item) => ({
        label: normalizeCampaignLabel(item.utmSource, item.utmCampaign),
        count: item._count.id,
        percent: toPercentShare(item._count.id, totalCurrent),
      })),
      assignees: assigneeRows.map((item) => ({
        assignee:
          item.assigneeId
            ? assigneeNameMap.get(item.assigneeId) ?? "Responsável removido"
            : "Sem responsável",
        count: item._count.id,
        percent: toPercentShare(item._count.id, totalCurrent),
      })),
    },
    series: {
      daily: dailySeries,
      maxDailyTotal,
      maxDailyConverted,
    },
    recentLeads,
  };
}

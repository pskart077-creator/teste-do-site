import {
  AnalyticsEventType,
  ChatConversationPriority,
  ChatConversationStatus,
  CrmActivityType,
  CrmDealStage,
  CrmTaskStatus,
  InternalAdminRoleKey,
  InternalLeadPriority,
  InternalLeadStatus,
} from "@prisma/client";
import { z } from "zod";
import { INTERNAL_DEFAULT_PAGE_SIZE, INTERNAL_MAX_PAGE_SIZE } from "@/lib/admin-interno/constants";

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(256),
});

export const createAdminUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(256),
  role: z.nativeEnum(InternalAdminRoleKey),
});

export const updateAdminUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  role: z.nativeEnum(InternalAdminRoleKey).optional(),
  isActive: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(12).max(256),
});

export const leadIngestionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).optional(),
  phone: z.string().trim().max(32).optional(),
  company: z.string().trim().max(160).optional(),
  source: z.string().trim().max(120).optional(),
  sourcePage: z.string().trim().max(300).optional(),
  campaign: z.string().trim().max(120).optional(),
  utm_source: z.string().trim().max(120).optional(),
  utm_medium: z.string().trim().max(120).optional(),
  utm_campaign: z.string().trim().max(120).optional(),
  utm_content: z.string().trim().max(120).optional(),
  utm_term: z.string().trim().max(120).optional(),
  message: z.string().trim().max(5000).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  captureStage: z.enum(["partial", "complete"]).optional(),
  existingLeadId: z.string().trim().max(120).optional(),
}).superRefine((value, ctx) => {
  const stage = value.captureStage === "partial" ? "partial" : "complete";

  if (stage === "partial" && !value.phone?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["phone"],
      message: "Telefone obrigatorio para captura inicial.",
    });
  }

  if (stage === "complete" && !value.email?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["email"],
      message: "E-mail obrigatorio para envio final.",
    });
  }
});

export const leadUpdateSchema = z
  .object({
    status: z.nativeEnum(InternalLeadStatus).optional(),
    priority: z.nativeEnum(InternalLeadPriority).optional(),
    assigneeId: z.union([z.string().trim().min(1), z.null()]).optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nenhum campo para atualizar.",
  });

export const leadNoteSchema = z.object({
  note: z.string().trim().min(1).max(5000),
});

export const notificationRecipientCreateSchema = z.object({
  email: z.string().trim().email().max(254),
  fullName: z.string().trim().max(120).optional(),
  isActive: z.boolean().optional(),
});

export const notificationRecipientUpdateSchema = z.object({
  fullName: z.string().trim().max(120).optional(),
  isActive: z.boolean().optional(),
});

export const leadQuerySchema = z.object({
  page: z
    .coerce.number()
    .int()
    .min(1)
    .default(1),
  pageSize: z
    .coerce.number()
    .int()
    .min(1)
    .max(INTERNAL_MAX_PAGE_SIZE)
    .default(INTERNAL_DEFAULT_PAGE_SIZE),
  status: z.nativeEnum(InternalLeadStatus).optional(),
  source: z.string().trim().max(120).optional(),
  assigneeId: z.string().trim().min(1).optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  q: z.string().trim().max(120).optional(),
});

export const analyticsIngestSchema = z.object({
  externalVisitorId: z.string().trim().min(16).max(120).optional(),
  externalSessionId: z.string().trim().min(16).max(120).optional(),
  eventType: z.nativeEnum(AnalyticsEventType).default(AnalyticsEventType.PAGE_VIEW),
  path: z.string().trim().min(1).max(300),
  referrer: z.string().trim().max(350).optional().nullable(),
  title: z.string().trim().max(160).optional().nullable(),
  source: z.string().trim().max(120).optional().nullable(),
  queryString: z.string().trim().max(600).optional().nullable(),
  campaign: z.string().trim().max(120).optional().nullable(),
  utm_source: z.string().trim().max(120).optional().nullable(),
  utm_medium: z.string().trim().max(120).optional().nullable(),
  utm_campaign: z.string().trim().max(120).optional().nullable(),
  utm_content: z.string().trim().max(120).optional().nullable(),
  utm_term: z.string().trim().max(120).optional().nullable(),
  ipMasked: z.string().trim().max(80).optional().nullable(),
  country: z.string().trim().max(32).optional().nullable(),
  region: z.string().trim().max(64).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  userAgent: z.string().trim().max(500).optional().nullable(),
  context: z.record(z.string().max(80), z.unknown()).optional().nullable(),
  occurredAt: z.string().datetime().optional(),
});

export const crmDealCreateSchema = z.object({
  title: z.string().trim().min(2).max(180),
  stage: z.nativeEnum(CrmDealStage).optional(),
  valueCents: z.coerce.number().int().min(0).optional().nullable(),
  currency: z.string().trim().min(3).max(8).optional().nullable(),
  probability: z.coerce.number().int().min(0).max(100).optional().nullable(),
  expectedCloseAt: z.string().trim().max(40).optional().nullable(),
  source: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  ownerId: z.string().trim().max(120).optional().nullable(),
  leadId: z.string().trim().max(120).optional().nullable(),
  accountId: z.string().trim().max(120).optional().nullable(),
  accountName: z.string().trim().max(180).optional().nullable(),
  contactId: z.string().trim().max(120).optional().nullable(),
});

export const crmDealUpdateSchema = z
  .object({
    title: z.string().trim().min(2).max(180).optional(),
    stage: z.nativeEnum(CrmDealStage).optional(),
    valueCents: z.coerce.number().int().min(0).optional().nullable(),
    currency: z.string().trim().min(3).max(8).optional().nullable(),
    probability: z.coerce.number().int().min(0).max(100).optional().nullable(),
    expectedCloseAt: z.string().trim().max(40).optional().nullable(),
    source: z.string().trim().max(120).optional().nullable(),
    notes: z.string().trim().max(5000).optional().nullable(),
    ownerId: z.string().trim().max(120).optional().nullable(),
    accountId: z.string().trim().max(120).optional().nullable(),
    contactId: z.string().trim().max(120).optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nenhum campo para atualizar.",
  });

export const crmDealQuerySchema = z.object({
  stage: z.nativeEnum(CrmDealStage).optional(),
  ownerId: z.string().trim().max(120).optional(),
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(10).max(200).default(120),
});

export const crmActivityCreateSchema = z.object({
  type: z.nativeEnum(CrmActivityType).optional(),
  description: z.string().trim().min(1).max(2000),
  metadata: z.record(z.string().max(80), z.unknown()).optional().nullable(),
});

export const crmTaskCreateSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(1200).optional().nullable(),
  dueAt: z.string().trim().max(40).optional().nullable(),
  assigneeId: z.string().trim().max(120).optional().nullable(),
  status: z.nativeEnum(CrmTaskStatus).optional(),
});

export const crmTaskUpdateSchema = z
  .object({
    title: z.string().trim().min(2).max(180).optional(),
    description: z.string().trim().max(1200).optional().nullable(),
    dueAt: z.string().trim().max(40).optional().nullable(),
    assigneeId: z.string().trim().max(120).optional().nullable(),
    status: z.nativeEnum(CrmTaskStatus).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nenhum campo para atualizar.",
  });

export const chatSessionSchema = z.object({
  name: z.string().trim().min(2).max(120).optional().nullable(),
  email: z.string().trim().email().max(254).optional().nullable(),
  phone: z.string().trim().max(32).optional().nullable(),
  source: z.string().trim().max(120).optional().nullable(),
  sourcePage: z.string().trim().max(300).optional().nullable(),
  campaign: z.string().trim().max(120).optional().nullable(),
  utm_source: z.string().trim().max(120).optional().nullable(),
  utm_medium: z.string().trim().max(120).optional().nullable(),
  utm_campaign: z.string().trim().max(120).optional().nullable(),
  utm_content: z.string().trim().max(120).optional().nullable(),
  utm_term: z.string().trim().max(120).optional().nullable(),
});

export const chatVisitorMessageSchema = z.object({
  message: z.string().trim().min(1).max(1800),
  profile: chatSessionSchema.optional(),
});

export const chatAdminMessageSchema = z.object({
  message: z.string().trim().min(1).max(2400),
});

export const chatConversationUpdateSchema = z
  .object({
    status: z.nativeEnum(ChatConversationStatus).optional(),
    priority: z.nativeEnum(ChatConversationPriority).optional(),
    assignedToId: z.union([z.string().trim().min(1), z.null()]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nenhum campo para atualizar.",
  });

export const chatConversationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(20),
  status: z.nativeEnum(ChatConversationStatus).optional(),
  assignedToId: z.string().trim().min(1).optional(),
  q: z.string().trim().max(120).optional(),
  onlyUnread: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional(),
});

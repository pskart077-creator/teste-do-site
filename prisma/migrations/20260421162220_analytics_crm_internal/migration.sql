-- CreateEnum
CREATE TYPE "public"."AnalyticsEventType" AS ENUM ('PAGE_VIEW', 'LEAD_SUBMITTED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."CrmDealStage" AS ENUM ('NOVO_CONTATO', 'DIAGNOSTICO', 'PROPOSTA', 'NEGOCIACAO', 'GANHO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "public"."CrmActivityType" AS ENUM ('NOTE', 'CALL', 'EMAIL', 'MEETING', 'STATUS_CHANGE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."CrmTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."InternalAuditAction" ADD VALUE 'ANALYTICS_INGESTED';
ALTER TYPE "public"."InternalAuditAction" ADD VALUE 'CRM_DEAL_CREATED';
ALTER TYPE "public"."InternalAuditAction" ADD VALUE 'CRM_DEAL_UPDATED';
ALTER TYPE "public"."InternalAuditAction" ADD VALUE 'CRM_DEAL_STAGE_CHANGED';
ALTER TYPE "public"."InternalAuditAction" ADD VALUE 'CRM_ACTIVITY_ADDED';
ALTER TYPE "public"."InternalAuditAction" ADD VALUE 'CRM_TASK_CREATED';
ALTER TYPE "public"."InternalAuditAction" ADD VALUE 'CRM_TASK_UPDATED';

-- AlterTable
ALTER TABLE "public"."leads" ADD COLUMN     "analytics_session_id" TEXT,
ADD COLUMN     "analytics_visitor_id" TEXT;

-- CreateTable
CREATE TABLE "public"."analytics_visitors" (
    "id" TEXT NOT NULL,
    "external_visitor_id" TEXT NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "first_referrer" TEXT,
    "first_landing_path" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "device_type" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "lead_conversions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics_sessions" (
    "id" TEXT NOT NULL,
    "external_session_id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "landing_path" TEXT,
    "exit_path" TEXT,
    "referrer" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_content" TEXT,
    "utm_term" TEXT,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "device_type" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "ip_masked" TEXT,
    "is_bot" BOOLEAN NOT NULL DEFAULT false,
    "lead_conversions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics_events" (
    "id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "analytics_session_id" TEXT,
    "event_type" "public"."AnalyticsEventType" NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "title" TEXT,
    "source" TEXT,
    "query_string" TEXT,
    "context" JSONB,
    "ip_masked" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "device_type" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "is_bot" BOOLEAN NOT NULL DEFAULT false,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crm_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "segment" TEXT,
    "notes" TEXT,
    "owner_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crm_contacts" (
    "id" TEXT NOT NULL,
    "account_id" TEXT,
    "lead_id" TEXT,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "position" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crm_deals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stage" "public"."CrmDealStage" NOT NULL DEFAULT 'NOVO_CONTATO',
    "value_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "probability" INTEGER NOT NULL DEFAULT 0,
    "expected_close_at" TIMESTAMP(3),
    "source" TEXT,
    "notes" TEXT,
    "owner_id" TEXT,
    "lead_id" TEXT,
    "account_id" TEXT,
    "contact_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crm_activities" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "type" "public"."CrmActivityType" NOT NULL DEFAULT 'NOTE',
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crm_tasks" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "assignee_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_at" TIMESTAMP(3),
    "status" "public"."CrmTaskStatus" NOT NULL DEFAULT 'OPEN',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "analytics_visitors_external_visitor_id_key" ON "public"."analytics_visitors"("external_visitor_id");

-- CreateIndex
CREATE INDEX "analytics_visitors_last_seen_at_idx" ON "public"."analytics_visitors"("last_seen_at" DESC);

-- CreateIndex
CREATE INDEX "analytics_visitors_lead_conversions_idx" ON "public"."analytics_visitors"("lead_conversions");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_sessions_external_session_id_key" ON "public"."analytics_sessions"("external_session_id");

-- CreateIndex
CREATE INDEX "analytics_sessions_visitor_id_started_at_idx" ON "public"."analytics_sessions"("visitor_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "analytics_sessions_started_at_idx" ON "public"."analytics_sessions"("started_at" DESC);

-- CreateIndex
CREATE INDEX "analytics_sessions_utm_source_utm_campaign_idx" ON "public"."analytics_sessions"("utm_source", "utm_campaign");

-- CreateIndex
CREATE INDEX "analytics_sessions_lead_conversions_idx" ON "public"."analytics_sessions"("lead_conversions");

-- CreateIndex
CREATE INDEX "analytics_events_event_type_occurred_at_idx" ON "public"."analytics_events"("event_type", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "analytics_events_path_occurred_at_idx" ON "public"."analytics_events"("path", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "analytics_events_analytics_session_id_occurred_at_idx" ON "public"."analytics_events"("analytics_session_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "analytics_events_visitor_id_occurred_at_idx" ON "public"."analytics_events"("visitor_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "crm_accounts_owner_id_created_at_idx" ON "public"."crm_accounts"("owner_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "crm_accounts_name_idx" ON "public"."crm_accounts"("name");

-- CreateIndex
CREATE INDEX "crm_accounts_deleted_at_idx" ON "public"."crm_accounts"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "crm_contacts_lead_id_key" ON "public"."crm_contacts"("lead_id");

-- CreateIndex
CREATE INDEX "crm_contacts_account_id_created_at_idx" ON "public"."crm_contacts"("account_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "crm_contacts_email_idx" ON "public"."crm_contacts"("email");

-- CreateIndex
CREATE INDEX "crm_contacts_deleted_at_idx" ON "public"."crm_contacts"("deleted_at");

-- CreateIndex
CREATE INDEX "crm_deals_stage_created_at_idx" ON "public"."crm_deals"("stage", "created_at" DESC);

-- CreateIndex
CREATE INDEX "crm_deals_owner_id_stage_idx" ON "public"."crm_deals"("owner_id", "stage");

-- CreateIndex
CREATE INDEX "crm_deals_lead_id_idx" ON "public"."crm_deals"("lead_id");

-- CreateIndex
CREATE INDEX "crm_deals_account_id_idx" ON "public"."crm_deals"("account_id");

-- CreateIndex
CREATE INDEX "crm_deals_contact_id_idx" ON "public"."crm_deals"("contact_id");

-- CreateIndex
CREATE INDEX "crm_deals_deleted_at_idx" ON "public"."crm_deals"("deleted_at");

-- CreateIndex
CREATE INDEX "crm_activities_deal_id_created_at_idx" ON "public"."crm_activities"("deal_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "crm_activities_actor_id_created_at_idx" ON "public"."crm_activities"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "crm_activities_type_created_at_idx" ON "public"."crm_activities"("type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "crm_tasks_deal_id_status_idx" ON "public"."crm_tasks"("deal_id", "status");

-- CreateIndex
CREATE INDEX "crm_tasks_assignee_id_status_idx" ON "public"."crm_tasks"("assignee_id", "status");

-- CreateIndex
CREATE INDEX "crm_tasks_due_at_status_idx" ON "public"."crm_tasks"("due_at", "status");

-- CreateIndex
CREATE INDEX "leads_analytics_visitor_id_created_at_idx" ON "public"."leads"("analytics_visitor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "leads_analytics_session_id_created_at_idx" ON "public"."leads"("analytics_session_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "public"."analytics_sessions" ADD CONSTRAINT "analytics_sessions_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "public"."analytics_visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics_events" ADD CONSTRAINT "analytics_events_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "public"."analytics_visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics_events" ADD CONSTRAINT "analytics_events_analytics_session_id_fkey" FOREIGN KEY ("analytics_session_id") REFERENCES "public"."analytics_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_analytics_visitor_id_fkey" FOREIGN KEY ("analytics_visitor_id") REFERENCES "public"."analytics_visitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_analytics_session_id_fkey" FOREIGN KEY ("analytics_session_id") REFERENCES "public"."analytics_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_accounts" ADD CONSTRAINT "crm_accounts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_contacts" ADD CONSTRAINT "crm_contacts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_contacts" ADD CONSTRAINT "crm_contacts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_deals" ADD CONSTRAINT "crm_deals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_deals" ADD CONSTRAINT "crm_deals_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_deals" ADD CONSTRAINT "crm_deals_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_deals" ADD CONSTRAINT "crm_deals_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_activities" ADD CONSTRAINT "crm_activities_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_activities" ADD CONSTRAINT "crm_activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_tasks" ADD CONSTRAINT "crm_tasks_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_tasks" ADD CONSTRAINT "crm_tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

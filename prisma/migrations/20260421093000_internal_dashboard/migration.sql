-- CreateEnum
CREATE TYPE "public"."InternalAdminRoleKey" AS ENUM ('SUPERADMIN', 'ADMIN', 'VISUALIZADOR');

-- CreateEnum
CREATE TYPE "public"."InternalLeadStatus" AS ENUM ('NOVO', 'EM_ANALISE', 'CONTATADO', 'QUALIFICADO', 'CONVERTIDO', 'PERDIDO', 'SPAM');

-- CreateEnum
CREATE TYPE "public"."InternalLeadPriority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "public"."InternalLeadHistoryAction" AS ENUM ('CREATED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'ASSIGNEE_CHANGED', 'NOTE_ADDED', 'TAGS_UPDATED', 'UPDATED');

-- CreateEnum
CREATE TYPE "public"."InternalAuditAction" AS ENUM (
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'SESSION_REVOKED',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DEACTIVATED',
  'USER_REACTIVATED',
  'USER_ROLE_CHANGED',
  'USER_PASSWORD_RESET',
  'LEAD_RECEIVED',
  'LEAD_VIEWED',
  'LEAD_STATUS_CHANGED',
  'LEAD_PRIORITY_CHANGED',
  'LEAD_ASSIGNED',
  'LEAD_NOTE_ADDED',
  'LEAD_TAGS_UPDATED',
  'LEAD_EXPORTED',
  'RECIPIENT_CREATED',
  'RECIPIENT_UPDATED',
  'RECIPIENT_DELETED',
  'SETTINGS_UPDATED',
  'NOTIFICATION_SENT',
  'NOTIFICATION_FAILED',
  'SECURITY_LOCKOUT',
  'SECURITY_EVENT'
);

-- CreateEnum
CREATE TYPE "public"."InternalNotificationChannel" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "public"."InternalNotificationDeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."InternalNotificationJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'DEAD');

-- CreateTable
CREATE TABLE "public"."admin_roles" (
  "id" TEXT NOT NULL,
  "key" "public"."InternalAdminRoleKey" NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role_id" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "failed_login_count" INTEGER NOT NULL DEFAULT 0,
  "locked_until" TIMESTAMP(3),
  "last_login_at" TIMESTAMP(3),
  "last_password_change_at" TIMESTAMP(3),
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."internal_admin_sessions" (
  "id" TEXT NOT NULL,
  "session_token_hash" TEXT NOT NULL,
  "csrf_token_hash" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "ip_masked" TEXT,
  "user_agent_hash" TEXT,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" TIMESTAMP(3),
  "revoked_reason" TEXT,
  "rotated_from_session_id" TEXT,
  CONSTRAINT "internal_admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."internal_ip_locks" (
  "id" TEXT NOT NULL,
  "ip_masked" TEXT NOT NULL,
  "failed_count" INTEGER NOT NULL DEFAULT 0,
  "locked_until" TIMESTAMP(3),
  "last_attempt_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "internal_ip_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."internal_login_attempts" (
  "id" TEXT NOT NULL,
  "email" TEXT,
  "user_id" TEXT,
  "ip_masked" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "internal_login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leads" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "company" TEXT,
  "source" TEXT,
  "source_page" TEXT,
  "campaign" TEXT,
  "utm_source" TEXT,
  "utm_medium" TEXT,
  "utm_campaign" TEXT,
  "utm_content" TEXT,
  "utm_term" TEXT,
  "message" TEXT,
  "status" "public"."InternalLeadStatus" NOT NULL DEFAULT 'NOVO',
  "priority" "public"."InternalLeadPriority" NOT NULL DEFAULT 'MEDIA',
  "assignee_id" TEXT,
  "ip_masked" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lead_notes" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lead_tags" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "lead_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lead_tag_relations" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "tag_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_tag_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lead_status_history" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "action" "public"."InternalLeadHistoryAction" NOT NULL,
  "changed_by_id" TEXT,
  "from_status" "public"."InternalLeadStatus",
  "to_status" "public"."InternalLeadStatus",
  "from_priority" "public"."InternalLeadPriority",
  "to_priority" "public"."InternalLeadPriority",
  "from_assignee_id" TEXT,
  "to_assignee_id" TEXT,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_recipients" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "full_name" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_logs" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "recipient_id" TEXT NOT NULL,
  "channel" "public"."InternalNotificationChannel" NOT NULL DEFAULT 'EMAIL',
  "status" "public"."InternalNotificationDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
  "attempt" INTEGER NOT NULL DEFAULT 0,
  "provider" TEXT,
  "error_message" TEXT,
  "sent_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_jobs" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "recipient_id" TEXT NOT NULL,
  "status" "public"."InternalNotificationJobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 5,
  "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "locked_at" TIMESTAMP(3),
  "last_tried_at" TIMESTAMP(3),
  "last_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
  "id" TEXT NOT NULL,
  "actor_id" TEXT,
  "action" "public"."InternalAuditAction" NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT,
  "context" JSONB,
  "ip_masked" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_roles_key_key" ON "public"."admin_roles"("key");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "public"."admin_users"("email");
CREATE INDEX "admin_users_role_id_idx" ON "public"."admin_users"("role_id");
CREATE INDEX "admin_users_is_active_deleted_at_idx" ON "public"."admin_users"("is_active", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "internal_admin_sessions_session_token_hash_key" ON "public"."internal_admin_sessions"("session_token_hash");
CREATE INDEX "internal_admin_sessions_user_id_revoked_at_expires_at_idx" ON "public"."internal_admin_sessions"("user_id", "revoked_at", "expires_at");
CREATE INDEX "internal_admin_sessions_expires_at_idx" ON "public"."internal_admin_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "internal_ip_locks_ip_masked_key" ON "public"."internal_ip_locks"("ip_masked");

-- CreateIndex
CREATE INDEX "internal_login_attempts_email_created_at_idx" ON "public"."internal_login_attempts"("email", "created_at");
CREATE INDEX "internal_login_attempts_ip_masked_created_at_idx" ON "public"."internal_login_attempts"("ip_masked", "created_at");
CREATE INDEX "internal_login_attempts_user_id_created_at_idx" ON "public"."internal_login_attempts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "leads_status_created_at_idx" ON "public"."leads"("status", "created_at" DESC);
CREATE INDEX "leads_assignee_id_status_idx" ON "public"."leads"("assignee_id", "status");
CREATE INDEX "leads_source_created_at_idx" ON "public"."leads"("source", "created_at" DESC);
CREATE INDEX "leads_email_idx" ON "public"."leads"("email");
CREATE INDEX "leads_phone_idx" ON "public"."leads"("phone");
CREATE INDEX "leads_company_idx" ON "public"."leads"("company");
CREATE INDEX "leads_created_at_idx" ON "public"."leads"("created_at" DESC);

-- CreateIndex
CREATE INDEX "lead_notes_lead_id_created_at_idx" ON "public"."lead_notes"("lead_id", "created_at" DESC);
CREATE INDEX "lead_notes_author_id_idx" ON "public"."lead_notes"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "lead_tags_name_key" ON "public"."lead_tags"("name");
CREATE UNIQUE INDEX "lead_tags_slug_key" ON "public"."lead_tags"("slug");
CREATE INDEX "lead_tags_deleted_at_idx" ON "public"."lead_tags"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "lead_tag_relations_lead_id_tag_id_key" ON "public"."lead_tag_relations"("lead_id", "tag_id");
CREATE INDEX "lead_tag_relations_tag_id_idx" ON "public"."lead_tag_relations"("tag_id");

-- CreateIndex
CREATE INDEX "lead_status_history_lead_id_created_at_idx" ON "public"."lead_status_history"("lead_id", "created_at" DESC);
CREATE INDEX "lead_status_history_action_idx" ON "public"."lead_status_history"("action");
CREATE INDEX "lead_status_history_changed_by_id_idx" ON "public"."lead_status_history"("changed_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_recipients_email_key" ON "public"."notification_recipients"("email");
CREATE INDEX "notification_recipients_is_active_deleted_at_idx" ON "public"."notification_recipients"("is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "notification_logs_lead_id_created_at_idx" ON "public"."notification_logs"("lead_id", "created_at" DESC);
CREATE INDEX "notification_logs_recipient_id_created_at_idx" ON "public"."notification_logs"("recipient_id", "created_at" DESC);
CREATE INDEX "notification_logs_status_created_at_idx" ON "public"."notification_logs"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notification_jobs_status_next_attempt_at_idx" ON "public"."notification_jobs"("status", "next_attempt_at");
CREATE INDEX "notification_jobs_recipient_id_status_idx" ON "public"."notification_jobs"("recipient_id", "status");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "public"."audit_logs"("action", "created_at" DESC);
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "public"."audit_logs"("entity_type", "entity_id");
CREATE INDEX "audit_logs_created_at_idx" ON "public"."audit_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "public"."admin_users"
  ADD CONSTRAINT "admin_users_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "public"."admin_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."admin_users"
  ADD CONSTRAINT "admin_users_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."internal_admin_sessions"
  ADD CONSTRAINT "internal_admin_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."leads"
  ADD CONSTRAINT "leads_assignee_id_fkey"
  FOREIGN KEY ("assignee_id") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."lead_notes"
  ADD CONSTRAINT "lead_notes_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."lead_notes"
  ADD CONSTRAINT "lead_notes_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "public"."admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."lead_tag_relations"
  ADD CONSTRAINT "lead_tag_relations_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."lead_tag_relations"
  ADD CONSTRAINT "lead_tag_relations_tag_id_fkey"
  FOREIGN KEY ("tag_id") REFERENCES "public"."lead_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."lead_status_history"
  ADD CONSTRAINT "lead_status_history_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."lead_status_history"
  ADD CONSTRAINT "lead_status_history_changed_by_id_fkey"
  FOREIGN KEY ("changed_by_id") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."notification_logs"
  ADD CONSTRAINT "notification_logs_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."notification_logs"
  ADD CONSTRAINT "notification_logs_recipient_id_fkey"
  FOREIGN KEY ("recipient_id") REFERENCES "public"."notification_recipients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."notification_jobs"
  ADD CONSTRAINT "notification_jobs_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."notification_jobs"
  ADD CONSTRAINT "notification_jobs_recipient_id_fkey"
  FOREIGN KEY ("recipient_id") REFERENCES "public"."notification_recipients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."audit_logs"
  ADD CONSTRAINT "audit_logs_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

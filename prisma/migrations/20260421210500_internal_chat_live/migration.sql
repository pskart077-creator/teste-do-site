-- CreateEnum
CREATE TYPE "public"."ChatConversationStatus" AS ENUM (
    'OPEN',
    'WAITING_ATTENDANT',
    'WAITING_VISITOR',
    'RESOLVED',
    'ARCHIVED'
);

-- CreateEnum
CREATE TYPE "public"."ChatConversationPriority" AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);

-- CreateEnum
CREATE TYPE "public"."ChatMessageSenderType" AS ENUM (
    'VISITOR',
    'ATTENDANT',
    'SYSTEM'
);

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.
ALTER TYPE "public"."InternalAuditAction" ADD VALUE 'CHAT_CONVERSATION_STARTED';
ALTER TYPE "public"."InternalAuditAction" ADD VALUE 'CHAT_CONVERSATION_VIEWED';
ALTER TYPE "public"."InternalAuditAction" ADD VALUE 'CHAT_CONVERSATION_UPDATED';
ALTER TYPE "public"."InternalAuditAction" ADD VALUE 'CHAT_MESSAGE_RECEIVED';
ALTER TYPE "public"."InternalAuditAction" ADD VALUE 'CHAT_MESSAGE_SENT';

-- CreateTable
CREATE TABLE "public"."chat_conversations" (
    "id" TEXT NOT NULL,
    "visitor_token_hash" TEXT NOT NULL,
    "visitor_name" TEXT,
    "visitor_email" TEXT,
    "visitor_phone" TEXT,
    "source" TEXT,
    "source_page" TEXT,
    "campaign" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_content" TEXT,
    "utm_term" TEXT,
    "status" "public"."ChatConversationStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "public"."ChatConversationPriority" NOT NULL DEFAULT 'NORMAL',
    "assigned_to_id" TEXT,
    "lead_id" TEXT,
    "analytics_visitor_id" TEXT,
    "analytics_session_id" TEXT,
    "ip_masked" TEXT,
    "user_agent" TEXT,
    "unread_for_admin" INTEGER NOT NULL DEFAULT 0,
    "unread_for_visitor" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMP(3),
    "last_visitor_message_at" TIMESTAMP(3),
    "last_attendant_message_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_type" "public"."ChatMessageSenderType" NOT NULL,
    "sender_admin_id" TEXT,
    "body" TEXT NOT NULL,
    "ip_masked" TEXT,
    "user_agent" TEXT,
    "read_by_admin_at" TIMESTAMP(3),
    "read_by_visitor_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_conversations_visitor_token_hash_key" ON "public"."chat_conversations"("visitor_token_hash");

-- CreateIndex
CREATE INDEX "chat_conversations_status_updated_at_idx" ON "public"."chat_conversations"("status", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "chat_conversations_assigned_to_id_status_updated_at_idx" ON "public"."chat_conversations"("assigned_to_id", "status", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "chat_conversations_visitor_email_idx" ON "public"."chat_conversations"("visitor_email");

-- CreateIndex
CREATE INDEX "chat_conversations_visitor_name_idx" ON "public"."chat_conversations"("visitor_name");

-- CreateIndex
CREATE INDEX "chat_conversations_last_message_at_idx" ON "public"."chat_conversations"("last_message_at" DESC);

-- CreateIndex
CREATE INDEX "chat_conversations_created_at_idx" ON "public"."chat_conversations"("created_at" DESC);

-- CreateIndex
CREATE INDEX "chat_conversations_lead_id_idx" ON "public"."chat_conversations"("lead_id");

-- CreateIndex
CREATE INDEX "chat_conversations_analytics_visitor_id_created_at_idx" ON "public"."chat_conversations"("analytics_visitor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "chat_conversations_analytics_session_id_created_at_idx" ON "public"."chat_conversations"("analytics_session_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "chat_conversations_deleted_at_idx" ON "public"."chat_conversations"("deleted_at");

-- CreateIndex
CREATE INDEX "chat_messages_conversation_id_created_at_desc_idx" ON "public"."chat_messages"("conversation_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "chat_messages_sender_type_created_at_idx" ON "public"."chat_messages"("sender_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "chat_messages_sender_admin_id_created_at_idx" ON "public"."chat_messages"("sender_admin_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "public"."chat_conversations" ADD CONSTRAINT "chat_conversations_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_conversations" ADD CONSTRAINT "chat_conversations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_conversations" ADD CONSTRAINT "chat_conversations_analytics_visitor_id_fkey" FOREIGN KEY ("analytics_visitor_id") REFERENCES "public"."analytics_visitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_conversations" ADD CONSTRAINT "chat_conversations_analytics_session_id_fkey" FOREIGN KEY ("analytics_session_id") REFERENCES "public"."analytics_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_sender_admin_id_fkey" FOREIGN KEY ("sender_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

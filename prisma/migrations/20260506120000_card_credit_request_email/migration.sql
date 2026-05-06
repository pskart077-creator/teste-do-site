-- CreateEnum
CREATE TYPE "public"."CardCreditRequestStatus" AS ENUM ('RECEIVED', 'APPROVED');

-- CreateTable
CREATE TABLE "public"."card_credit_requests" (
  "id" TEXT NOT NULL,
  "protocol" TEXT NOT NULL,
  "status" "public"."CardCreditRequestStatus" NOT NULL DEFAULT 'APPROVED',
  "full_name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "cpf" TEXT,
  "birth_date" TEXT,
  "monthly_income" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "mother_name" TEXT,
  "profession" TEXT,
  "custom_profession" TEXT,
  "zip_code" TEXT,
  "street" TEXT,
  "number" TEXT,
  "complement" TEXT,
  "neighborhood" TEXT,
  "state" TEXT,
  "city" TEXT,
  "invoice_due_day" TEXT,
  "approved_limit" DOUBLE PRECISION NOT NULL DEFAULT 400,
  "approval_email_sent_at" TIMESTAMP(3),
  "approval_email_sending_at" TIMESTAMP(3),
  "approval_email_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "card_credit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "card_credit_requests_protocol_key" ON "public"."card_credit_requests"("protocol");

-- CreateIndex
CREATE INDEX "card_credit_requests_email_created_at_idx" ON "public"."card_credit_requests"("email", "created_at" DESC);

-- CreateIndex
CREATE INDEX "card_credit_requests_status_created_at_idx" ON "public"."card_credit_requests"("status", "created_at" DESC);

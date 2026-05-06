-- AlterTable
ALTER TABLE "public"."card_credit_requests"
ADD COLUMN "issuance_token" TEXT,
ADD COLUMN "issuance_token_created_at" TIMESTAMP(3),
ADD COLUMN "issuance_started_at" TIMESTAMP(3),
ADD COLUMN "issuance_payment_attempt" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "issuance_payment_status" TEXT,
ADD COLUMN "issuance_payment_amount" DOUBLE PRECISION NOT NULL DEFAULT 19.9,
ADD COLUMN "issuance_payment_transaction_id" TEXT,
ADD COLUMN "issuance_payment_qr_code" TEXT,
ADD COLUMN "issuance_payment_copy_paste" TEXT,
ADD COLUMN "issuance_payment_provider_status" TEXT,
ADD COLUMN "issuance_payment_created_at" TIMESTAMP(3),
ADD COLUMN "issuance_payment_paid_at" TIMESTAMP(3),
ADD COLUMN "issuance_payment_error" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "card_credit_requests_issuance_token_key" ON "public"."card_credit_requests"("issuance_token");

-- CreateIndex
CREATE UNIQUE INDEX "card_credit_requests_issuance_payment_transaction_id_key" ON "public"."card_credit_requests"("issuance_payment_transaction_id");

-- CreateIndex
CREATE INDEX "card_credit_requests_issuance_payment_status_updated_at_idx" ON "public"."card_credit_requests"("issuance_payment_status", "updated_at" DESC);

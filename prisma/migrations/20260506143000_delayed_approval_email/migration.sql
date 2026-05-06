ALTER TABLE "card_credit_requests"
  ADD COLUMN "approval_email_scheduled_at" TIMESTAMP(3);

CREATE INDEX "card_credit_requests_approval_email_scheduled_at_approval_email_sent_at_idx"
  ON "card_credit_requests"("approval_email_scheduled_at", "approval_email_sent_at");

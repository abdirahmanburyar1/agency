-- AlterTable: payment_date = when the payment record was created (for history/filtering)
ALTER TABLE "payments" ADD COLUMN "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing rows so payment_date reflects when each payment was created
UPDATE "payments" SET "payment_date" = "created_at";

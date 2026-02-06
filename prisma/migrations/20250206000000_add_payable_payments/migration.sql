-- CreateTable
CREATE TABLE "payable_payments" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "p_method" TEXT,
    "account" TEXT,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submitted_by" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "paid_by" TEXT,
    "paid_at" TIMESTAMP(3),
    "payable_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payable_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payable_payments_payable_id_idx" ON "payable_payments"("payable_id");

-- CreateIndex
CREATE INDEX "payable_payments_status_idx" ON "payable_payments"("status");

-- AddForeignKey
ALTER TABLE "payable_payments" ADD CONSTRAINT "payable_payments_payable_id_fkey" FOREIGN KEY ("payable_id") REFERENCES "payables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

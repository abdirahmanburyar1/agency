-- AlterTable
ALTER TABLE "payments" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "payments" ADD COLUMN "cargo_shipment_id" TEXT;

-- AlterTable
ALTER TABLE "receipts" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "receipts" ADD COLUMN "rate_to_base" DECIMAL(12,8);
ALTER TABLE "receipts" ADD COLUMN "collection_point" TEXT;

-- AlterTable
ALTER TABLE "cargo_shipments" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';

-- CreateIndex
CREATE INDEX "payments_cargo_shipment_id_idx" ON "payments"("cargo_shipment_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_cargo_shipment_id_fkey" FOREIGN KEY ("cargo_shipment_id") REFERENCES "cargo_shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

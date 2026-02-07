-- CreateTable
CREATE TABLE "cargo_shipments" (
    "id" TEXT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "sender_phone" TEXT NOT NULL,
    "receiver_name" TEXT NOT NULL,
    "receiver_phone" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "total_weight" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargo_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_items" (
    "id" TEXT NOT NULL,
    "cargo_shipment_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "cargo_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_tracking_logs" (
    "id" TEXT NOT NULL,
    "cargo_shipment_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargo_tracking_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_sequences" (
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargo_sequences_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE UNIQUE INDEX "cargo_shipments_tracking_number_key" ON "cargo_shipments"("tracking_number");

-- CreateIndex
CREATE INDEX "cargo_shipments_status_idx" ON "cargo_shipments"("status");

-- CreateIndex
CREATE INDEX "cargo_shipments_created_at_idx" ON "cargo_shipments"("created_at");

-- CreateIndex
CREATE INDEX "cargo_items_cargo_shipment_id_idx" ON "cargo_items"("cargo_shipment_id");

-- CreateIndex
CREATE INDEX "cargo_tracking_logs_cargo_shipment_id_idx" ON "cargo_tracking_logs"("cargo_shipment_id");

-- AddForeignKey
ALTER TABLE "cargo_items" ADD CONSTRAINT "cargo_items_cargo_shipment_id_fkey" FOREIGN KEY ("cargo_shipment_id") REFERENCES "cargo_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_tracking_logs" ADD CONSTRAINT "cargo_tracking_logs_cargo_shipment_id_fkey" FOREIGN KEY ("cargo_shipment_id") REFERENCES "cargo_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add transport mode (air | road | sea) and carrier to cargo shipments
ALTER TABLE "cargo_shipments" ADD COLUMN "transport_mode" TEXT NOT NULL DEFAULT 'air';
ALTER TABLE "cargo_shipments" ADD COLUMN "carrier" TEXT NOT NULL DEFAULT '';

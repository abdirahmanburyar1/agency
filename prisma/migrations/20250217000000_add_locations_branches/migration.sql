-- Create cargo_locations (e.g. Nairobi, Mombasa)
CREATE TABLE "cargo_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargo_locations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cargo_locations_name_key" ON "cargo_locations"("name");

-- Create branches (location -> branch, with contact details)
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "branches_location_id_name_key" ON "branches"("location_id", "name");
CREATE INDEX "branches_location_id_idx" ON "branches"("location_id");

ALTER TABLE "branches" ADD CONSTRAINT "branches_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "cargo_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate users: replace branch (string) with location_id, branch_id
ALTER TABLE "users" DROP COLUMN IF EXISTS "branch";
ALTER TABLE "users" ADD COLUMN "location_id" TEXT;
ALTER TABLE "users" ADD COLUMN "branch_id" TEXT;

ALTER TABLE "users" ADD CONSTRAINT "users_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "cargo_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add branch FKs to cargo_shipments
ALTER TABLE "cargo_shipments" ADD COLUMN "source_branch_id" TEXT;
ALTER TABLE "cargo_shipments" ADD COLUMN "destination_branch_id" TEXT;

CREATE INDEX "cargo_shipments_source_branch_id_idx" ON "cargo_shipments"("source_branch_id");
CREATE INDEX "cargo_shipments_destination_branch_id_idx" ON "cargo_shipments"("destination_branch_id");

ALTER TABLE "cargo_shipments" ADD CONSTRAINT "cargo_shipments_source_branch_id_fkey" FOREIGN KEY ("source_branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cargo_shipments" ADD CONSTRAINT "cargo_shipments_destination_branch_id_fkey" FOREIGN KEY ("destination_branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate existing cargo_location settings to cargo_locations (creates location, no branches)
INSERT INTO "cargo_locations" ("id", "name")
SELECT gen_random_uuid()::text, s."value" FROM "settings" s
WHERE s."type" = 'cargo_location'
AND NOT EXISTS (SELECT 1 FROM "cargo_locations" c WHERE c."name" = s."value");

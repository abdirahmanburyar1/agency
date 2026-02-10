-- Multi-tenant migration: additive only, no data deletion
-- Creates tenants table, adds tenant_id to all tables, backfills existing data with default tenant

-- 1. Create tenants table
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");

-- 2. Insert default tenant for existing data
INSERT INTO "tenants" ("id", "subdomain", "name", "status", "created_at", "updated_at")
VALUES ('cldefault00000000000000001', 'default', 'Default Tenant', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. users: add tenant_id (nullable for platform admins), is_platform_admin; update unique constraint
ALTER TABLE "users" ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "users" ADD COLUMN "is_platform_admin" BOOLEAN NOT NULL DEFAULT false;
UPDATE "users" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
DROP INDEX IF EXISTS "users_email_key";
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. roles: add tenant_id; update unique constraint
ALTER TABLE "roles" ADD COLUMN "tenant_id" TEXT;
UPDATE "roles" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
DROP INDEX IF EXISTS "roles_name_key";
CREATE UNIQUE INDEX "roles_tenant_id_name_key" ON "roles"("tenant_id", "name");
CREATE INDEX "roles_tenant_id_idx" ON "roles"("tenant_id");
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. system_settings: migrate to new structure (id, tenant_id, key)
-- Add new columns, migrate data, drop old PK, add new constraints
ALTER TABLE "system_settings" ADD COLUMN "id" TEXT;
ALTER TABLE "system_settings" ADD COLUMN "tenant_id" TEXT;
UPDATE "system_settings" SET "id" = gen_random_uuid()::text, "tenant_id" = 'cldefault00000000000000001' WHERE "id" IS NULL;
ALTER TABLE "system_settings" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "system_settings" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "system_settings" DROP CONSTRAINT "system_settings_pkey";
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");
CREATE UNIQUE INDEX "system_settings_tenant_id_key_key" ON "system_settings"("tenant_id", "key");
CREATE INDEX "system_settings_tenant_id_idx" ON "system_settings"("tenant_id");
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. currency_rates: add tenant_id; update unique constraint
ALTER TABLE "currency_rates" ADD COLUMN "tenant_id" TEXT;
UPDATE "currency_rates" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "currency_rates" ALTER COLUMN "tenant_id" SET NOT NULL;
DROP INDEX IF EXISTS "currency_rates_currency_key";
CREATE UNIQUE INDEX "currency_rates_tenant_id_currency_key" ON "currency_rates"("tenant_id", "currency");
CREATE INDEX "currency_rates_tenant_id_idx" ON "currency_rates"("tenant_id");
ALTER TABLE "currency_rates" ADD CONSTRAINT "currency_rates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. settings: add tenant_id; update unique constraint
ALTER TABLE "settings" ADD COLUMN "tenant_id" TEXT;
UPDATE "settings" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "settings" ALTER COLUMN "tenant_id" SET NOT NULL;
DROP INDEX IF EXISTS "settings_type_value_key";
CREATE UNIQUE INDEX "settings_tenant_id_type_value_key" ON "settings"("tenant_id", "type", "value");
CREATE INDEX "settings_tenant_id_idx" ON "settings"("tenant_id");
ALTER TABLE "settings" ADD CONSTRAINT "settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. documents: add tenant_id
ALTER TABLE "documents" ADD COLUMN "tenant_id" TEXT;
UPDATE "documents" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "documents" ALTER COLUMN "tenant_id" SET NOT NULL;
CREATE INDEX "documents_tenant_id_idx" ON "documents"("tenant_id");
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. customers: add tenant_id
ALTER TABLE "customers" ADD COLUMN "tenant_id" TEXT;
UPDATE "customers" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "customers" ALTER COLUMN "tenant_id" SET NOT NULL;
CREATE INDEX "customers_tenant_id_idx" ON "customers"("tenant_id");
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. employees: add tenant_id
ALTER TABLE "employees" ADD COLUMN "tenant_id" TEXT;
UPDATE "employees" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "employees" ALTER COLUMN "tenant_id" SET NOT NULL;
CREATE INDEX "employees_tenant_id_idx" ON "employees"("tenant_id");
ALTER TABLE "employees" ADD CONSTRAINT "employees_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 11. tickets: add tenant_id; update unique constraint
ALTER TABLE "tickets" ADD COLUMN "tenant_id" TEXT;
UPDATE "tickets" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "tickets" ALTER COLUMN "tenant_id" SET NOT NULL;
DROP INDEX IF EXISTS "tickets_ticket_number_key";
CREATE UNIQUE INDEX "tickets_tenant_id_ticket_number_key" ON "tickets"("tenant_id", "ticket_number");
CREATE INDEX "tickets_tenant_id_idx" ON "tickets"("tenant_id");
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 12. visas: add tenant_id; update unique constraint
ALTER TABLE "visas" ADD COLUMN "tenant_id" TEXT;
UPDATE "visas" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "visas" ALTER COLUMN "tenant_id" SET NOT NULL;
DROP INDEX IF EXISTS "visas_visa_number_key";
CREATE UNIQUE INDEX "visas_tenant_id_visa_number_key" ON "visas"("tenant_id", "visa_number");
CREATE INDEX "visas_tenant_id_idx" ON "visas"("tenant_id");
ALTER TABLE "visas" ADD CONSTRAINT "visas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 13. expenses: add tenant_id
ALTER TABLE "expenses" ADD COLUMN "tenant_id" TEXT;
UPDATE "expenses" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "expenses" ALTER COLUMN "tenant_id" SET NOT NULL;
CREATE INDEX "expenses_tenant_id_idx" ON "expenses"("tenant_id");
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 14. payables: add tenant_id
ALTER TABLE "payables" ADD COLUMN "tenant_id" TEXT;
UPDATE "payables" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "payables" ALTER COLUMN "tenant_id" SET NOT NULL;
CREATE INDEX "payables_tenant_id_idx" ON "payables"("tenant_id");
ALTER TABLE "payables" ADD CONSTRAINT "payables_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 15. payments: add tenant_id
ALTER TABLE "payments" ADD COLUMN "tenant_id" TEXT;
UPDATE "payments" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "payments" ALTER COLUMN "tenant_id" SET NOT NULL;
CREATE INDEX "payments_tenant_id_idx" ON "payments"("tenant_id");
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 16. haj_umrah_campaigns: add tenant_id
ALTER TABLE "haj_umrah_campaigns" ADD COLUMN "tenant_id" TEXT;
UPDATE "haj_umrah_campaigns" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "haj_umrah_campaigns" ALTER COLUMN "tenant_id" SET NOT NULL;
CREATE INDEX "haj_umrah_campaigns_tenant_id_idx" ON "haj_umrah_campaigns"("tenant_id");
ALTER TABLE "haj_umrah_campaigns" ADD CONSTRAINT "haj_umrah_campaigns_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 17. haj_umrah_packages: add tenant_id
ALTER TABLE "haj_umrah_packages" ADD COLUMN "tenant_id" TEXT;
UPDATE "haj_umrah_packages" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "haj_umrah_packages" ALTER COLUMN "tenant_id" SET NOT NULL;
CREATE INDEX "haj_umrah_packages_tenant_id_idx" ON "haj_umrah_packages"("tenant_id");
ALTER TABLE "haj_umrah_packages" ADD CONSTRAINT "haj_umrah_packages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 18. haj_umrah_bookings: add tenant_id; update unique constraint
ALTER TABLE "haj_umrah_bookings" ADD COLUMN "tenant_id" TEXT;
UPDATE "haj_umrah_bookings" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "haj_umrah_bookings" ALTER COLUMN "tenant_id" SET NOT NULL;
DROP INDEX IF EXISTS "haj_umrah_bookings_track_number_key";
CREATE UNIQUE INDEX "haj_umrah_bookings_tenant_id_track_number_key" ON "haj_umrah_bookings"("tenant_id", "track_number");
CREATE INDEX "haj_umrah_bookings_tenant_id_idx" ON "haj_umrah_bookings"("tenant_id");
ALTER TABLE "haj_umrah_bookings" ADD CONSTRAINT "haj_umrah_bookings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 19. cargo_locations: add tenant_id; update unique constraint
ALTER TABLE "cargo_locations" ADD COLUMN "tenant_id" TEXT;
UPDATE "cargo_locations" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "cargo_locations" ALTER COLUMN "tenant_id" SET NOT NULL;
DROP INDEX IF EXISTS "cargo_locations_name_key";
CREATE UNIQUE INDEX "cargo_locations_tenant_id_name_key" ON "cargo_locations"("tenant_id", "name");
CREATE INDEX "cargo_locations_tenant_id_idx" ON "cargo_locations"("tenant_id");
ALTER TABLE "cargo_locations" ADD CONSTRAINT "cargo_locations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 20. cargo_shipments: add tenant_id; update unique constraint
ALTER TABLE "cargo_shipments" ADD COLUMN "tenant_id" TEXT;
UPDATE "cargo_shipments" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "cargo_shipments" ALTER COLUMN "tenant_id" SET NOT NULL;
DROP INDEX IF EXISTS "cargo_shipments_tracking_number_key";
CREATE UNIQUE INDEX "cargo_shipments_tenant_id_tracking_number_key" ON "cargo_shipments"("tenant_id", "tracking_number");
CREATE INDEX "cargo_shipments_tenant_id_idx" ON "cargo_shipments"("tenant_id");
ALTER TABLE "cargo_shipments" ADD CONSTRAINT "cargo_shipments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 21. cargo_sequences: migrate to composite PK (tenant_id, year)
-- Current PK is (year). Add tenant_id, backfill, drop old PK, add new composite PK
ALTER TABLE "cargo_sequences" ADD COLUMN "tenant_id" TEXT;
UPDATE "cargo_sequences" SET "tenant_id" = 'cldefault00000000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "cargo_sequences" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "cargo_sequences" DROP CONSTRAINT "cargo_sequences_pkey";
ALTER TABLE "cargo_sequences" ADD CONSTRAINT "cargo_sequences_pkey" PRIMARY KEY ("tenant_id", "year");
ALTER TABLE "cargo_sequences" ADD CONSTRAINT "cargo_sequences_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

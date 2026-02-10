-- Create Daybah tenant and migrate all existing data from default tenant to Daybah.
-- Root domain = platform admin. daybah.fayohealthtech.so = Daybah app.

-- 1. Insert Daybah tenant
INSERT INTO "tenants" ("id", "subdomain", "name", "status", "created_at", "updated_at")
VALUES ('cldaybah00000000000000001', 'daybah', 'Daybah Travel Agency', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. Migrate all default-tenant data to Daybah tenant
UPDATE "users" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "roles" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "system_settings" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "currency_rates" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "settings" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "documents" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "customers" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "employees" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "tickets" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "visas" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "expenses" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "payables" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "payments" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "haj_umrah_campaigns" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "haj_umrah_packages" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "haj_umrah_bookings" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "cargo_locations" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "cargo_shipments" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';
UPDATE "cargo_sequences" SET "tenant_id" = 'cldaybah00000000000000001' WHERE "tenant_id" = 'cldefault00000000000000001';

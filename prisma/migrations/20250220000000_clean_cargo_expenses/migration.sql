-- Clean cargo data, cargo payments, and expenses tables

-- 1. Clear user location/branch references (required before deleting branches/locations)
UPDATE "users" SET "location_id" = NULL, "branch_id" = NULL;

-- 2. Delete receipts for cargo payments
DELETE FROM "receipts"
WHERE "payment_id" IN (SELECT "id" FROM "payments" WHERE "cargo_shipment_id" IS NOT NULL);

-- 3. Delete cargo payments
DELETE FROM "payments" WHERE "cargo_shipment_id" IS NOT NULL;

-- 4. Delete cargo child tables
DELETE FROM "cargo_items";
DELETE FROM "cargo_tracking_logs";

-- 5. Delete cargo shipments
DELETE FROM "cargo_shipments";

-- 6. Delete branches and locations
DELETE FROM "branches";
DELETE FROM "cargo_locations";

-- 7. Delete cargo sequences
DELETE FROM "cargo_sequences";

-- 8. Delete all expenses
DELETE FROM "expenses";

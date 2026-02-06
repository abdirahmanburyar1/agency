-- Add package_name to store name at booking time (preserves history when package is deleted)
ALTER TABLE "haj_umrah_booking_packages" ADD COLUMN "package_name" TEXT;

-- Backfill from package
UPDATE "haj_umrah_booking_packages" bp
SET "package_name" = p.name
FROM "haj_umrah_packages" p
WHERE bp."package_id" = p.id;

-- For any orphaned rows (shouldn't exist), use placeholder
UPDATE "haj_umrah_booking_packages" SET "package_name" = 'Package' WHERE "package_name" IS NULL;

ALTER TABLE "haj_umrah_booking_packages" ALTER COLUMN "package_name" SET NOT NULL;

-- Make package_id optional and change FK to SET NULL on delete (allows package deletion)
ALTER TABLE "haj_umrah_booking_packages" DROP CONSTRAINT IF EXISTS "haj_umrah_booking_packages_package_id_fkey";
ALTER TABLE "haj_umrah_booking_packages" ALTER COLUMN "package_id" DROP NOT NULL;
ALTER TABLE "haj_umrah_booking_packages" ADD CONSTRAINT "haj_umrah_booking_packages_package_id_fkey"
  FOREIGN KEY ("package_id") REFERENCES "haj_umrah_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

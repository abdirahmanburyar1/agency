-- Remove payment_date from haj_umrah_bookings (payment date is now auto-set to current date when booking is confirmed)
ALTER TABLE "haj_umrah_bookings" DROP COLUMN IF EXISTS "payment_date";

-- Add passport_country for visa price lookup
ALTER TABLE "haj_umrah_bookings" ADD COLUMN IF NOT EXISTS "passport_country" TEXT;

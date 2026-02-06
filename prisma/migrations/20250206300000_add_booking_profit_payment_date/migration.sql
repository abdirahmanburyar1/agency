-- AlterTable
ALTER TABLE "haj_umrah_bookings" ADD COLUMN IF NOT EXISTS "profit" DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS "payment_date" TIMESTAMP(3);

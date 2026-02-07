-- Remove email column and add whatsapp_number
ALTER TABLE "customers" DROP COLUMN IF EXISTS "email";
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "whatsapp_number" TEXT;

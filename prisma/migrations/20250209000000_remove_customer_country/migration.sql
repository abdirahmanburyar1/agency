-- Remove country column from customers (customers have name, phone, whatsapp_number only)
ALTER TABLE "customers" DROP COLUMN IF EXISTS "country";

-- Remove default_price - all pricing comes from country-specific visa prices (matched to booking passport_country)
ALTER TABLE "haj_umrah_packages" DROP COLUMN IF EXISTS "default_price";

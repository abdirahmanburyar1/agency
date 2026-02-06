-- AlterTable
ALTER TABLE "haj_umrah_packages" ADD COLUMN "price_by_country" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "haj_umrah_packages" ADD COLUMN "fixed_price" DECIMAL(12,2);

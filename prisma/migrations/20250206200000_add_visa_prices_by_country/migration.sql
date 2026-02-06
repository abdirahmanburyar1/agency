-- AlterTable
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "country" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "haj_umrah_package_visa_prices" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "haj_umrah_package_visa_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "haj_umrah_package_visa_prices_package_id_country_key" ON "haj_umrah_package_visa_prices"("package_id", "country");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "haj_umrah_package_visa_prices_package_id_idx" ON "haj_umrah_package_visa_prices"("package_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'haj_umrah_package_visa_prices_package_id_fkey'
  ) THEN
    ALTER TABLE "haj_umrah_package_visa_prices" ADD CONSTRAINT "haj_umrah_package_visa_prices_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "haj_umrah_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

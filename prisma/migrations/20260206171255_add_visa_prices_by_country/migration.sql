-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "country" TEXT;

-- CreateTable
CREATE TABLE "haj_umrah_package_visa_prices" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "haj_umrah_package_visa_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "haj_umrah_package_visa_prices_package_id_idx" ON "haj_umrah_package_visa_prices"("package_id");

-- CreateIndex
CREATE UNIQUE INDEX "haj_umrah_package_visa_prices_package_id_country_key" ON "haj_umrah_package_visa_prices"("package_id", "country");

-- AddForeignKey
ALTER TABLE "haj_umrah_package_visa_prices" ADD CONSTRAINT "haj_umrah_package_visa_prices_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "haj_umrah_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

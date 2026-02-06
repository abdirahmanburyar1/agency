-- CreateTable
CREATE TABLE "currency_rates" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "rate_to_usd" DECIMAL(12,6) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currency_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "currency_rates_currency_key" ON "currency_rates"("currency");

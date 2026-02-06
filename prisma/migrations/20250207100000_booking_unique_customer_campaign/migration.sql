-- Prevent duplicate bookings: one customer per campaign (only for active/non-canceled bookings)
-- Canceled bookings are excluded so a customer can re-book the same campaign after canceling
CREATE UNIQUE INDEX IF NOT EXISTS "haj_umrah_bookings_customer_campaign_active_key"
  ON "haj_umrah_bookings" ("customer_id", "campaign_id")
  WHERE "canceled_at" IS NULL AND "campaign_id" IS NOT NULL;

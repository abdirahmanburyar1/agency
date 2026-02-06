-- Add currency to expenses (default USD)
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';

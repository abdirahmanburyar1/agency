-- Add branch to users (user's assigned branch/office)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "branch" TEXT;

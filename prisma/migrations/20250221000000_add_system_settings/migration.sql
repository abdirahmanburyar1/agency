-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- Seed default values
INSERT INTO "system_settings" ("key", "value", "updated_at") VALUES
    ('system_name', 'Daybah Travel Agency', CURRENT_TIMESTAMP),
    ('logo_url', '/logo.png', CURRENT_TIMESTAMP),
    ('favicon_url', '/favicon.png', CURRENT_TIMESTAMP);

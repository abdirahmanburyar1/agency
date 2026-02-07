-- Migrate cargo_carrier to cargo_carrier_air (existing carriers default to air)
INSERT INTO "settings" ("id", "type", "value", "sort_order", "created_at")
SELECT gen_random_uuid()::text, 'cargo_carrier_air', s."value", s."sort_order", s."created_at"
FROM "settings" s
WHERE s."type" = 'cargo_carrier'
AND NOT EXISTS (
  SELECT 1 FROM "settings" t
  WHERE t."type" = 'cargo_carrier_air' AND t."value" = s."value"
);

-- Remove old cargo_carrier settings
DELETE FROM "settings" WHERE "type" = 'cargo_carrier';

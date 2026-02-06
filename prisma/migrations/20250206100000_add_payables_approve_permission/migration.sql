-- Add payables.approve permission for General Director role
INSERT INTO "permissions" ("id", "code", "name", "resource", "action", "created_at")
VALUES ('perm_payables_approve', 'payables.approve', 'Approve Payable Payments', 'payables', 'approve', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role_id" TEXT NOT NULL,
    "user_type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "image_kit_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "ticket_number" INTEGER,
    "reference" TEXT NOT NULL DEFAULT '',
    "date" TIMESTAMP(3) NOT NULL,
    "month" TEXT NOT NULL,
    "invoice" TEXT,
    "sponsor" TEXT,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "airline" TEXT,
    "route" TEXT,
    "flight" TEXT,
    "departure" TIMESTAMP(3),
    "return" TIMESTAMP(3),
    "net_cost" DECIMAL(12,2) NOT NULL,
    "net_sales" DECIMAL(12,2) NOT NULL,
    "profit" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceled_at" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_adjustments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "previous_net_sales" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "previous_net_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "new_net_sales" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "new_net_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "reason" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visas" (
    "id" TEXT NOT NULL,
    "visa_number" INTEGER,
    "reference" TEXT NOT NULL DEFAULT '',
    "date" TIMESTAMP(3) NOT NULL,
    "month" TEXT NOT NULL,
    "sponsor" TEXT,
    "customer_id" TEXT,
    "customer" TEXT,
    "country" TEXT,
    "net_cost" DECIMAL(12,2) NOT NULL,
    "net_sales" DECIMAL(12,2) NOT NULL,
    "profit" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "month" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "employee_id" TEXT,
    "paid_by" TEXT,
    "received_by" TEXT,
    "p_method" TEXT,
    "account" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_at" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payables" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "month" TEXT NOT NULL,
    "invoice" TEXT,
    "name" TEXT,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "deadline" TIMESTAMP(3),
    "remaining" INTEGER,
    "ticket_id" TEXT,
    "visa_id" TEXT,
    "haj_umrah_booking_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceled_at" TIMESTAMP(3),

    CONSTRAINT "payables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "month" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expected_date" TIMESTAMP(3),
    "name" TEXT,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "ticket_id" TEXT,
    "visa_id" TEXT,
    "haj_umrah_booking_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceled_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "p_method" TEXT,
    "account" TEXT,
    "received_by" TEXT,
    "payment_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "haj_umrah_campaigns" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "month" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT,
    "leader_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceled_at" TIMESTAMP(3),

    CONSTRAINT "haj_umrah_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "haj_umrah_packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "default_price" DECIMAL(12,2) NOT NULL,
    "duration_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "haj_umrah_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "haj_umrah_bookings" (
    "id" TEXT NOT NULL,
    "track_number" INTEGER,
    "campaign_id" TEXT,
    "customer_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "month" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceled_at" TIMESTAMP(3),

    CONSTRAINT "haj_umrah_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "haj_umrah_booking_packages" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "haj_umrah_booking_packages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "settings_type_idx" ON "settings"("type");

-- CreateIndex
CREATE UNIQUE INDEX "settings_type_value_key" ON "settings"("type", "value");

-- CreateIndex
CREATE INDEX "documents_entity_type_entity_id_idx" ON "documents"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_number_key" ON "tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "ticket_adjustments_ticket_id_idx" ON "ticket_adjustments"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "visas_visa_number_key" ON "visas"("visa_number");

-- CreateIndex
CREATE INDEX "expenses_employee_id_idx" ON "expenses"("employee_id");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_status_idx" ON "expenses"("status");

-- CreateIndex
CREATE INDEX "payables_ticket_id_idx" ON "payables"("ticket_id");

-- CreateIndex
CREATE INDEX "payables_visa_id_idx" ON "payables"("visa_id");

-- CreateIndex
CREATE INDEX "payables_haj_umrah_booking_id_idx" ON "payables"("haj_umrah_booking_id");

-- CreateIndex
CREATE INDEX "payments_ticket_id_idx" ON "payments"("ticket_id");

-- CreateIndex
CREATE INDEX "payments_visa_id_idx" ON "payments"("visa_id");

-- CreateIndex
CREATE INDEX "payments_haj_umrah_booking_id_idx" ON "payments"("haj_umrah_booking_id");

-- CreateIndex
CREATE INDEX "receipts_payment_id_idx" ON "receipts"("payment_id");

-- CreateIndex
CREATE INDEX "haj_umrah_campaigns_month_idx" ON "haj_umrah_campaigns"("month");

-- CreateIndex
CREATE INDEX "haj_umrah_campaigns_date_idx" ON "haj_umrah_campaigns"("date");

-- CreateIndex
CREATE INDEX "haj_umrah_campaigns_leader_id_idx" ON "haj_umrah_campaigns"("leader_id");

-- CreateIndex
CREATE INDEX "haj_umrah_packages_type_idx" ON "haj_umrah_packages"("type");

-- CreateIndex
CREATE INDEX "haj_umrah_packages_is_active_idx" ON "haj_umrah_packages"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "haj_umrah_bookings_track_number_key" ON "haj_umrah_bookings"("track_number");

-- CreateIndex
CREATE INDEX "haj_umrah_bookings_campaign_id_idx" ON "haj_umrah_bookings"("campaign_id");

-- CreateIndex
CREATE INDEX "haj_umrah_bookings_customer_id_idx" ON "haj_umrah_bookings"("customer_id");

-- CreateIndex
CREATE INDEX "haj_umrah_bookings_month_idx" ON "haj_umrah_bookings"("month");

-- CreateIndex
CREATE INDEX "haj_umrah_bookings_status_idx" ON "haj_umrah_bookings"("status");

-- CreateIndex
CREATE INDEX "haj_umrah_booking_packages_booking_id_idx" ON "haj_umrah_booking_packages"("booking_id");

-- CreateIndex
CREATE INDEX "haj_umrah_booking_packages_package_id_idx" ON "haj_umrah_booking_packages"("package_id");

-- CreateIndex
CREATE UNIQUE INDEX "haj_umrah_booking_packages_booking_id_package_id_key" ON "haj_umrah_booking_packages"("booking_id", "package_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_adjustments" ADD CONSTRAINT "ticket_adjustments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visas" ADD CONSTRAINT "visas_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payables" ADD CONSTRAINT "payables_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payables" ADD CONSTRAINT "payables_visa_id_fkey" FOREIGN KEY ("visa_id") REFERENCES "visas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payables" ADD CONSTRAINT "payables_haj_umrah_booking_id_fkey" FOREIGN KEY ("haj_umrah_booking_id") REFERENCES "haj_umrah_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_visa_id_fkey" FOREIGN KEY ("visa_id") REFERENCES "visas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_haj_umrah_booking_id_fkey" FOREIGN KEY ("haj_umrah_booking_id") REFERENCES "haj_umrah_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "haj_umrah_campaigns" ADD CONSTRAINT "haj_umrah_campaigns_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "haj_umrah_bookings" ADD CONSTRAINT "haj_umrah_bookings_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "haj_umrah_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "haj_umrah_bookings" ADD CONSTRAINT "haj_umrah_bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "haj_umrah_booking_packages" ADD CONSTRAINT "haj_umrah_booking_packages_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "haj_umrah_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "haj_umrah_booking_packages" ADD CONSTRAINT "haj_umrah_booking_packages_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "haj_umrah_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed: Admin role, permissions, role_permissions, and initial admin user (change password after first login)
INSERT INTO "roles" ("id", "name", "description", "created_at", "updated_at") VALUES
('role_admin_000000000001', 'Admin', 'Full system access.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "permissions" ("id", "code", "name", "resource", "action", "created_at") VALUES
('perm_dashboard_view', 'dashboard.view', 'View Dashboard', 'dashboard', 'view', CURRENT_TIMESTAMP),
('perm_tickets_view', 'tickets.view', 'View Tickets', 'tickets', 'view', CURRENT_TIMESTAMP),
('perm_tickets_create', 'tickets.create', 'Create Tickets', 'tickets', 'create', CURRENT_TIMESTAMP),
('perm_tickets_edit', 'tickets.edit', 'Edit Tickets', 'tickets', 'edit', CURRENT_TIMESTAMP),
('perm_tickets_delete', 'tickets.delete', 'Delete Tickets', 'tickets', 'delete', CURRENT_TIMESTAMP),
('perm_visas_view', 'visas.view', 'View Visas', 'visas', 'view', CURRENT_TIMESTAMP),
('perm_visas_create', 'visas.create', 'Create Visas', 'visas', 'create', CURRENT_TIMESTAMP),
('perm_visas_edit', 'visas.edit', 'Edit Visas', 'visas', 'edit', CURRENT_TIMESTAMP),
('perm_visas_delete', 'visas.delete', 'Delete Visas', 'visas', 'delete', CURRENT_TIMESTAMP),
('perm_expenses_view', 'expenses.view', 'View Expenses', 'expenses', 'view', CURRENT_TIMESTAMP),
('perm_expenses_create', 'expenses.create', 'Create Expenses', 'expenses', 'create', CURRENT_TIMESTAMP),
('perm_expenses_edit', 'expenses.edit', 'Edit Expenses', 'expenses', 'edit', CURRENT_TIMESTAMP),
('perm_expenses_delete', 'expenses.delete', 'Delete Expenses', 'expenses', 'delete', CURRENT_TIMESTAMP),
('perm_expenses_approve', 'expenses.approve', 'Approve Expenses', 'expenses', 'approve', CURRENT_TIMESTAMP),
('perm_receivables_view', 'receivables.view', 'View Receivables', 'receivables', 'view', CURRENT_TIMESTAMP),
('perm_receivables_create', 'receivables.create', 'Create Receivables', 'receivables', 'create', CURRENT_TIMESTAMP),
('perm_receivables_edit', 'receivables.edit', 'Edit Receivables', 'receivables', 'edit', CURRENT_TIMESTAMP),
('perm_receivables_delete', 'receivables.delete', 'Delete Receivables', 'receivables', 'delete', CURRENT_TIMESTAMP),
('perm_payables_view', 'payables.view', 'View Payables', 'payables', 'view', CURRENT_TIMESTAMP),
('perm_payables_create', 'payables.create', 'Create Payables', 'payables', 'create', CURRENT_TIMESTAMP),
('perm_payables_edit', 'payables.edit', 'Edit Payables', 'payables', 'edit', CURRENT_TIMESTAMP),
('perm_payables_delete', 'payables.delete', 'Delete Payables', 'payables', 'delete', CURRENT_TIMESTAMP),
('perm_payments_view', 'payments.view', 'View Payments', 'payments', 'view', CURRENT_TIMESTAMP),
('perm_payments_create', 'payments.create', 'Create Payments', 'payments', 'create', CURRENT_TIMESTAMP),
('perm_payments_edit', 'payments.edit', 'Edit Payments', 'payments', 'edit', CURRENT_TIMESTAMP),
('perm_payments_delete', 'payments.delete', 'Delete Payments', 'payments', 'delete', CURRENT_TIMESTAMP),
('perm_users_view', 'users.view', 'View Users', 'users', 'view', CURRENT_TIMESTAMP),
('perm_users_create', 'users.create', 'Create Users', 'users', 'create', CURRENT_TIMESTAMP),
('perm_users_edit', 'users.edit', 'Edit Users', 'users', 'edit', CURRENT_TIMESTAMP),
('perm_users_delete', 'users.delete', 'Delete Users', 'users', 'delete', CURRENT_TIMESTAMP),
('perm_roles_view', 'roles.view', 'View Roles', 'roles', 'view', CURRENT_TIMESTAMP),
('perm_roles_create', 'roles.create', 'Create Roles', 'roles', 'create', CURRENT_TIMESTAMP),
('perm_roles_edit', 'roles.edit', 'Edit Roles', 'roles', 'edit', CURRENT_TIMESTAMP),
('perm_roles_delete', 'roles.delete', 'Delete Roles', 'roles', 'delete', CURRENT_TIMESTAMP),
('perm_documents_view', 'documents.view', 'View Documents', 'documents', 'view', CURRENT_TIMESTAMP),
('perm_documents_upload', 'documents.upload', 'Upload Documents', 'documents', 'upload', CURRENT_TIMESTAMP),
('perm_documents_delete', 'documents.delete', 'Delete Documents', 'documents', 'delete', CURRENT_TIMESTAMP),
('perm_settings_view', 'settings.view', 'View Settings', 'settings', 'view', CURRENT_TIMESTAMP),
('perm_settings_edit', 'settings.edit', 'Edit Settings', 'settings', 'edit', CURRENT_TIMESTAMP),
('perm_customers_view', 'customers.view', 'View Customers', 'customers', 'view', CURRENT_TIMESTAMP),
('perm_customers_create', 'customers.create', 'Create Customers', 'customers', 'create', CURRENT_TIMESTAMP),
('perm_customers_edit', 'customers.edit', 'Edit Customers', 'customers', 'edit', CURRENT_TIMESTAMP),
('perm_customers_delete', 'customers.delete', 'Delete Customers', 'customers', 'delete', CURRENT_TIMESTAMP),
('perm_haj_umrah_view', 'haj_umrah.view', 'View Haj & Umrah', 'haj_umrah', 'view', CURRENT_TIMESTAMP),
('perm_haj_umrah_create', 'haj_umrah.create', 'Create Haj & Umrah', 'haj_umrah', 'create', CURRENT_TIMESTAMP),
('perm_haj_umrah_edit', 'haj_umrah.edit', 'Edit Haj & Umrah', 'haj_umrah', 'edit', CURRENT_TIMESTAMP),
('perm_haj_umrah_delete', 'haj_umrah.delete', 'Delete Haj & Umrah', 'haj_umrah', 'delete', CURRENT_TIMESTAMP),
('perm_haj_umrah_leader', 'haj_umrah.leader', 'Campaign Leader', 'haj_umrah', 'leader', CURRENT_TIMESTAMP);

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT 'role_admin_000000000001', id FROM "permissions";

INSERT INTO "users" ("id", "email", "password_hash", "name", "role_id", "is_active", "created_at", "updated_at") VALUES
('user_admin_000000000001', 'admin@daybah.com', '$2a$12$eFmEQLeG8nZHqlf.RI4UQOrE87TIRBaGAWmloptxniG5abIB0dMJ6', 'Admin', 'role_admin_000000000001', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

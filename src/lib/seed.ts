import { prisma } from "./db";

const PERMISSIONS = [
  { code: "dashboard.view", name: "View Dashboard", resource: "dashboard", action: "view" },
  { code: "tickets.view", name: "View Tickets", resource: "tickets", action: "view" },
  { code: "tickets.create", name: "Create Tickets", resource: "tickets", action: "create" },
  { code: "tickets.edit", name: "Edit Tickets", resource: "tickets", action: "edit" },
  { code: "tickets.delete", name: "Delete Tickets", resource: "tickets", action: "delete" },
  { code: "visas.view", name: "View Visas", resource: "visas", action: "view" },
  { code: "visas.create", name: "Create Visas", resource: "visas", action: "create" },
  { code: "visas.edit", name: "Edit Visas", resource: "visas", action: "edit" },
  { code: "visas.delete", name: "Delete Visas", resource: "visas", action: "delete" },
  { code: "expenses.view", name: "View Expenses", resource: "expenses", action: "view" },
  { code: "expenses.create", name: "Create Expenses", resource: "expenses", action: "create" },
  { code: "expenses.edit", name: "Edit Expenses", resource: "expenses", action: "edit" },
  { code: "expenses.delete", name: "Delete Expenses", resource: "expenses", action: "delete" },
  { code: "expenses.approve", name: "Approve Expenses", resource: "expenses", action: "approve" },
  { code: "receivables.view", name: "View Receivables", resource: "receivables", action: "view" },
  { code: "receivables.create", name: "Create Receivables", resource: "receivables", action: "create" },
  { code: "receivables.edit", name: "Edit Receivables", resource: "receivables", action: "edit" },
  { code: "receivables.delete", name: "Delete Receivables", resource: "receivables", action: "delete" },
  { code: "payables.view", name: "View Payables", resource: "payables", action: "view" },
  { code: "payables.create", name: "Create Payables", resource: "payables", action: "create" },
  { code: "payables.edit", name: "Edit Payables", resource: "payables", action: "edit" },
  { code: "payables.approve", name: "Approve Payable Payments", resource: "payables", action: "approve" },
  { code: "payables.delete", name: "Delete Payables", resource: "payables", action: "delete" },
  { code: "payments.view", name: "View Payments", resource: "payments", action: "view" },
  { code: "payments.create", name: "Create Payments", resource: "payments", action: "create" },
  { code: "payments.edit", name: "Edit Payments", resource: "payments", action: "edit" },
  { code: "payments.delete", name: "Delete Payments", resource: "payments", action: "delete" },
  { code: "users.view", name: "View Users", resource: "users", action: "view" },
  { code: "users.create", name: "Create Users", resource: "users", action: "create" },
  { code: "users.edit", name: "Edit Users", resource: "users", action: "edit" },
  { code: "users.delete", name: "Delete Users", resource: "users", action: "delete" },
  { code: "roles.view", name: "View Roles", resource: "roles", action: "view" },
  { code: "roles.create", name: "Create Roles", resource: "roles", action: "create" },
  { code: "roles.edit", name: "Edit Roles", resource: "roles", action: "edit" },
  { code: "roles.delete", name: "Delete Roles", resource: "roles", action: "delete" },
  { code: "documents.view", name: "View Documents", resource: "documents", action: "view" },
  { code: "documents.upload", name: "Upload Documents", resource: "documents", action: "upload" },
  { code: "documents.delete", name: "Delete Documents", resource: "documents", action: "delete" },
  { code: "settings.view", name: "View Settings", resource: "settings", action: "view" },
  { code: "settings.edit", name: "Edit Settings", resource: "settings", action: "edit" },
  { code: "customers.view", name: "View Customers", resource: "customers", action: "view" },
  { code: "customers.create", name: "Create Customers", resource: "customers", action: "create" },
  { code: "customers.edit", name: "Edit Customers", resource: "customers", action: "edit" },
  { code: "customers.delete", name: "Delete Customers", resource: "customers", action: "delete" },
];

export async function ensureSeed() {
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      create: p,
      update: p,
    });
  }

  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    create: {
      name: "Admin",
      description: "Full system access. Can manage users, roles, and permissions.",
    },
    update: {},
  });

  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id },
      },
      create: { roleId: adminRole.id, permissionId: perm.id },
      update: {},
    });
  }

  return adminRole;
}

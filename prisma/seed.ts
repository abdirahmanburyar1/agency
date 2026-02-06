import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// All system permissions - every feature has view/create/edit/delete
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
  { code: "expenses.paid", name: "Mark Expenses as Paid", resource: "expenses", action: "paid" },
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
  { code: "haj_umrah.view", name: "View Haj & Umrah", resource: "haj_umrah", action: "view" },
  { code: "haj_umrah.create", name: "Create Haj & Umrah", resource: "haj_umrah", action: "create" },
  { code: "haj_umrah.edit", name: "Edit Haj & Umrah", resource: "haj_umrah", action: "edit" },
  { code: "haj_umrah.delete", name: "Delete Haj & Umrah", resource: "haj_umrah", action: "delete" },
  { code: "haj_umrah.leader", name: "Campaign Leader", resource: "haj_umrah", action: "leader" },
];

async function main() {
  // Create permissions
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      create: p,
      update: p,
    });
  }

  // Create Admin role with ALL permissions
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

  // Campaign Leader role: only haj_umrah.leader (see own campaigns only; uses /leader app)
  const leaderPerm = await prisma.permission.findUnique({ where: { code: "haj_umrah.leader" } });
  if (leaderPerm) {
    const campaignLeaderRole = await prisma.role.upsert({
      where: { name: "Campaign Leader" },
      create: {
        name: "Campaign Leader",
        description: "See and manage only campaigns where they are assigned as leader. Tablet-friendly, no dashboard.",
      },
      update: {},
    });
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: campaignLeaderRole.id, permissionId: leaderPerm.id },
      },
      create: { roleId: campaignLeaderRole.id, permissionId: leaderPerm.id },
      update: {},
    });
  }

  // Expense Initiator: create expenses only
  const expenseCreatePerm = await prisma.permission.findUnique({ where: { code: "expenses.create" } });
  const expenseViewPerm = await prisma.permission.findUnique({ where: { code: "expenses.view" } });
  if (expenseCreatePerm && expenseViewPerm) {
    const expenseInitiatorRole = await prisma.role.upsert({
      where: { name: "Expense Initiator" },
      create: {
        name: "Expense Initiator",
        description: "Can create and view expenses. Cannot approve or mark as paid.",
      },
      update: {},
    });
    for (const perm of [expenseViewPerm, expenseCreatePerm]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: expenseInitiatorRole.id, permissionId: perm.id } },
        create: { roleId: expenseInitiatorRole.id, permissionId: perm.id },
        update: {},
      });
    }
  }

  // General Manager: approve expenses
  const expenseApprovePerm = await prisma.permission.findUnique({ where: { code: "expenses.approve" } });
  if (expenseApprovePerm && expenseViewPerm) {
    const generalManagerRole = await prisma.role.upsert({
      where: { name: "General Manager" },
      create: {
        name: "General Manager",
        description: "Can view and approve expenses. Cannot mark as paid.",
      },
      update: {},
    });
    for (const perm of [expenseViewPerm!, expenseApprovePerm]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: generalManagerRole.id, permissionId: perm.id } },
        create: { roleId: generalManagerRole.id, permissionId: perm.id },
        update: {},
      });
    }
  }

  // Finance: mark expenses as paid
  const expensePaidPerm = await prisma.permission.findUnique({ where: { code: "expenses.paid" } });
  if (expensePaidPerm && expenseViewPerm) {
    const financeRole = await prisma.role.upsert({
      where: { name: "Finance" },
      create: {
        name: "Finance",
        description: "Can view expenses and mark approved expenses as paid.",
      },
      update: {},
    });
    for (const perm of [expenseViewPerm!, expensePaidPerm]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: financeRole.id, permissionId: perm.id } },
        create: { roleId: financeRole.id, permissionId: perm.id },
        update: {},
      });
    }
  }

  // Optional: Create initial admin via env vars (e.g. for quick dev setup)
  // Otherwise use /setup page to create the first admin
  const userCount = await prisma.user.count();
  if (userCount === 0 && process.env.ADMIN_INITIAL_EMAIL && process.env.ADMIN_INITIAL_PASSWORD) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD, 12);
    await prisma.user.create({
      data: {
        email: process.env.ADMIN_INITIAL_EMAIL,
        passwordHash,
        name: "Admin",
        roleId: adminRole.id,
      },
    });
    console.log("Created initial admin user from env.");
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

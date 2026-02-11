import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_TENANT_ID = "cldefault00000000000000001";
const DAYBAH_TENANT_ID = "cldaybah00000000000000001";

// Subscription Plans
const SUBSCRIPTION_PLANS = [
  {
    name: "starter",
    displayName: "Starter",
    description: "Perfect for small businesses just getting started",
    price: 29.99,
    billingInterval: "monthly",
    maxUsers: 5,
    maxStorage: 10, // GB
    trialDays: 14,
    setupFee: 0,
    sortOrder: 1,
    features: JSON.stringify([
      "Up to 5 users",
      "10GB storage",
      "Basic reporting",
      "Email support",
      "Mobile app access"
    ])
  },
  {
    name: "professional",
    displayName: "Professional",
    description: "For growing businesses with advanced needs",
    price: 79.99,
    billingInterval: "monthly",
    maxUsers: 20,
    maxStorage: 50, // GB
    trialDays: 14,
    setupFee: 0,
    sortOrder: 2,
    features: JSON.stringify([
      "Up to 20 users",
      "50GB storage",
      "Advanced reporting & analytics",
      "Priority email & phone support",
      "API access",
      "Custom branding",
      "Multi-currency support"
    ])
  },
  {
    name: "enterprise",
    displayName: "Enterprise",
    description: "For large organizations with custom requirements",
    price: 199.99,
    billingInterval: "monthly",
    maxUsers: null, // Unlimited
    maxStorage: null, // Unlimited
    trialDays: 30,
    setupFee: 499,
    sortOrder: 3,
    features: JSON.stringify([
      "Unlimited users",
      "Unlimited storage",
      "Advanced security features",
      "Dedicated account manager",
      "24/7 phone & chat support",
      "Custom integrations",
      "SLA guarantee",
      "Training & onboarding",
      "Custom domain mapping"
    ])
  }
];

/** Ensure tenant exists, create if not (for fresh DB) */
async function ensureTenant(id: string, subdomain: string, name: string) {
  await prisma.tenant.upsert({
    where: { id },
    create: { id, subdomain, name, status: "active" },
    update: {},
  });
}

/** Upsert role for a tenant */
function roleUpsert(tenantId: string, name: string, description: string) {
  return prisma.role.upsert({
    where: { tenantId_name: { tenantId, name } },
    create: { tenantId, name, description },
    update: {},
  });
}

// All system permissions - every feature has view/create/edit/delete
const PERMISSIONS = [
  { code: "dashboard.view", name: "View Dashboard", resource: "dashboard", action: "view" },
  { code: "reports.view", name: "View Reports", resource: "reports", action: "view" },
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
  { code: "payments.view_all", name: "View All Payments", resource: "payments", action: "view_all" },
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
  { code: "cargo.view", name: "View Cargo", resource: "cargo", action: "view" },
  { code: "cargo.view_all", name: "View All Cargo", resource: "cargo", action: "view_all" },
  { code: "cargo.create", name: "Create Cargo", resource: "cargo", action: "create" },
  { code: "cargo.edit", name: "Edit Cargo", resource: "cargo", action: "edit" },
  { code: "cargo.delete", name: "Delete Cargo", resource: "cargo", action: "delete" },
];

async function main() {
  await ensureTenant(DEFAULT_TENANT_ID, "default", "Default Tenant");
  await ensureTenant(DAYBAH_TENANT_ID, "daybah", "Daybah Travel Agency");

  // Create permissions
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      create: p,
      update: p,
    });
  }

  const allPermissions = await prisma.permission.findMany();

  // Seed roles for both default (platform admin) and Daybah (main app)
  for (const tenantId of [DEFAULT_TENANT_ID, DAYBAH_TENANT_ID]) {
    const adminRole = await roleUpsert(
      tenantId,
      "Admin",
      "Full system access. Can manage users, roles, and permissions."
    );
    for (const perm of allPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
        create: { roleId: adminRole.id, permissionId: perm.id },
        update: {},
      });
    }

    const leaderPerm = await prisma.permission.findUnique({ where: { code: "haj_umrah.leader" } });
    if (leaderPerm) {
      const campaignLeaderRole = await roleUpsert(
        tenantId,
        "Campaign Leader",
        "See and manage only campaigns where they are assigned as leader. Tablet-friendly, no dashboard."
      );
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: campaignLeaderRole.id, permissionId: leaderPerm.id } },
        create: { roleId: campaignLeaderRole.id, permissionId: leaderPerm.id },
        update: {},
      });
    }

    const expenseCreatePerm = await prisma.permission.findUnique({ where: { code: "expenses.create" } });
    const expenseViewPerm = await prisma.permission.findUnique({ where: { code: "expenses.view" } });
    if (expenseCreatePerm && expenseViewPerm) {
      const expenseInitiatorRole = await roleUpsert(
        tenantId,
        "Expense Initiator",
        "Can create and view expenses. Cannot approve or mark as paid."
      );
      for (const perm of [expenseViewPerm, expenseCreatePerm]) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: expenseInitiatorRole.id, permissionId: perm.id } },
          create: { roleId: expenseInitiatorRole.id, permissionId: perm.id },
          update: {},
        });
      }
    }

    const expenseApprovePerm = await prisma.permission.findUnique({ where: { code: "expenses.approve" } });
    const expenseViewPermGM = await prisma.permission.findUnique({ where: { code: "expenses.view" } });
    if (expenseApprovePerm && expenseViewPermGM) {
      const generalManagerRole = await roleUpsert(
        tenantId,
        "General Manager",
        "Can view and approve expenses. Cannot mark as paid."
      );
      for (const perm of [expenseViewPermGM, expenseApprovePerm]) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: generalManagerRole.id, permissionId: perm.id } },
          create: { roleId: generalManagerRole.id, permissionId: perm.id },
          update: {},
        });
      }
    }

    const cargoViewPerm = await prisma.permission.findUnique({ where: { code: "cargo.view" } });
    const cargoCreatePerm = await prisma.permission.findUnique({ where: { code: "cargo.create" } });
    const cargoEditPerm = await prisma.permission.findUnique({ where: { code: "cargo.edit" } });
    if (cargoViewPerm && cargoCreatePerm && cargoEditPerm) {
      const cargoSectionRole = await roleUpsert(
        tenantId,
        "Cargo Section",
        "Cargo operations for assigned branch. View payment only from cargo detail, no Payments page."
      );
      for (const perm of [cargoViewPerm, cargoCreatePerm, cargoEditPerm]) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: cargoSectionRole.id, permissionId: perm.id } },
          create: { roleId: cargoSectionRole.id, permissionId: perm.id },
          update: {},
        });
      }
    }

    const paymentsViewPerm = await prisma.permission.findUnique({ where: { code: "payments.view" } });
    const paymentsViewAllPerm = await prisma.permission.findUnique({ where: { code: "payments.view_all" } });
    if (paymentsViewPerm) {
      const branchFinanceRole = await roleUpsert(
        tenantId,
        "Branch Finance",
        "View payments for their branch/location only. Assign location & branch to the user."
      );
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: branchFinanceRole.id, permissionId: paymentsViewPerm.id } },
        create: { roleId: branchFinanceRole.id, permissionId: paymentsViewPerm.id },
        update: {},
      });
    }

    const expensePaidPerm = await prisma.permission.findUnique({ where: { code: "expenses.paid" } });
    const expenseViewPermFin = await prisma.permission.findUnique({ where: { code: "expenses.view" } });
    if (expensePaidPerm && expenseViewPermFin) {
      const financeRole = await roleUpsert(
        tenantId,
        "Finance",
        "Central finance: view all payments, expenses, mark expenses paid."
      );
      const paymentsViewPermFin = await prisma.permission.findUnique({ where: { code: "payments.view" } });
      const perms = [expenseViewPermFin, expensePaidPerm];
      if (paymentsViewPermFin) perms.push(paymentsViewPermFin);
      if (paymentsViewAllPerm) perms.push(paymentsViewAllPerm);
      for (const perm of perms) {
        if (!perm) continue;
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: financeRole.id, permissionId: perm.id } },
          create: { roleId: financeRole.id, permissionId: perm.id },
          update: {},
        });
      }
    }
  }

  // Optional: Create initial admin via env vars (for Daybah tenant)
  const userCount = await prisma.user.count();
  if (userCount === 0 && process.env.ADMIN_INITIAL_EMAIL && process.env.ADMIN_INITIAL_PASSWORD) {
    const adminRole = await prisma.role.findUnique({
      where: { tenantId_name: { tenantId: DAYBAH_TENANT_ID, name: "Admin" } },
    });
    if (adminRole) {
      const passwordHash = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD, 12);
      await prisma.user.create({
        data: {
          email: process.env.ADMIN_INITIAL_EMAIL,
          passwordHash,
          name: "Admin",
          roleId: adminRole.id,
          tenantId: DAYBAH_TENANT_ID,
        },
      });
      console.log("Created initial admin user from env.");
    }
  }

  // Seed subscription plans
  console.log("Seeding subscription plans...");
  for (const plan of SUBSCRIPTION_PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      create: plan,
      update: {
        displayName: plan.displayName,
        description: plan.description,
        price: plan.price,
        billingInterval: plan.billingInterval,
        maxUsers: plan.maxUsers,
        maxStorage: plan.maxStorage,
        trialDays: plan.trialDays,
        setupFee: plan.setupFee,
        sortOrder: plan.sortOrder,
        features: plan.features,
      },
    });
  }
  console.log(`Created/updated ${SUBSCRIPTION_PLANS.length} subscription plans.`);

  // Create trial subscriptions for existing tenants
  console.log("Creating trial subscriptions for existing tenants...");
  const tenantsWithoutSub = await prisma.tenant.findMany({
    where: {
      subscriptions: {
        none: {},
      },
    },
  });

  const starterPlan = await prisma.subscriptionPlan.findUnique({
    where: { name: "starter" },
  });

  if (starterPlan && tenantsWithoutSub.length > 0) {
    for (const tenant of tenantsWithoutSub) {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + (starterPlan.trialDays || 14));

      await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: starterPlan.id,
          status: "trial",
          startDate: now,
          trialEndDate: trialEnd,
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          autoRenew: true,
        },
      });
    }
    console.log(`Created trial subscriptions for ${tenantsWithoutSub.length} tenants.`);
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

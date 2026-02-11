import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAYBAH_TENANT_ID = "cldaybah00000000000000001";

async function assignDataToDaybah() {
  try {
    console.log("🔄 Starting data assignment to Daybah tenant...\n");
    console.log(`Target Tenant ID: ${DAYBAH_TENANT_ID}\n`);

    // Verify Daybah tenant exists
    const daybahTenant = await prisma.tenant.findUnique({
      where: { id: DAYBAH_TENANT_ID },
    });

    if (!daybahTenant) {
      console.error("❌ ERROR: Daybah tenant not found!");
      console.log("Available tenants:");
      const tenants = await prisma.tenant.findMany();
      tenants.forEach((t) => console.log(`  - ${t.subdomain}: ${t.id}`));
      return;
    }

    console.log(`✅ Found tenant: ${daybahTenant.name} (${daybahTenant.subdomain})\n`);

    let totalUpdated = 0;

    // 1. Update Customers
    console.log("📋 Updating Customers...");
    const customersResult = await prisma.customer.updateMany({
      where: {
        tenantId: { not: DAYBAH_TENANT_ID },
      },
      data: { tenantId: DAYBAH_TENANT_ID },
    });
    console.log(`   Updated ${customersResult.count} customers`);
    totalUpdated += customersResult.count;

    // 2. Update Employees
    console.log("👥 Updating Employees...");
    const employeesResult = await prisma.employee.updateMany({
      where: { tenantId: { not: DAYBAH_TENANT_ID } },
      data: { tenantId: DAYBAH_TENANT_ID },
    });
    console.log(`   Updated ${employeesResult.count} employees`);
    totalUpdated += employeesResult.count;

    // 3. Update Tickets
    console.log("🎫 Updating Tickets...");
    const ticketsResult = await prisma.ticket.updateMany({
      where: { tenantId: { not: DAYBAH_TENANT_ID } },
      data: { tenantId: DAYBAH_TENANT_ID },
    });
    console.log(`   Updated ${ticketsResult.count} tickets`);
    totalUpdated += ticketsResult.count;

    // 4. Update Visas
    console.log("📄 Updating Visas...");
    const visasResult = await prisma.visa.updateMany({
      where: { tenantId: { not: DAYBAH_TENANT_ID } },
      data: { tenantId: DAYBAH_TENANT_ID },
    });
    console.log(`   Updated ${visasResult.count} visas`);
    totalUpdated += visasResult.count;

    // 5. Update Haj Umrah Campaigns
    console.log("🕌 Updating Haj/Umrah Campaigns...");
    const campaignsResult = await prisma.hajUmrahCampaign.updateMany({
      where: { tenantId: { not: DAYBAH_TENANT_ID } },
      data: { tenantId: DAYBAH_TENANT_ID },
    });
    console.log(`   Updated ${campaignsResult.count} campaigns`);
    totalUpdated += campaignsResult.count;

    // 6. Update Haj Umrah Packages
    console.log("📦 Updating Haj/Umrah Packages...");
    const packagesResult = await prisma.hajUmrahPackage.updateMany({
      where: { tenantId: { not: DAYBAH_TENANT_ID } },
      data: { tenantId: DAYBAH_TENANT_ID },
    });
    console.log(`   Updated ${packagesResult.count} packages`);
    totalUpdated += packagesResult.count;

    // 7. Update Haj Umrah Bookings
    console.log("📝 Updating Haj/Umrah Bookings...");
    const bookingsResult = await prisma.hajUmrahBooking.updateMany({
      where: { tenantId: { not: DAYBAH_TENANT_ID } },
      data: { tenantId: DAYBAH_TENANT_ID },
    });
    console.log(`   Updated ${bookingsResult.count} bookings`);
    totalUpdated += bookingsResult.count;

    // 8. Update Payments
    console.log("💰 Updating Payments...");
    const paymentsResult = await prisma.payment.updateMany({
      where: { tenantId: { not: DAYBAH_TENANT_ID } },
      data: { tenantId: DAYBAH_TENANT_ID },
    });
    console.log(`   Updated ${paymentsResult.count} payments`);
    totalUpdated += paymentsResult.count;

    // 9. Update Payables
    console.log("💸 Updating Payables...");
    const payablesResult = await prisma.payable.updateMany({
      where: { tenantId: { not: DAYBAH_TENANT_ID } },
      data: { tenantId: DAYBAH_TENANT_ID },
    });
    console.log(`   Updated ${payablesResult.count} payables`);
    totalUpdated += payablesResult.count;

    // 10. Update Expenses
    console.log("🧾 Updating Expenses...");
    const expensesResult = await prisma.expense.updateMany({
      where: { tenantId: { not: DAYBAH_TENANT_ID } },
      data: { tenantId: DAYBAH_TENANT_ID },
    });
    console.log(`   Updated ${expensesResult.count} expenses`);
    totalUpdated += expensesResult.count;

    // 11. Update Roles (handle unique constraint carefully)
    console.log("🔐 Updating Roles...");
    const otherRoles = await prisma.role.findMany({
      where: { tenantId: { not: DAYBAH_TENANT_ID } },
    });
    const daybahRoleNames = await prisma.role.findMany({
      where: { tenantId: DAYBAH_TENANT_ID },
      select: { name: true },
    });
    const daybahRoleNameSet = new Set(daybahRoleNames.map((r) => r.name));
    
    let rolesUpdated = 0;
    for (const role of otherRoles) {
      if (!daybahRoleNameSet.has(role.name)) {
        // Safe to update - no name conflict
        await prisma.role.update({
          where: { id: role.id },
          data: { tenantId: DAYBAH_TENANT_ID },
        });
        rolesUpdated++;
      } else {
        // Skip - would create duplicate
        console.log(`   ⚠️  Skipping role "${role.name}" (already exists in Daybah)`);
      }
    }
    console.log(`   Updated ${rolesUpdated} roles (${otherRoles.length - rolesUpdated} skipped)`);
    totalUpdated += rolesUpdated;

    // 12. Update Settings
    console.log("⚙️  Updating Settings...");
    const settingsResult = await prisma.setting.updateMany({
      where: { tenantId: { not: DAYBAH_TENANT_ID } },
      data: { tenantId: DAYBAH_TENANT_ID },
    });
    console.log(`   Updated ${settingsResult.count} settings`);
    totalUpdated += settingsResult.count;

    // 13. Update Cargo Locations
    console.log("📍 Updating Cargo Locations...");
    const cargoLocationsResult = await prisma.cargoLocation.updateMany({
      where: { tenantId: { not: DAYBAH_TENANT_ID } },
      data: { tenantId: DAYBAH_TENANT_ID },
    });
    console.log(`   Updated ${cargoLocationsResult.count} cargo locations`);
    totalUpdated += cargoLocationsResult.count;

    // 14. Update Cargo Shipments
    console.log("📦 Updating Cargo Shipments...");
    const cargoShipmentsResult = await prisma.cargoShipment.updateMany({
      where: { tenantId: { not: DAYBAH_TENANT_ID } },
      data: { tenantId: DAYBAH_TENANT_ID },
    });
    console.log(`   Updated ${cargoShipmentsResult.count} cargo shipments`);
    totalUpdated += cargoShipmentsResult.count;

    // 15. Update Documents
    console.log("📎 Updating Documents...");
    const documentsResult = await prisma.document.updateMany({
      where: { tenantId: { not: DAYBAH_TENANT_ID } },
      data: { tenantId: DAYBAH_TENANT_ID },
    });
    console.log(`   Updated ${documentsResult.count} documents`);
    totalUpdated += documentsResult.count;

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ DATA ASSIGNMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log(`Total records updated: ${totalUpdated}`);
    console.log(`Assigned to: ${daybahTenant.name} (${daybahTenant.subdomain})`);
    console.log(`Tenant ID: ${DAYBAH_TENANT_ID}\n`);

    // Verify users (should already belong to Daybah)
    console.log("👤 User Status Check:");
    const daybahUsers = await prisma.user.count({
      where: { tenantId: DAYBAH_TENANT_ID },
    });
    const otherUsers = await prisma.user.count({
      where: { tenantId: { not: DAYBAH_TENANT_ID } },
    });
    const noTenantUsers = await prisma.user.count({
      where: { tenantId: null },
    });
    
    console.log(`   Users in Daybah: ${daybahUsers}`);
    console.log(`   Users in other tenants: ${otherUsers}`);
    console.log(`   Users with no tenant: ${noTenantUsers}`);

    if (noTenantUsers > 0 || otherUsers > 0) {
      console.log("\n⚠️  WARNING: Some users are not in Daybah tenant!");
    } else {
      console.log("\n✅ All users belong to Daybah tenant");
    }

  } catch (error) {
    console.error("❌ Error during data assignment:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

assignDataToDaybah();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugAcmeTenant() {
  try {
    console.log("🔍 Debugging ACME Tenant Data Visibility...\n");

    // 1. Find ACME tenant
    const acmeTenant = await prisma.tenant.findFirst({
      where: { subdomain: "acme" },
    });

    if (!acmeTenant) {
      console.log("❌ ACME tenant not found!");
      return;
    }

    console.log("✅ ACME Tenant Found:");
    console.log(`   ID: ${acmeTenant.id}`);
    console.log(`   Name: ${acmeTenant.name}`);
    console.log(`   Subdomain: ${acmeTenant.subdomain}`);
    console.log(`   Status: ${acmeTenant.status}\n`);

    // 2. Find ACME user
    const acmeUser = await prisma.user.findFirst({
      where: { 
        email: "buryar@acme.com"
      },
      include: {
        role: true,
      },
    });

    if (acmeUser) {
      console.log("👤 ACME User:");
      console.log(`   Email: ${acmeUser.email}`);
      console.log(`   User Tenant ID: ${acmeUser.tenantId}`);
      console.log(`   Role: ${acmeUser.role.name}`);
      console.log(`   Role Tenant ID: ${acmeUser.role.tenantId}`);
      console.log(`   Is Platform Admin: ${acmeUser.isPlatformAdmin}\n`);
    }

    // 3. Check data counts for ACME tenant
    console.log("📊 Data Counts for ACME Tenant:");
    console.log("─".repeat(60));

    const [
      customers,
      employees,
      tickets,
      visas,
      campaigns,
      packages,
      bookings,
      payments,
      payables,
      expenses,
      roles,
      users,
    ] = await Promise.all([
      prisma.customer.count({ where: { tenantId: acmeTenant.id } }),
      prisma.employee.count({ where: { tenantId: acmeTenant.id } }),
      prisma.ticket.count({ where: { tenantId: acmeTenant.id } }),
      prisma.visa.count({ where: { tenantId: acmeTenant.id } }),
      prisma.hajUmrahCampaign.count({ where: { tenantId: acmeTenant.id } }),
      prisma.hajUmrahPackage.count({ where: { tenantId: acmeTenant.id } }),
      prisma.hajUmrahBooking.count({ where: { tenantId: acmeTenant.id } }),
      prisma.payment.count({ where: { tenantId: acmeTenant.id } }),
      prisma.payable.count({ where: { tenantId: acmeTenant.id } }),
      prisma.expense.count({ where: { tenantId: acmeTenant.id } }),
      prisma.role.count({ where: { tenantId: acmeTenant.id } }),
      prisma.user.count({ where: { tenantId: acmeTenant.id } }),
    ]);

    console.log(`   Customers: ${customers}`);
    console.log(`   Employees: ${employees}`);
    console.log(`   Tickets: ${tickets}`);
    console.log(`   Visas: ${visas}`);
    console.log(`   Campaigns: ${campaigns}`);
    console.log(`   Packages: ${packages}`);
    console.log(`   Bookings: ${bookings}`);
    console.log(`   Payments: ${payments}`);
    console.log(`   Payables: ${payables}`);
    console.log(`   Expenses: ${expenses}`);
    console.log(`   Roles: ${roles}`);
    console.log(`   Users: ${users}`);

    // 4. Compare with Daybah tenant
    const daybahTenant = await prisma.tenant.findFirst({
      where: { subdomain: "daybah" },
    });

    if (daybahTenant) {
      console.log("\n📊 Data Counts for DAYBAH Tenant (for comparison):");
      console.log("─".repeat(60));

      const [
        daybahCustomers,
        daybahTickets,
        daybahVisas,
        daybahBookings,
        daybahPayments,
      ] = await Promise.all([
        prisma.customer.count({ where: { tenantId: daybahTenant.id } }),
        prisma.ticket.count({ where: { tenantId: daybahTenant.id } }),
        prisma.visa.count({ where: { tenantId: daybahTenant.id } }),
        prisma.hajUmrahBooking.count({ where: { tenantId: daybahTenant.id } }),
        prisma.payment.count({ where: { tenantId: daybahTenant.id } }),
      ]);

      console.log(`   Customers: ${daybahCustomers}`);
      console.log(`   Tickets: ${daybahTickets}`);
      console.log(`   Visas: ${daybahVisas}`);
      console.log(`   Bookings: ${daybahBookings}`);
      console.log(`   Payments: ${daybahPayments}`);
    }

    // 5. Check if user role permissions might be causing the issue
    if (acmeUser) {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId: acmeUser.roleId },
        include: { permission: true },
      });

      console.log(`\n🔑 ACME User Role Permissions (${rolePermissions.length}):`);
      console.log("─".repeat(60));
      rolePermissions.forEach((rp) => {
        console.log(`   - ${rp.permission.name}`);
      });
    }

    // 6. Critical diagnosis
    console.log("\n🔍 DIAGNOSIS:");
    console.log("─".repeat(60));
    
    if (acmeUser && acmeUser.tenantId === acmeTenant.id) {
      console.log("✅ User is correctly assigned to ACME tenant");
    } else if (acmeUser && acmeUser.tenantId !== acmeTenant.id) {
      console.log(`❌ PROBLEM: User tenantId (${acmeUser.tenantId}) does NOT match ACME tenant (${acmeTenant.id})`);
      console.log("   This would cause the user to see data from the wrong tenant!");
    }

    if (customers === 0 && tickets === 0 && visas === 0 && bookings === 0) {
      console.log("✅ ACME tenant has no data (as expected for new tenant)");
    } else {
      console.log("❌ ACME tenant has data - this might indicate a scoping issue");
    }

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

debugAcmeTenant();

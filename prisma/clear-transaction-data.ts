/**
 * Clear tickets, visas, expenses, Haj Umrah (campaigns, bookings, packages),
 * payments, receipts, payables, and related data.
 * Keeps: Settings, Users, Roles, Permissions, Customers, Employees, Documents (non-transaction), Currency rates.
 *
 * Run: npx tsx prisma/clear-transaction-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing transaction data...");

  const receiptCount = await prisma.receipt.deleteMany({});
  console.log(`  Deleted ${receiptCount.count} receipts`);

  const documentCount = await prisma.document.deleteMany({
    where: {
      entityType: { in: ["ticket", "visa", "payment", "receipt", "receivable"] },
    },
  });
  console.log(`  Deleted ${documentCount.count} documents (ticket/visa/payment/receipt)`);

  const paymentCount = await prisma.payment.deleteMany({});
  console.log(`  Deleted ${paymentCount.count} payments`);

  const payablePaymentCount = await prisma.payablePayment.deleteMany({});
  console.log(`  Deleted ${payablePaymentCount.count} payable payments`);

  const payableCount = await prisma.payable.deleteMany({});
  console.log(`  Deleted ${payableCount.count} payables`);

  const bookingPackageCount = await prisma.hajUmrahBookingPackage.deleteMany({});
  console.log(`  Deleted ${bookingPackageCount.count} Haj Umrah booking packages`);

  const bookingCount = await prisma.hajUmrahBooking.deleteMany({});
  console.log(`  Deleted ${bookingCount.count} Haj Umrah bookings`);

  const campaignCount = await prisma.hajUmrahCampaign.deleteMany({});
  console.log(`  Deleted ${campaignCount.count} Haj Umrah campaigns`);

  const visaPriceCount = await prisma.hajUmrahPackageVisaPrice.deleteMany({});
  console.log(`  Deleted ${visaPriceCount.count} Haj Umrah package visa prices`);

  const packageCount = await prisma.hajUmrahPackage.deleteMany({});
  console.log(`  Deleted ${packageCount.count} Haj Umrah packages`);

  const adjustmentCount = await prisma.ticketAdjustment.deleteMany({});
  console.log(`  Deleted ${adjustmentCount.count} ticket adjustments`);

  const ticketCount = await prisma.ticket.deleteMany({});
  console.log(`  Deleted ${ticketCount.count} tickets`);

  const visaCount = await prisma.visa.deleteMany({});
  console.log(`  Deleted ${visaCount.count} visas`);

  const expenseCount = await prisma.expense.deleteMany({});
  console.log(`  Deleted ${expenseCount.count} expenses`);

  console.log("Done. Settings, users, roles, permissions, customers, employees, and currency rates preserved.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

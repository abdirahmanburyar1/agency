import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import DatabaseErrorBanner from "@/components/DatabaseErrorBanner";
import { isDbConnectionError } from "@/lib/db-safe";
import PaymentsTableWithFilters, { type SerializedPayment } from "./PaymentsTableWithFilters";

export default async function PaymentsPage() {
  await requirePermission(PERMISSION.PAYMENTS_VIEW, { redirectOnForbidden: true });

  const paymentsQuery = () =>
    prisma.payment.findMany({
      where: { canceledAt: null },
      orderBy: { paymentDate: "desc" },
      include: {
        ticket: { include: { customer: true } },
        visa: { include: { customerRelation: true } },
        hajUmrahBooking: { include: { customer: true } },
        receipts: true,
      },
    });
  let payments: Awaited<ReturnType<typeof paymentsQuery>>;
  try {
    payments = await paymentsQuery();
  } catch (err) {
    if (isDbConnectionError(err)) {
      return (
        <main className="w-full py-6 sm:py-8">
          <div className="mb-6">
            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
              ← Back
            </Link>
          </div>
          <DatabaseErrorBanner />
        </main>
      );
    }
    throw err;
  }

  const serializedPayments: SerializedPayment[] = payments.map((p) => {
    const totalReceived = p.receipts.reduce((s, r) => s + Number(r.amount), 0);
    const balance = Number(p.amount) - totalReceived;
    const customer = p.ticket?.customer ?? p.visa?.customerRelation ?? p.hajUmrahBooking?.customer;
    const customerName = customer
      ? (customer.phone ? `${customer.name} - ${customer.phone}` : customer.name)
      : (p.ticket?.customerName ?? p.visa?.customer ?? "—");
    const source: SerializedPayment["source"] = p.ticket
      ? "ticket"
      : p.visa
        ? "visa"
        : p.hajUmrahBooking
          ? "haj_umrah"
          : null;
    return {
      id: p.id,
      date: p.date.toISOString(),
      paymentDate: p.paymentDate.toISOString(),
      status: p.status,
      name: p.name,
      description: p.description,
      amount: Number(p.amount),
      expectedDate: p.expectedDate?.toISOString() ?? null,
      source,
      ticketId: p.ticketId,
      visaId: p.visaId,
      hajUmrahBookingId: p.hajUmrahBookingId,
      customerName,
      totalReceived,
      balance,
    };
  });

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Payments</h1>
      </div>
      <PaymentsTableWithFilters payments={serializedPayments} />
    </main>
  );
}

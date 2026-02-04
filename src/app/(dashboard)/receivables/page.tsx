import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import DatabaseErrorBanner from "@/components/DatabaseErrorBanner";
import { isDbConnectionError } from "@/lib/db-safe";

export default async function ReceivablesPage() {
  await requirePermission(PERMISSION.RECEIVABLES_VIEW, { redirectOnForbidden: true });

  let payments: Awaited<ReturnType<typeof prisma.payment.findMany>>;
  try {
    payments = await prisma.payment.findMany({
    where: { canceledAt: null },
    orderBy: { date: "desc" },
    include: {
      ticket: { include: { customer: true } },
      visa: { include: { customerRelation: true } },
      hajUmrahBooking: { include: { customer: true } },
      receipts: true,
    },
  });
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

  const receivables = payments
    .map((p) => {
      const totalReceived = p.receipts.reduce((s, r) => s + Number(r.amount), 0);
      const balance = Number(p.amount) - totalReceived;
      return { ...p, totalReceived, balance };
    })
    .filter((p) => p.balance > 0);

  const totalBalance = receivables.reduce((sum, r) => sum + r.balance, 0);

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Receivables</h1>
      </div>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Outstanding balances from Payment − Receipts (customer amounts not yet paid)
      </p>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Date</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Source</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Name</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">Amount</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">Received</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">Balance</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Credit date</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Action</th>
            </tr>
          </thead>
          <tbody>
            {receivables.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                  No outstanding receivables
                </td>
              </tr>
            ) : (
              receivables.map((r) => {
                const customer = r.ticket?.customer ?? r.visa?.customerRelation ?? r.hajUmrahBooking?.customer;
                const customerName = customer
                  ? (customer.phone ? `${customer.name} - ${customer.phone}` : customer.name)
                  : (r.ticket?.customerName ?? r.visa?.customer ?? r.description?.replace(/^Customer: /, "") ?? "—");
                const sourceLink =
                  r.ticket ? (
                    <Link href="/tickets" className="text-blue-600 hover:underline dark:text-blue-400">
                      Ticket
                    </Link>
                  ) : r.visa ? (
                    <Link href="/visas" className="text-blue-600 hover:underline dark:text-blue-400">
                      Visa
                    </Link>
                  ) : r.hajUmrahBooking ? (
                    <Link href={`/haj-umrah/${r.hajUmrahBooking.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                      Haj & Umrah
                    </Link>
                  ) : (
                    "—"
                  );
                return (
                  <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {sourceLink}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{customerName}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{r.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                      ${Number(r.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                      ${r.totalReceived.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                      ${r.balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {r.status === "credit" && r.expectedDate
                        ? new Date(r.expectedDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/payments/${r.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Record payment
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-zinc-200 bg-zinc-50 font-medium dark:border-zinc-700 dark:bg-zinc-800/50">
              <td colSpan={6} className="px-4 py-3 text-right text-zinc-900 dark:text-white">
                Total balance
              </td>
              <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                ${totalBalance.toLocaleString()}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </main>
  );
}

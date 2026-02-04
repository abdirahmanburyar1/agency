import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission, canAccess } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import PaymentDetailClient from "./PaymentDetailClient";

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSION.PAYMENTS_VIEW, { redirectOnForbidden: true });
  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      ticket: { include: { customer: true } },
      visa: { include: { customerRelation: true } },
      hajUmrahBooking: { include: { customer: true } },
      receipts: { orderBy: { date: "desc" } },
    },
  });

  if (!payment) notFound();

  const totalReceived = payment.receipts.reduce(
    (s, r) => s + Number(r.amount),
    0
  );
  const balance = Number(payment.amount) - totalReceived;
  const customer = payment.ticket?.customer ?? payment.visa?.customerRelation ?? payment.hajUmrahBooking?.customer;
  const customerName = customer
    ? (customer.phone?.trim()
        ? `${customer.name} - ${customer.phone}`
        : customer.name)
    : (payment.ticket?.customerName ?? payment.visa?.customer ?? "—");
  const trackDisplay = payment.hajUmrahBooking?.trackNumber != null
    ? (payment.hajUmrahBooking.trackNumber < 1000
        ? String(payment.hajUmrahBooking.trackNumber).padStart(3, "0")
        : String(payment.hajUmrahBooking.trackNumber))
    : null;

  const [canRecordReceipt, canEditStatus] = await Promise.all([
    canAccess(PERMISSION.PAYMENTS_CREATE),
    canAccess(PERMISSION.PAYMENTS_EDIT),
  ]);

  const statusStyles: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    partial:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    credit: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
    refund: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/payments"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to Payments
        </Link>
        <Link
          href={`/payments/${id}/receipt`}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          View full receipt
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Payment Details
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {payment.name ?? "Payment"} ·{" "}
            {new Date(payment.date).toLocaleDateString()}
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Expected amount
            </p>
            <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
              ${Number(payment.amount).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Received
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              ${totalReceived.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {balance < 0 ? "Refund due" : "Balance"}
            </p>
            <p className={`mt-2 text-2xl font-bold ${balance < 0 ? "text-blue-600 dark:text-blue-400" : "text-zinc-900 dark:text-white"}`}>
              {balance < 0 ? `$${Math.abs(balance).toLocaleString()}` : `$${balance.toLocaleString()}`}
            </p>
            {balance < 0 && (
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">Customer overpaid; refund owed</p>
            )}
          </div>
        </div>

        {/* Payment info & Actions row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="font-semibold text-zinc-900 dark:text-white">
                Payment information
              </h2>
            </div>
            <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <InfoRow
                label="Status"
                value={
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusStyles[payment.status] ?? statusStyles.pending
                    }`}
                  >
                    {payment.status}
                  </span>
                }
              />
              <InfoRow label="Customer" value={customerName} />
              {payment.status === "credit" && payment.expectedDate && (
                <InfoRow
                  label="Expected date"
                  value={new Date(payment.expectedDate).toLocaleDateString()}
                />
              )}
              <InfoRow label="Description" value={payment.description} />
              <InfoRow
                label="Source"
                value={
                  payment.ticket ? (
                    <Link
                      href={`/tickets/${payment.ticket.id}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Ticket · {payment.ticket.airline ?? "—"}
                    </Link>
                  ) : payment.visa ? (
                    <Link
                      href="/visas"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Visa · {payment.visa.country ?? "—"}
                    </Link>
                  ) : payment.hajUmrahBooking ? (
                    <Link
                      href={`/haj-umrah/${payment.hajUmrahBooking.id}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Haj & Umrah{trackDisplay ? ` #${trackDisplay}` : ""}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
            </dl>
          </div>

          {(canRecordReceipt || canEditStatus) && (
            <div className="lg:col-span-1">
              <PaymentDetailClient
                paymentId={payment.id}
                balance={balance}
                customerName={customerName}
                canRecordReceipt={canRecordReceipt}
                canEditStatus={canEditStatus}
              />
            </div>
          )}
        </div>

        {/* Receipts */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-900 dark:text-white">
              Receipts
            </h2>
            {payment.receipts.length > 0 && (
              <Link
                href={`/payments/${id}/receipt`}
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Print all
              </Link>
            )}
          </div>
          {payment.receipts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No receipts yet.
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Record a payment to generate receipts.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {payment.receipts.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-6 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      ${Number(r.amount).toLocaleString()}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(r.date).toLocaleDateString()}
                      {r.pMethod && ` · ${r.pMethod}`}
                      {"receivedBy" in r && r.receivedBy && (
                        <> · {r.receivedBy}</>
                      )}
                    </p>
                  </div>
                  <Link
                    href={`/payments/${id}/receipt?r=${r.id}`}
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                  >
                    Print
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (value == null) return null;
  const display = value === "" ? "—" : value;
  return (
    <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
        {display}
      </dd>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission, canAccess } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import PayableDetailClient from "./PayableDetailClient";
import PayablePaymentList from "./PayablePaymentList";

export default async function PayableDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSION.PAYABLES_VIEW, { redirectOnForbidden: true });
  const { id } = await params;

  const payable = await prisma.payable.findUnique({
    where: { id },
    include: {
      ticket: true,
      visa: true,
      hajUmrahBooking: true,
      payments: { orderBy: { date: "desc" } },
    },
  });

  if (!payable) notFound();
  if (payable.canceledAt) notFound();

  const totalPaid = payable.payments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount), 0);
  const balance = Number(payable.balance);
  const amount = Number(payable.amount);
  const pendingOrApprovedTotal = payable.payments
    .filter((p) => p.status === "pending" || p.status === "approved")
    .reduce((s, p) => s + Number(p.amount), 0);
  const availableForNew = balance - pendingOrApprovedTotal;

  const [canRecordPayment, canApprove, canMarkPaid] = await Promise.all([
    canAccess(PERMISSION.PAYABLES_EDIT),
    canAccess(PERMISSION.PAYABLES_APPROVE),
    canAccess(PERMISSION.PAYABLES_EDIT),
  ]);

  const sourceLabel =
    payable.ticketId && payable.ticket
      ? `Ticket · ${payable.ticket.airline ?? "—"}`
      : payable.visaId && payable.visa
        ? `Visa · ${payable.visa.country ?? "—"}`
        : payable.hajUmrahBookingId
          ? "Haj & Umrah"
          : "—";

  const sourceHref =
    payable.ticketId
      ? `/tickets/${payable.ticketId}`
      : payable.visaId
        ? `/visas/${payable.visaId}`
        : payable.hajUmrahBookingId
          ? `/haj-umrah/${payable.hajUmrahBookingId}`
          : null;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link
          href="/payables"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to Payables
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Payable Details
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {payable.name ?? "Payable"} · Date:{" "}
            {new Date(payable.date).toLocaleDateString()}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Amount due
            </p>
            <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
              ${amount.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Paid
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              ${totalPaid.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/30">
            <p className="text-xs font-medium uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Balance
            </p>
            <p className="mt-2 text-2xl font-bold text-rose-700 dark:text-rose-400">
              ${balance.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="font-semibold text-zinc-900 dark:text-white">
                Payable information
              </h2>
            </div>
            <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Date</dt>
                <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                  {new Date(payable.date).toLocaleDateString()}
                </dd>
              </div>
              <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Source</dt>
                <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                  {sourceHref ? (
                    <Link href={sourceHref} className="text-blue-600 hover:underline dark:text-blue-400">
                      {sourceLabel}
                    </Link>
                  ) : (
                    sourceLabel
                  )}
                </dd>
              </div>
              <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Description</dt>
                <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                  {payable.description ?? "—"}
                </dd>
              </div>
              {payable.deadline && (
                <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Deadline</dt>
                  <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                    {new Date(payable.deadline).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {(canRecordPayment || canApprove || canMarkPaid) && (
            <div className="lg:col-span-1">
              <PayableDetailClient
                payableId={payable.id}
                balance={balance}
                availableForNew={availableForNew}
                payableName={payable.name ?? "Payable"}
                canRecordPayment={canRecordPayment}
                canApprove={canApprove}
                canMarkPaid={canMarkPaid}
                payments={[]}
              />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-900 dark:text-white">
              Payment history
            </h2>
          </div>
          {payable.payments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No payments submitted yet.
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Finance submits payment request → General Director approves → Finance marks as paid.
              </p>
            </div>
          ) : (
            <PayablePaymentList
              payableId={payable.id}
              payments={payable.payments.map((p) => ({
                id: p.id,
                amount: Number(p.amount),
                date: p.date.toISOString(),
                pMethod: p.pMethod,
                reference: p.reference,
                status: p.status,
                submittedBy: p.submittedBy,
                approvedBy: p.approvedBy,
                approvedAt: p.approvedAt?.toISOString() ?? null,
                paidBy: p.paidBy,
                paidAt: p.paidAt?.toISOString() ?? null,
              }))}
              canApprove={canApprove}
              canMarkPaid={canMarkPaid}
            />
          )}
        </div>
      </div>
    </main>
  );
}

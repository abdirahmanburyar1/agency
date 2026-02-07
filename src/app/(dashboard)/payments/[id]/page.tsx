import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requirePermission, canAccess } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { getPaymentVisibilityWhere } from "@/lib/cargo";
import { getCurrencyRates } from "@/lib/currency-rates";
import { getCurrencySymbol } from "@/lib/currencies";
import PaymentDetailClient from "./PaymentDetailClient";

function hasCargoPermission(permissions: string[]): boolean {
  return permissions.some((p) => p.startsWith("cargo."));
}

function toUsd(amount: number, currency: string, rates: Record<string, number>): number {
  const rate = rates[currency] ?? 1;
  if (currency === "USD" || rate === 1) return amount;
  return amount / rate;
}

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
  const hasPaymentsView = permissions.includes(PERMISSION.PAYMENTS_VIEW);
  const hasCargoView = permissions.some((p) => p.startsWith("cargo."));
  if (!hasPaymentsView && !hasCargoView) redirect("/");

  const { id } = await params;

  const roleName = String((session.user as { roleName?: string }).roleName ?? "").trim();
  const locationId = (session.user as { locationId?: string | null }).locationId ?? null;
  const isAdminOrCargoViewAll = roleName.toLowerCase() === "admin" || permissions.includes(PERMISSION.CARGO_VIEW_ALL);
  const hasPaymentsViewAll = permissions.includes(PERMISSION.PAYMENTS_VIEW_ALL);
  const hasCargoOrPaymentsView = hasCargoPermission(permissions) || permissions.includes(PERMISSION.PAYMENTS_VIEW);
  const paymentWhere = getPaymentVisibilityWhere(
    isAdminOrCargoViewAll,
    hasPaymentsViewAll,
    hasCargoOrPaymentsView,
    locationId
  );

  const [payment, rates] = await Promise.all([
    prisma.payment.findFirst({
      where: { id, ...paymentWhere },
      include: {
        ticket: { include: { customer: true } },
        visa: { include: { customerRelation: true } },
        hajUmrahBooking: { include: { customer: true } },
        cargoShipment: true,
        receipts: { orderBy: { date: "desc" } },
      },
    }),
    getCurrencyRates(),
  ]);

  if (!payment) notFound();

  const paymentCurrency = (payment as { currency?: string }).currency ?? "USD";
  const expectedUsd = toUsd(Number(payment.amount), paymentCurrency, rates);

  const totalReceivedUsd = payment.receipts.reduce((sum, r) => {
    const rAmount = Number(r.amount);
    const rCurrency = (r as { currency?: string }).currency ?? "USD";
    const rRate = (r as { rateToBase?: number | null }).rateToBase;
    const amtUsd = rRate != null ? rAmount * Number(rRate) : toUsd(rAmount, rCurrency, rates);
    return sum + amtUsd;
  }, 0);

  const balanceUsd = expectedUsd - totalReceivedUsd;
  const totalReceivedInPaymentCurrency = paymentCurrency === "USD"
    ? totalReceivedUsd
    : totalReceivedUsd * (rates[paymentCurrency] ?? 1);
  const balanceInPaymentCurrency = Number(payment.amount) - totalReceivedInPaymentCurrency;

  const customer = payment.ticket?.customer ?? payment.visa?.customerRelation ?? payment.hajUmrahBooking?.customer;
  const customerName = customer
    ? (customer.phone?.trim()
        ? `${customer.name} - ${customer.phone}`
        : customer.name)
    : payment.cargoShipment
      ? `${payment.cargoShipment.senderName} → ${payment.cargoShipment.receiverName}`
      : (payment.ticket?.customerName ?? payment.visa?.customer ?? "—");
  const trackDisplay = payment.hajUmrahBooking?.trackNumber != null
    ? (payment.hajUmrahBooking.trackNumber < 1000
        ? String(payment.hajUmrahBooking.trackNumber).padStart(3, "0")
        : String(payment.hajUmrahBooking.trackNumber))
    : null;

  const currencies = ["USD", ...Object.keys(rates).filter((c) => c !== "USD")].sort();

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
        {hasPaymentsView ? (
          <Link
            href="/payments"
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Back to Payments
          </Link>
        ) : payment.cargoShipmentId ? (
          <Link
            href={`/cargo/${payment.cargoShipmentId}`}
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Back to Cargo
          </Link>
        ) : (
          <span />
        )}
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
            {payment.name ?? "Payment"} · Payment date:{" "}
            {new Date(payment.paymentDate).toLocaleDateString()}
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Expected amount
            </p>
            <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
              {getCurrencySymbol(paymentCurrency)}{Number(payment.amount).toLocaleString()} {paymentCurrency}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Received
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {getCurrencySymbol(paymentCurrency)}{totalReceivedInPaymentCurrency.toLocaleString()} {paymentCurrency}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {balanceInPaymentCurrency < 0 ? "Refund due" : "Balance"}
            </p>
            <p className={`mt-2 text-2xl font-bold ${balanceInPaymentCurrency < 0 ? "text-blue-600 dark:text-blue-400" : "text-zinc-900 dark:text-white"}`}>
              {balanceInPaymentCurrency < 0
                ? `${getCurrencySymbol(paymentCurrency)}${Math.abs(balanceInPaymentCurrency).toLocaleString()} ${paymentCurrency}`
                : `${getCurrencySymbol(paymentCurrency)}${balanceInPaymentCurrency.toLocaleString()} ${paymentCurrency}`}
            </p>
            {balanceInPaymentCurrency < 0 && (
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
                label="Payment date"
                value={new Date(payment.paymentDate).toLocaleDateString()}
              />
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
                  ) : payment.cargoShipment ? (
                    <Link
                      href={`/cargo/${payment.cargoShipment.id}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Cargo · {payment.cargoShipment.trackingNumber}
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
                balance={balanceInPaymentCurrency}
                balanceCurrency={paymentCurrency}
                customerName={customerName}
                canRecordReceipt={canRecordReceipt}
                canEditStatus={canEditStatus}
                isCargo={!!payment.cargoShipment}
                currencies={currencies}
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
              {payment.receipts.map((r) => {
                const rCurrency = (r as { currency?: string }).currency ?? "USD";
                return (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-6 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {getCurrencySymbol(rCurrency)}{Number(r.amount).toLocaleString()} {rCurrency}
                      {(r as { collectionPoint?: string | null }).collectionPoint && (
                        <span className="ml-2 text-xs text-zinc-500">({(r as { collectionPoint: string }).collectionPoint})</span>
                      )}
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
              );
              })}
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission, canAccess } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import VisaDocuments from "./VisaDocuments";

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  const v = value?.trim();
  if (v == null || v === "") return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">{v}</p>
    </div>
  );
}

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  partial: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  credit: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  refund: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
};

export default async function VisaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSION.VISAS_VIEW, { redirectOnForbidden: true });
  const { id } = await params;

  const visa = await prisma.visa.findUnique({
    where: { id },
    include: {
      customerRelation: true,
      payments: { where: { canceledAt: null }, orderBy: { createdAt: "desc" } },
      payables: { where: { canceledAt: null }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!visa) notFound();

  const [canUploadDocs, canViewDocs, canDeleteDocs, canEdit, canViewPayments, canViewPayables] =
    await Promise.all([
      canAccess(PERMISSION.DOCUMENTS_UPLOAD),
      canAccess(PERMISSION.DOCUMENTS_VIEW),
      canAccess(PERMISSION.DOCUMENTS_DELETE),
      canAccess(PERMISSION.VISAS_EDIT),
      canAccess(PERMISSION.PAYMENTS_VIEW),
      canAccess(PERMISSION.PAYABLES_VIEW),
    ]);

  const customer = visa.customerRelation;
  const customerName = customer?.name ?? visa.customer ?? null;
  const customerPhone = customer?.phone ?? null;
  const customerEmail =
    customer && "email" in customer ? (customer as { email?: string }).email : null;

  const visaNumberDisplay =
    visa.visaNumber != null ? String(visa.visaNumber).padStart(3, "0") : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/visas"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to Visas
        </Link>
        {canEdit && (
          <Link
            href={`/visas/${id}/edit`}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Edit Visa
          </Link>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Visa Details
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {visa.country ?? "Visa"} · {new Date(visa.date).toLocaleDateString()}
            {visaNumberDisplay && ` · Visa #${visaNumberDisplay}`}
          </p>
        </div>

        {/* Visa information */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Visa information
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label="Visa No" value={visaNumberDisplay ?? undefined} />
            <InfoRow label="Reference" value={visa.reference?.trim() || undefined} />
            <InfoRow label="Date" value={new Date(visa.date).toLocaleDateString()} />
            <InfoRow label="Month" value={visa.month} />
            <InfoRow label="Country" value={visa.country} />
            <InfoRow label="Sponsor" value={visa.sponsor} />
            <InfoRow
              label="Created at"
              value={
                visa.createdAt
                  ? new Date(visa.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : undefined
              }
            />
          </div>
        </section>

        {/* Customer */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Customer
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label="Name" value={customerName} />
            <InfoRow label="Phone" value={customerPhone} />
            <InfoRow label="Email" value={customerEmail ?? undefined} />
          </div>
        </section>

        {/* Financials */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Financials
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Net cost
              </p>
              <p className="mt-2 text-xl font-bold text-zinc-900 dark:text-white">
                ${Number(visa.netCost).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Net sales
              </p>
              <p className="mt-2 text-xl font-bold text-zinc-900 dark:text-white">
                ${Number(visa.netSales).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Profit
              </p>
              <p className="mt-2 text-xl font-bold text-green-600 dark:text-green-400">
                ${Number(visa.profit).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* Payments */}
        {canViewPayments && (
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Payments
            </h2>
            {visa.payments.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No payments for this visa</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="pb-2 pr-4 text-left font-medium text-zinc-700 dark:text-zinc-300">
                        Date
                      </th>
                      <th className="pb-2 pr-4 text-left font-medium text-zinc-700 dark:text-zinc-300">
                        Status
                      </th>
                      <th className="pb-2 pr-4 text-right font-medium text-zinc-700 dark:text-zinc-300">
                        Amount
                      </th>
                      <th className="pb-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visa.payments.map((p) => (
                      <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">
                          {new Date(p.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_STATUS_STYLE[p.status] ?? "bg-zinc-100 text-zinc-700"}`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right font-medium text-zinc-900 dark:text-white">
                          ${Number(p.amount).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/payments/${p.id}`}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Payables */}
        {canViewPayables && (
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Payables
            </h2>
            {visa.payables.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No payables for this visa
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="pb-2 pr-4 text-left font-medium text-zinc-700 dark:text-zinc-300">
                        Date
                      </th>
                      <th className="pb-2 pr-4 text-left font-medium text-zinc-700 dark:text-zinc-300">
                        Name / Description
                      </th>
                      <th className="pb-2 pr-4 text-right font-medium text-zinc-700 dark:text-zinc-300">
                        Amount
                      </th>
                      <th className="pb-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visa.payables.map((p) => (
                      <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">
                          {new Date(p.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">
                          {p.name ?? p.description ?? "—"}
                        </td>
                        <td className="py-3 pr-4 text-right font-medium text-zinc-900 dark:text-white">
                          ${Number(p.amount).toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-zinc-700 dark:text-zinc-300">
                          ${Number(p.balance).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Documents */}
        {(canViewDocs || canUploadDocs) && (
          <VisaDocuments
            visaId={id}
            canUpload={canUploadDocs}
            canView={canViewDocs}
            canDelete={canDeleteDocs}
          />
        )}
      </div>
    </main>
  );
}

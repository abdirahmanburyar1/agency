import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import EditVisaForm from "./EditVisaForm";

export default async function EditVisaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSION.VISAS_EDIT, { redirectOnForbidden: true });
  const { id } = await params;

  const visa = await prisma.visa.findUnique({
    where: { id },
    include: { customerRelation: true },
  });

  if (!visa) notFound();

  if (visa.canceledAt) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Link
            href={`/visas/${id}`}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            ← Back to Visa
          </Link>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800/50 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Cannot edit canceled visa
          </h2>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            This visa has been canceled and cannot be modified.
          </p>
        </div>
      </main>
    );
  }

  const visaNumberDisplay =
    visa.visaNumber != null
      ? visa.visaNumber < 1000
        ? String(visa.visaNumber).padStart(3, "0")
        : String(visa.visaNumber)
      : "—";

  const dateStr = new Date(visa.date).toISOString().slice(0, 10);
  const monthStr = new Date(visa.date).toISOString().slice(0, 7);

  const customerName = visa.customerRelation?.name ?? visa.customer ?? "";
  const customerPhone = visa.customerRelation?.phone ?? null;

  const initial = {
    visaId: visa.id,
    visaNumberDisplay,
    reference: visa.reference ?? "",
    date: dateStr,
    monthValue: monthStr,
    sponsorName: visa.sponsor ?? "",
    customerId: visa.customerId ?? "",
    customerName,
    customerPhone,
    country: visa.country ?? "",
    netCost: String(Number(visa.netCost)),
    netSales: String(Number(visa.netSales)),
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/visas/${id}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ← Back to Visa
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Edit Visa {visaNumberDisplay}
        </h1>
      </div>
      <EditVisaForm initial={initial} />
    </main>
  );
}

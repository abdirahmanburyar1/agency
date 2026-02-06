import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { notFound } from "next/navigation";
import EditPackageForm from "./EditPackageForm";

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSION.HAJ_UMRAH_EDIT, { redirectOnForbidden: true });
  const { id } = await params;
  const pkg = await prisma.hajUmrahPackage.findUnique({
    where: { id },
    include: { visaPrices: true },
  });
  if (!pkg) notFound();

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6">
        <Link href="/haj-umrah/packages" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back to Packages
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-white">Edit Package</h1>
      <EditPackageForm
        id={pkg.id}
        initialName={pkg.name}
        initialType={pkg.type as "haj" | "umrah"}
        initialDescription={pkg.description ?? ""}
        initialDurationDays={pkg.durationDays ?? ""}
        initialIsActive={pkg.isActive}
        initialPriceByCountry={pkg.priceByCountry ?? true}
        initialFixedPrice={pkg.fixedPrice != null ? Number(pkg.fixedPrice) : null}
        initialVisaPrices={pkg.visaPrices.map((v) => ({ country: v.country, price: Number(v.price) }))}
      />
    </main>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/db";
import { canAccess, requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import CustomersTable from "./CustomersTable";

export default async function CustomersPage() {
  await requirePermission(PERMISSION.CUSTOMERS_VIEW, { redirectOnForbidden: true });
  const canCreate = await canAccess(PERMISSION.CUSTOMERS_CREATE);
  const canEdit = await canAccess(PERMISSION.CUSTOMERS_EDIT);
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            ← Back
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Customers</h1>
        </div>
        {canCreate && (
          <Link
            href="/customers/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Create Customer
          </Link>
        )}
      </div>
      <CustomersTable customers={customers} canEdit={canEdit} />
    </main>
  );
}

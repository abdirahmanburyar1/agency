import Link from "next/link";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import CreateCargoForm from "./CreateCargoForm";

export default async function NewCargoPage() {
  await requirePermission(PERMISSION.CARGO_CREATE, { redirectOnForbidden: true });
  const session = await auth();
  const user = session?.user as { locationId?: string | null; branchId?: string | null; locationName?: string | null; branchName?: string | null } | undefined;
  const userLocationId = user?.locationId ?? null;
  const userBranchId = user?.branchId ?? null;
  const userLocationName = user?.locationName ?? null;
  const userBranchName = user?.branchName ?? null;

  return (
    <main className="w-full max-w-full py-4 sm:py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3 sm:gap-4">
        <Link
          href="/cargo"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ← Back to Cargo
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Cargo Intake</h1>
      </div>
      <CreateCargoForm
        userLocationId={userLocationId}
        userBranchId={userBranchId}
        userLocationName={userLocationName}
        userBranchName={userBranchName}
      />
    </main>
  );
}

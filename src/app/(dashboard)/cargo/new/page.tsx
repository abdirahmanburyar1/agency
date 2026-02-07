import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import CreateCargoForm from "./CreateCargoForm";

export default async function NewCargoPage() {
  await requirePermission(PERMISSION.CARGO_CREATE, { redirectOnForbidden: true });
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
      <CreateCargoForm />
    </main>
  );
}

import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import CreatePackageForm from "./CreatePackageForm";
import { PackageIcon } from "../icons";

export default async function NewPackagePage() {
  await requirePermission(PERMISSION.HAJ_UMRAH_CREATE, { redirectOnForbidden: true });

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6">
        <Link href="/haj-umrah/packages" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back to Packages
        </Link>
      </div>
      <h1 className="mb-6 flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-white">
        <span className="flex size-9 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
          <PackageIcon className="size-5" />
        </span>
        Add Haj & Umrah Package
      </h1>
      <CreatePackageForm />
    </main>
  );
}

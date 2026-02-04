import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import CreateVisaForm from "./CreateVisaForm";

export default async function NewVisaPage() {
  await requirePermission(PERMISSION.VISAS_CREATE, { redirectOnForbidden: true });
  const session = await auth();
  const sponsorName = session?.user?.name?.trim() || session?.user?.email || "";

  let nextVisaNumber = 1;
  try {
    const rows = await prisma.$queryRaw<{ max: number | null }[]>`
      SELECT MAX(visa_number) as max FROM visas
    `;
    const max = rows[0]?.max;
    nextVisaNumber = (typeof max === "number" ? max : 0) + 1;
  } catch {
    const count = await prisma.visa.count();
    nextVisaNumber = count + 1;
  }
  const nextVisaNoDisplay =
    nextVisaNumber < 1000
      ? String(nextVisaNumber).padStart(3, "0")
      : String(nextVisaNumber);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/visas"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ← Back to Visas
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Create Visa
        </h1>
      </div>
      <CreateVisaForm
        sponsorName={sponsorName}
        nextVisaNo={nextVisaNoDisplay}
        nextVisaNumber={nextVisaNumber}
      />
    </main>
  );
}

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ensureSeed } from "@/lib/seed";
import SetupForm from "./SetupForm";

export default async function SetupPage() {
  const userCount = await prisma.user.count();
  if (userCount > 0) redirect("/login");

  const adminRole = await ensureSeed();

  return (
    <div className="flex min-h-screen">
      {/* Left: Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-12 lg:flex">
        <div>
          <img src="/logo.png" alt="Daybah" className="h-12 w-12 object-contain" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">Daybah Travel Agency</h2>
          <p className="mt-3 max-w-sm text-slate-300">
            Set up your admin account to get started. You&apos;ll have full access to manage users, roles, and all agency operations.
          </p>
        </div>
        <p className="text-sm text-slate-500">© Daybah Travel Agency</p>
      </div>

      {/* Right: Form */}
      <div className="flex w-full flex-col justify-center bg-white px-6 py-12 dark:bg-slate-950 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden mb-8">
            <img src="/logo.png" alt="Daybah" className="h-10 w-10 object-contain" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Create Admin Account
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Set up the first administrator for Daybah Travel Agency
          </p>
          <SetupForm roleId={adminRole.id} />
        </div>
      </div>
    </div>
  );
}

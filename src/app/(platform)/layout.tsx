import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isPlatformAdmin = (session?.user as { isPlatformAdmin?: boolean })?.isPlatformAdmin;
  if (!session?.user || !isPlatformAdmin) {
    redirect("/");
  }
  
  // Platform admins can access any tenant - just change the URL subdomain
  const userTenantId = (session.user as { tenantId?: string | null })?.tenantId;
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/platform" className="text-lg font-semibold text-slate-900 dark:text-white">
            Platform Admin
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/platform/tenants"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Tenants
            </Link>
            <Link
              href="/"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

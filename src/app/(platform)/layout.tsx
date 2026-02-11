import { redirect } from "next/navigation";
import { auth } from "@/auth";
import PlatformSidebar from "@/components/PlatformSidebar";
import PlatformHeader from "@/components/PlatformHeader";

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
  
  const userName = session.user.name || undefined;
  const userEmail = session.user.email || undefined;
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <PlatformSidebar />
      <div className="flex flex-1 flex-col">
        <PlatformHeader userName={userName} userEmail={userEmail} />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

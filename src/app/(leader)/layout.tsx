import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PERMISSION } from "@/lib/permissions";
import { getSystemSettings } from "@/lib/system-settings";
import { getTenantIdFromSession } from "@/lib/tenant";
import LeaderShell from "@/components/LeaderShell";

export default async function LeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
  if (!permissions.includes(PERMISSION.HAJ_UMRAH_LEADER)) {
    redirect("/");
  }

  const tenantId = getTenantIdFromSession(session);
  const systemSettings = await getSystemSettings(tenantId);

  return (
    <LeaderShell
      userEmail={session.user.email ?? ""}
      userName={session.user.name ?? null}
      systemName={systemSettings.systemName}
      logoUrl={systemSettings.logoUrl}
    >
      {children}
    </LeaderShell>
  );
}

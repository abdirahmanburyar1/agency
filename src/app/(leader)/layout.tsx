import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PERMISSION } from "@/lib/permissions";
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

  return (
    <LeaderShell
      userEmail={session.user.email ?? ""}
      userName={session.user.name ?? null}
    >
      {children}
    </LeaderShell>
  );
}

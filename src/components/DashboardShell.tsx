"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import AppHeader from "./AppHeader";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  perm?: string;
};

type DashboardShellProps = {
  children: React.ReactNode;
  navItems: NavItem[];
  adminItems: { href: string; label: string }[];
  showDashboard?: boolean;
  showReports?: boolean;
  homeHref?: string;
  userEmail: string;
  userName: string | null;
  roleName: string;
  systemName?: string;
  logoUrl?: string;
};

export default function DashboardShell({
  children,
  navItems,
  adminItems,
  showDashboard = true,
  showReports = true,
  homeHref = "/",
  userEmail,
  userName,
  roleName,
  systemName = "Daybah Travel Agency",
  logoUrl = "/logo.png",
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    function handleToggle() {
      setSidebarOpen((prev) => !prev);
    }
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-slate-950 dark:to-slate-900/50">
      <Sidebar
        navItems={navItems}
        adminItems={adminItems}
        showDashboard={showDashboard}
        showReports={showReports}
        homeHref={homeHref}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        systemName={systemName}
        logoUrl={logoUrl}
      />
      <div className="lg:pl-72">
        <AppHeader
          userEmail={userEmail}
          userName={userName}
          roleName={roleName}
          adminLinks={adminItems}
        />
        <main className="min-h-[calc(100vh-3.5rem)] min-w-0 px-2 py-3 sm:px-3 sm:py-4 lg:px-4">{children}</main>
      </div>
    </div>
  );
}

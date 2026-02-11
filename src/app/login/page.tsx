"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const DEFAULT_TENANT_ID = "cldefault00000000000000001";

export default function LoginPage() {
  const router = useRouter();
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [systemName, setSystemName] = useState("Daybah Travel Agency");

  useEffect(() => {
    fetch("/api/check-setup")
      .then((r) => r.json())
      .then((d) => setNeedsSetup(d.needsSetup));
  }, []);

  // Tenant is derived from subdomain (URL) only - never choosable. Clients stay isolated.
  useEffect(() => {
    fetch("/api/tenants/current")
      .then((r) => r.json())
      .then((current: { tenantId?: string | null; suspended?: boolean }) => {
        console.log("Tenant from API:", current); // DEBUG
        if (current?.suspended) {
          router.replace("/tenant-suspended");
          return;
        }
        const resolvedTenantId = current?.tenantId ?? DEFAULT_TENANT_ID;
        console.log("Setting tenantId to:", resolvedTenantId); // DEBUG
        setTenantId(resolvedTenantId);
      })
      .catch((err) => {
        console.error("Failed to get tenant:", err); // DEBUG
        setTenantId(DEFAULT_TENANT_ID);
      });
  }, [router]);

  useEffect(() => {
    fetch("/api/settings/system")
      .then((r) => r.json())
      .then((d) => d.systemName && setSystemName(d.systemName))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    
    // Wait for tenant to be loaded
    if (!tenantId) {
      setError("Please wait, loading tenant information...");
      return;
    }
    
    setLoading(true);
    console.log("Logging in with tenantId:", tenantId); // DEBUG
    try {
      const res = await signIn("credentials", {
        email,
        password,
        tenantId: tenantId,
        redirect: false,
      });
      if (res?.error) {
        console.error("Login error:", res.error); // DEBUG
        setError("Invalid email or password");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      console.error("Login exception:", err); // DEBUG
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-12 lg:flex">
        <div>
          <h2 className="text-3xl font-bold text-white">{systemName}</h2>
          <p className="mt-3 max-w-sm text-slate-300">
            Manage tickets, visas, expenses, and payments in one place. Professional travel agency management made simple.
          </p>
        </div>
        <p className="text-sm text-slate-500">© {systemName}</p>
      </div>

      {/* Right: Form */}
      <div className="flex w-full flex-col justify-center bg-white px-6 py-12 dark:bg-slate-950 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Enter your credentials to access your account
          </p>

          {needsSetup && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/30">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                No admin account yet.{" "}
                <a href="/setup" className="font-semibold text-amber-700 underline hover:text-amber-800 dark:text-amber-300">
                  Create the first admin
                </a>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                placeholder="you@daybah.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !tenantId}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {!tenantId ? "Loading..." : loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

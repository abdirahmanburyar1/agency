"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { RealtimeProvider } from "./RealtimeProvider";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={5 * 60}
      refetchOnWindowFocus={false}
    >
      <RealtimeProvider>{children}</RealtimeProvider>
    </SessionProvider>
  );
}

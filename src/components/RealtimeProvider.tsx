"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Pusher from "pusher-js";

const CHANNEL = "daybah";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";
    if (!key) return;

    const pusher = new Pusher(key, { cluster });
    const channel = pusher.subscribe(CHANNEL);

    const events = [
      "ticket-created",
      "ticket-updated",
      "visa-created",
      "visa-updated",
      "expense-created",
      "payable-created",
      "receipt-created",
      "payment-created",
    ];

    events.forEach((event) => {
      channel.bind(event, () => {
        router.refresh();
      });
    });

    return () => {
      pusher.unsubscribe(CHANNEL);
      pusher.disconnect();
    };
  }, [mounted, router]);

  return <>{children}</>;
}

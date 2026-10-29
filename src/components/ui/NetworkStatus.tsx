"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Thin banner while the browser is offline. */
export function NetworkStatus() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-center gap-2 bg-rose-950/95 px-4 py-2.5 text-center text-xs text-rose-100 backdrop-blur">
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      You&apos;re offline. Your bag is saved — we&apos;ll reconnect automatically.
    </div>
  );
}

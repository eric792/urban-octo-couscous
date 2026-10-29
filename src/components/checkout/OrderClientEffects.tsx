"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/storefront/CartProvider";
import { trackPurchase, type TrackedProduct } from "@/lib/tracking/pixels";

/** Clears the bag, fires the purchase pixel once paid, and polls while payment confirms. */
export function OrderClientEffects({
  orderId,
  paid,
  waiting,
  total,
  shipping,
  items,
}: {
  orderId: string;
  paid: boolean;
  waiting: boolean;
  total: number;
  shipping: number;
  items: TrackedProduct[];
}) {
  const { clear, ready } = useCart();
  const router = useRouter();
  const cleared = useRef(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (ready && !cleared.current) {
      cleared.current = true;
      clear();
    }
  }, [ready, clear]);

  useEffect(() => {
    if (paid) trackPurchase({ orderId, total, shipping, items });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid, orderId]);

  // Webhooks usually land within seconds of the redirect.
  useEffect(() => {
    if (!waiting || attempts >= 20) return;
    const t = setTimeout(() => {
      setAttempts((a) => a + 1);
      router.refresh();
    }, 3000);
    return () => clearTimeout(t);
  }, [waiting, attempts, router]);

  return null;
}

"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

// Storefront error boundary: keeps the navbar/footer and reports to Sentry.
export default function StorefrontError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="container-luxe flex max-w-xl flex-col items-center py-28 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-4 font-serif text-5xl font-light text-white">We hit a snag</h1>
      <p className="mt-4 text-zinc-400">
        Our team has been notified. Your bag is saved — try again, or keep browsing.
      </p>
      {error.digest && <p className="mt-2 text-xs text-zinc-600">Reference: {error.digest}</p>}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <button onClick={() => reset()} className="btn-gold">Try again</button>
        <Link href="/shop" className="btn-outline">Back to the shop</Link>
      </div>
    </div>
  );
}

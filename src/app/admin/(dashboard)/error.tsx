"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { area: "admin" } });
  }, [error]);

  return (
    <div className="admin-card mx-auto mt-10 max-w-lg p-8 text-center">
      <h1 className="font-serif text-2xl text-white">This page failed to load</h1>
      <p className="mt-3 text-sm text-zinc-400">The error has been reported. Try again, or go back to the overview.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-zinc-600">{error.digest}</p>}
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={() => reset()} className="admin-btn">Try again</button>
        <Link href="/admin" className="admin-btn-secondary">Overview</Link>
      </div>
    </div>
  );
}

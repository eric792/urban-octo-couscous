"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

// Last-resort error page (replaces the root layout), reported to Sentry.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en-ZA">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0B",
          color: "#e4e4e7",
          fontFamily: "Georgia, 'Times New Roman', serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div>
          <p style={{ letterSpacing: "0.3em", color: "#D6B46C", fontSize: 20 }}>ZEN AMOUR</p>
          <h1 style={{ fontWeight: 300, fontSize: 40, margin: "32px 0 12px", color: "#fff" }}>Something went wrong</h1>
          <p style={{ fontFamily: "Helvetica, Arial, sans-serif", color: "#a1a1aa", maxWidth: 420 }}>
            We&apos;ve been notified and are looking into it. Your bag is saved.
          </p>
          <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", fontFamily: "Helvetica, Arial, sans-serif" }}>
            <button
              onClick={() => reset()}
              style={{ background: "#C49C4E", color: "#0A0A0B", border: 0, padding: "12px 24px", letterSpacing: "0.15em", fontSize: 12, cursor: "pointer" }}
            >
              TRY AGAIN
            </button>
            <Link href="/" style={{ border: "1px solid #2A2A30", color: "#e4e4e7", padding: "12px 24px", letterSpacing: "0.15em", fontSize: 12, textDecoration: "none" }}>
              HOME
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

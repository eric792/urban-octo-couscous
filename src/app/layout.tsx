import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { STORE_NAME, STORE_TAGLINE } from "@/lib/constants";
import { getAppUrl } from "@/lib/utils";
import "./globals.css";

// Every page reads live data (stock, settings), so render on request.
// Catalogue queries are cached separately and refreshed when the admin edits.
export const dynamic = "force-dynamic";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: `${STORE_NAME} — Affordable Luxury Fragrance, Skincare & Wellness`,
    template: `%s | ${STORE_NAME}`,
  },
  description: STORE_TAGLINE,
  applicationName: STORE_NAME,
  keywords: [
    "inspired fragrances South Africa",
    "affordable luxury perfume",
    "niacinamide serum South Africa",
    "collagen supplements",
    "Zen Amour",
  ],
  openGraph: {
    type: "website",
    locale: "en_ZA",
    siteName: STORE_NAME,
    title: `${STORE_NAME} — Quiet luxury, everyday price`,
    description: STORE_TAGLINE,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-ink-900 font-sans text-zinc-200">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}

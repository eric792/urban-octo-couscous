import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

// Built per request so the sitemap URL follows the live domain (and previews are excluded).
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // Vercel preview deployments shouldn't be indexed.
  if (process.env.VERCEL_ENV === "preview") {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/checkout", "/cart"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Largest admin form (journal post) is ~50 KB; nothing legitimate needs more.
    serverActions: { bodySizeLimit: "256kb" },
  },
  images: {
    // Product photos uploaded by the owner can live on Cloudinary or S3.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Uploads source maps for readable stack traces when SENTRY_AUTH_TOKEN is set (keep it secret).
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  // Routes browser events through /monitoring so ad blockers don't drop them.
  tunnelRoute: "/monitoring",
  // Only print source-map upload logs in CI.
  silent: !process.env.CI,
  telemetry: false,
  // Strip SDK debug logging from the browser bundle.
  bundleSizeOptimizations: { excludeDebugStatements: true },
});

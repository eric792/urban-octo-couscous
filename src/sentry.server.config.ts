// Node.js server-side Sentry initialisation (imported from instrumentation.ts).
import * as Sentry from "@sentry/nextjs";
import { SENTRY_DATA_COLLECTION, sentryEnvironment, TRACES_SAMPLE_RATE } from "@/lib/monitoring";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: sentryEnvironment(),
  tracesSampleRate: TRACES_SAMPLE_RATE,
  dataCollection: SENTRY_DATA_COLLECTION,
});

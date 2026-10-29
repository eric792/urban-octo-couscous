// Browser-side Sentry initialisation (loaded automatically by Next.js).
import * as Sentry from "@sentry/nextjs";
import { SENTRY_DATA_COLLECTION, sentryEnvironment, TRACES_SAMPLE_RATE } from "@/lib/monitoring";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: sentryEnvironment(),
  tracesSampleRate: TRACES_SAMPLE_RATE,
  dataCollection: SENTRY_DATA_COLLECTION,
  // Replays are only kept for sessions that hit an error.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});

// Session Replay is loaded from Sentry's CDN after the page has loaded, so it
// never adds weight to the storefront's first paint. All text and form inputs
// are masked so customer details never leave the browser.
if (dsn && typeof window !== "undefined") {
  const loadReplay = () => {
    Sentry.lazyLoadIntegration("replayIntegration")
      .then((replayIntegration) =>
        Sentry.addIntegration(replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: false })),
      )
      .catch(() => {
        /* blocked by an extension or offline — errors are still reported */
      });
  };
  if (document.readyState === "complete") setTimeout(loadReplay, 2000);
  else window.addEventListener("load", () => setTimeout(loadReplay, 2000), { once: true });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

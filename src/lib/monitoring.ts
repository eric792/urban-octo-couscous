import * as Sentry from "@sentry/nextjs";

/*
 * Sentry error monitoring, logs and metrics.
 *
 * POPIA: the store handles names, phone numbers and addresses, so the SDK is
 * told NOT to collect user identity, cookies, request bodies, database query
 * values or local variables. Never put customer emails, phones or addresses
 * in tags, logs or extra data — use order numbers / ids instead.
 */
export const SENTRY_DATA_COLLECTION = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: ["forwarded", "-ip", "remote-", "via", "-user", "cookie"] },
    response: true,
  },
  httpBodies: [],
  urlQueryParams: { deny: ["ref", "email", "phone"] },
  databaseQueryData: false,
  stackFrameVariables: false,
} satisfies NonNullable<Parameters<typeof Sentry.init>[0]>["dataCollection"];

export function sentryEnvironment(): string {
  return process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development";
}

/** 100% of traces in development, 10% in production (adjust to your traffic). */
export const TRACES_SAMPLE_RATE = process.env.NODE_ENV === "development" ? 1.0 : 0.1;

interface ErrorContext {
  area: "checkout" | "payfast" | "yoco" | "pargo" | "email" | "orders" | "admin" | "api" | "rate-limit";
  gateway?: string;
  orderId?: string;
  orderNumber?: string;
  extra?: Record<string, unknown>;
}

/** Logs to the console and reports to Sentry (no-op when no DSN is set). */
export function captureError(error: unknown, context: ErrorContext) {
  console.error(`[${context.area}]`, error);
  Sentry.captureException(error, {
    tags: { area: context.area, ...(context.gateway && { gateway: context.gateway }) },
    extra: { orderId: context.orderId, orderNumber: context.orderNumber, ...context.extra },
  });
}

/** Reports something that isn't an exception but needs a human (e.g. a payment amount mismatch). */
export function captureAlert(message: string, context: ErrorContext, level: "warning" | "error" = "error") {
  console.warn(`[${context.area}] ${message}`);
  Sentry.captureMessage(message, {
    level,
    tags: { area: context.area, ...(context.gateway && { gateway: context.gateway }) },
    extra: { orderId: context.orderId, orderNumber: context.orderNumber, ...context.extra },
  });
}

export const logger = Sentry.logger;
export const metrics = Sentry.metrics;

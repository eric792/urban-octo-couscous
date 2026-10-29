"use client";

/*
 * Browser fetch with a timeout, safe retries and friendly error messages.
 * Only retry requests that are idempotent (quotes, searches, or checkout calls
 * that carry an Idempotency-Key) — never a request that could charge twice.
 */

export type FetchFailureCode =
  | "OFFLINE"
  | "NETWORK"
  | "TIMEOUT"
  | "ABORTED"
  | "RATE_LIMITED"
  | "SERVER"
  | "CLIENT"
  | "BAD_RESPONSE";

export type FetchResult<T> =
  | { ok: true; status: number; data: T }
  | {
      ok: false;
      status: number;
      code: FetchFailureCode | string;
      message: string;
      data?: Record<string, unknown>;
      retryAfter?: number;
    };

interface Options {
  method?: "GET" | "POST";
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  /** Extra attempts after the first (only for network errors, timeouts, 502/503/504). */
  retries?: number;
  /** Cancels the request (e.g. when a component unmounts or inputs change). */
  signal?: AbortSignal;
}

const RETRYABLE_STATUS = new Set([502, 503, 504]);

function friendly(code: FetchFailureCode, retryAfter?: number): string {
  switch (code) {
    case "OFFLINE":
      return "You appear to be offline. Check your connection and try again.";
    case "NETWORK":
      return "We couldn't reach the store. Check your connection and try again.";
    case "TIMEOUT":
      return "This is taking longer than expected. Please try again.";
    case "RATE_LIMITED":
      return `Too many attempts. Please wait ${retryAfter ?? 30} seconds and try again.`;
    case "SERVER":
      return "Something went wrong on our side. Please try again in a moment.";
    default:
      return "Something went wrong. Please try again.";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** AbortSignal.any with a fallback for older browsers. */
function anySignal(signals: AbortSignal[]): AbortSignal {
  if (typeof AbortSignal.any === "function") return AbortSignal.any(signals);
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      controller.abort();
      break;
    }
    s.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return controller.signal;
}

function timeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export async function fetchJson<T>(url: string, opts: Options = {}): Promise<FetchResult<T>> {
  const { method = opts.body === undefined ? "GET" : "POST", timeoutMs = 15_000, retries = 0 } = opts;
  let last: FetchResult<T> | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const wait = last && !last.ok && last.retryAfter ? Math.min(last.retryAfter * 1000, 5_000) : 600 * 2 ** (attempt - 1);
      await sleep(wait);
    }
    if (opts.signal?.aborted) return { ok: false, status: 0, code: "ABORTED", message: "" };
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      last = { ok: false, status: 0, code: "OFFLINE", message: friendly("OFFLINE") };
      continue;
    }

    const timeout = timeoutSignal(timeoutMs);
    const signal = opts.signal ? anySignal([opts.signal, timeout]) : timeout;
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: { Accept: "application/json", ...(opts.body !== undefined && { "Content-Type": "application/json" }), ...opts.headers },
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        signal,
      });
    } catch {
      if (opts.signal?.aborted) return { ok: false, status: 0, code: "ABORTED", message: "" };
      const code: FetchFailureCode = timeout.aborted ? "TIMEOUT" : "NETWORK";
      last = { ok: false, status: 0, code, message: friendly(code) };
      continue;
    }

    let data: Record<string, unknown> | undefined;
    try {
      data = (await res.json()) as Record<string, unknown>;
    } catch {
      data = undefined;
    }

    if (res.ok) {
      if (data === undefined) return { ok: false, status: res.status, code: "BAD_RESPONSE", message: friendly("BAD_RESPONSE") };
      return { ok: true, status: res.status, data: data as T };
    }

    const retryAfter = Number(res.headers.get("Retry-After")) || (typeof data?.retryAfter === "number" ? data.retryAfter : undefined);
    const code =
      res.status === 429 ? "RATE_LIMITED" : typeof data?.code === "string" ? data.code : res.status >= 500 ? "SERVER" : "CLIENT";
    const message =
      res.status === 429
        ? friendly("RATE_LIMITED", retryAfter)
        : typeof data?.message === "string"
          ? data.message
          : friendly(res.status >= 500 ? "SERVER" : "CLIENT");
    last = { ok: false, status: res.status, code, message, data, retryAfter };
    if (!RETRYABLE_STATUS.has(res.status)) return last;
  }

  return last ?? { ok: false, status: 0, code: "NETWORK", message: friendly("NETWORK") };
}

/** Next.js uses thrown "errors" for redirect() / notFound(); those must pass through. */
function isNavigationSignal(err: unknown): boolean {
  const digest = (err as { digest?: unknown })?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

/**
 * Wraps a server action so a dropped connection or server crash becomes a
 * friendly message in the form instead of an error page.
 */
export function safeAction<S extends { ok: boolean; message?: string }>(
  action: (prev: S, formData: FormData) => Promise<S>,
) {
  return async (prev: S, formData: FormData): Promise<S> => {
    try {
      return await action(prev, formData);
    } catch (err) {
      if (isNavigationSignal(err)) throw err;
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      // fetch() failures surface as TypeError; anything else came back from the server
      // (and is already reported to Sentry by onRequestError).
      const code: FetchFailureCode = offline ? "OFFLINE" : err instanceof TypeError ? "NETWORK" : "SERVER";
      return { ...prev, ok: false, message: friendly(code) };
    }
  };
}

/** Random key for Idempotency-Key headers (randomUUID needs a secure context). */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

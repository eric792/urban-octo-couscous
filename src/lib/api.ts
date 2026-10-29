import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { TimeoutError, UpstreamError } from "@/lib/http";
import { captureError } from "@/lib/monitoring";
import { ipFromHeaders, rateLimit, rateLimitHeaders, type RateLimitName } from "@/lib/rate-limit";
import { issuesToErrors } from "@/lib/validation";

/*
 * One wrapper for every API route: rate limits, body-size limits, JSON parsing,
 * a route-level timeout and consistent error responses:
 *
 *   { ok: false, code: "RATE_LIMITED", message: "…", requestId: "…" }
 */

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "INVALID_JSON"
  | "VALIDATION_FAILED"
  | "PAYLOAD_TOO_LARGE"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "UPSTREAM_UNAVAILABLE"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  extra?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  return NextResponse.json({ ok: false, code, message, ...extra }, { status, headers });
}

export interface ApiContext {
  requestId: string;
  ip: string;
  /** Raw request body (already size-checked). */
  body: string;
  /** Parses the body as JSON or throws a 400. */
  json<T = unknown>(): T;
}

interface ApiOptions {
  /** Name used in logs and Sentry. */
  name: string;
  /** Policies applied in order, keyed by client IP. */
  rateLimit?: RateLimitName[];
  /** Maximum request body in bytes (default 16 KB). */
  maxBodyBytes?: number;
  /** Route-level timeout (default 25 s). */
  timeoutMs?: number;
}

async function readBody(req: Request, maxBytes: number): Promise<string> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) {
    throw new ApiError(413, "PAYLOAD_TOO_LARGE", `Request body is larger than ${Math.round(maxBytes / 1024)} KB.`);
  }
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new ApiError(413, "PAYLOAD_TOO_LARGE", `Request body is larger than ${Math.round(maxBytes / 1024)} KB.`);
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new ApiError(504, "TIMEOUT", "This is taking longer than expected. Please try again.")),
      ms,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

const DB_UNAVAILABLE = new Set(["P1001", "P1002", "P1008", "P1017", "P2024", "P2034"]);

function toErrorResponse(err: unknown, name: string, requestId: string, headers: Record<string, string>) {
  const base = { requestId };
  const h = { ...headers, "X-Request-Id": requestId };

  if (err instanceof ApiError) {
    return errorResponse(err.status, err.code, err.message, { ...base, ...err.extra }, h);
  }
  if (err instanceof ZodError) {
    return errorResponse(422, "VALIDATION_FAILED", "Please check the highlighted fields.", { ...base, errors: issuesToErrors(err.issues) }, h);
  }
  if (err instanceof TimeoutError) {
    captureError(err, { area: "api", extra: { route: name, requestId, service: err.service } });
    return errorResponse(504, "TIMEOUT", `${err.service} is taking too long to respond. Please try again.`, base, h);
  }
  if (err instanceof UpstreamError) {
    captureError(err, { area: "api", extra: { route: name, requestId, service: err.service } });
    return errorResponse(502, "UPSTREAM_UNAVAILABLE", `We couldn't reach ${err.service}. Please try again in a moment.`, base, h);
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return errorResponse(409, "CONFLICT", "This request conflicts with an existing record.", base, h);
    if (err.code === "P2025") return errorResponse(404, "NOT_FOUND", "That record no longer exists.", base, h);
    if (DB_UNAVAILABLE.has(err.code)) {
      captureError(err, { area: "api", extra: { route: name, requestId, prismaCode: err.code } });
      return errorResponse(503, "SERVICE_UNAVAILABLE", "Our store is busy right now. Please try again in a moment.", base, { ...h, "Retry-After": "5" });
    }
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    captureError(err, { area: "api", extra: { route: name, requestId } });
    return errorResponse(503, "SERVICE_UNAVAILABLE", "Our store is busy right now. Please try again in a moment.", base, { ...h, "Retry-After": "5" });
  }

  captureError(err, { area: "api", extra: { route: name, requestId } });
  return errorResponse(500, "INTERNAL_ERROR", "Something went wrong on our side. Please try again.", base, h);
}

export function withApi(options: ApiOptions, handler: (req: Request, ctx: ApiContext) => Promise<Response>) {
  return async function route(req: Request): Promise<Response> {
    const requestId = crypto.randomUUID();
    const ip = ipFromHeaders(req.headers);
    let limitHeaders: Record<string, string> = {};

    try {
      for (const policy of options.rateLimit ?? []) {
        const result = await rateLimit(policy, ip);
        limitHeaders = rateLimitHeaders(result);
        if (!result.success) {
          return errorResponse(
            429,
            "RATE_LIMITED",
            `Too many requests. Please try again in ${result.retryAfterSeconds} seconds.`,
            { requestId, retryAfter: result.retryAfterSeconds },
            { ...limitHeaders, "X-Request-Id": requestId },
          );
        }
      }

      const body = req.method === "GET" || req.method === "HEAD" ? "" : await readBody(req, options.maxBodyBytes ?? 16_384);
      const ctx: ApiContext = {
        requestId,
        ip,
        body,
        json<T>() {
          if (!body) throw new ApiError(400, "INVALID_JSON", "Request body is empty.");
          try {
            return JSON.parse(body) as T;
          } catch {
            throw new ApiError(400, "INVALID_JSON", "Request body isn't valid JSON.");
          }
        },
      };

      const res = await withTimeout(handler(req, ctx), options.timeoutMs ?? 25_000);
      res.headers.set("X-Request-Id", requestId);
      for (const [k, v] of Object.entries(limitHeaders)) res.headers.set(k, v);
      return res;
    } catch (err) {
      return toErrorResponse(err, options.name, requestId, limitHeaders);
    }
  };
}

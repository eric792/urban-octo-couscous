/** Outbound HTTP with a hard timeout, so a slow gateway can never hang a request. */

export class TimeoutError extends Error {
  constructor(
    public readonly service: string,
    public readonly timeoutMs: number,
  ) {
    super(`${service} did not respond within ${Math.round(timeoutMs / 1000)}s`);
    this.name = "TimeoutError";
  }
}

export class UpstreamError extends Error {
  constructor(
    public readonly service: string,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

/** Default timeouts per external service (ms). */
export const TIMEOUTS = {
  yoco: 15_000,
  payfast: 10_000,
  pargo: 10_000,
  resend: 10_000,
  redis: 1_500,
} as const;

export async function fetchWithTimeout(
  service: string,
  url: string,
  init: RequestInit & { timeoutMs: number },
): Promise<Response> {
  const { timeoutMs, ...rest } = init;
  try {
    return await fetch(url, { cache: "no-store", ...rest, signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    const name = (err as Error)?.name;
    if (name === "TimeoutError" || name === "AbortError") throw new TimeoutError(service, timeoutMs);
    throw new UpstreamError(service, `${service} request failed: ${(err as Error).message}`);
  }
}

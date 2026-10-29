type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

type NumberLike = number | string | { toNumber(): number } | null | undefined;

export function toNumber(value: NumberLike): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return value.toNumber();
}

/** Rand → integer cents. All money maths happens in cents to avoid float drift. */
export function toCents(value: NumberLike): number {
  return Math.round(toNumber(value) * 100);
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

/** Formats an amount in South African Rand, e.g. "R 1,249.00". */
export function formatZAR(value: NumberLike): string {
  const amount = toNumber(value);
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? "-" : ""}R ${formatted}`;
}

export function formatDate(value: Date | string, withTime = false): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const ORDER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Human-friendly order number, e.g. "ZA-7KQ4MX". */
export function generateOrderNumber(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) code += ORDER_ALPHABET[byte % ORDER_ALPHABET.length];
  return `ZA-${code}`;
}

export function getAppUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  return `${getAppUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Normalises SA phone numbers to 0XXXXXXXXX. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+27")) return `0${digits.slice(3)}`;
  if (digits.startsWith("27") && digits.length === 11) return `0${digits.slice(2)}`;
  return digits;
}

/** wa.me link from any SA phone format. */
export function whatsappLink(number: string, text?: string): string {
  const digits = number.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `27${digits.slice(1)}` : digits;
  return `https://wa.me/${international}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

// Hosts configured in next.config.ts images.remotePatterns.
const OPTIMIZED_HOSTS = [/^res\.cloudinary\.com$/, /\.amazonaws\.com$/, /^images\.unsplash\.com$/];

/** Local raster images and known CDNs go through next/image; everything else is served as-is. */
export function isOptimizableImage(src: string): boolean {
  if (src.toLowerCase().split("?")[0].endsWith(".svg")) return false;
  if (src.startsWith("/")) return true;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && OPTIMIZED_HOSTS.some((re) => re.test(url.hostname));
  } catch {
    return false;
  }
}

/**
 * Splits scent notes into tiers. Accepts
 * "Top: Bergamot, Heart: Amber, Base: Oud" or "Top: ... | Heart: ... | Base: ...".
 */
export function parseScentNotes(notes: string | null): { tier: string; notes: string }[] {
  if (!notes?.trim()) return [];
  const matches = [...notes.matchAll(/(top|heart|middle|base)(?:\s+notes?)?\s*:/gi)];
  if (!matches.length) return [{ tier: "Notes", notes: notes.trim() }];
  return matches
    .map((m, i) => {
      const start = (m.index ?? 0) + m[0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index ?? notes.length : notes.length;
      const tier = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
      return { tier, notes: notes.slice(start, end).replace(/[\s,;|]+$/, "").trim() };
    })
    .filter((n) => n.notes);
}

/** Serialises JSON-LD safely for a <script> tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

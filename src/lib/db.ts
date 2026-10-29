import { PrismaClient } from "@prisma/client";

/**
 * Adds connect/pool timeouts unless the connection string already sets them,
 * so a slow or sleeping database can't hang a request. Hosting integrations
 * (e.g. Neon on Vercel) inject DATABASE_URL without these.
 */
function withTimeouts(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("connect_timeout")) parsed.searchParams.set("connect_timeout", "10");
    if (!parsed.searchParams.has("pool_timeout")) parsed.searchParams.set("pool_timeout", "10");
    return parsed.toString();
  } catch {
    return url;
  }
}

// One Prisma client per server process (avoids exhausting connections during hot reload).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: withTimeouts(process.env.DATABASE_URL),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/**
 * Database connection strings.
 *
 * The app expects DATABASE_URL (pooled) and DATABASE_URL_UNPOOLED (direct), which
 * Neon's Vercel integration sets. Other Postgres integrations on Vercel (and Neon's
 * legacy option) use POSTGRES_* names instead, so those are accepted too.
 */
export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || undefined;
}

/** Direct (non-pooled) connection for migrations; falls back to the main URL. */
export function directDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || databaseUrl();
}

/** Names (never values) of database-looking variables, for build-log diagnostics. */
export function databaseVariableNames(): string[] {
  return Object.keys(process.env)
    .filter((name) => /DATABASE|POSTGRES|NEON|PG(HOST|USER|DATABASE|PASSWORD)|_URL_(UNPOOLED|NON_POOLING)$/i.test(name))
    .sort();
}

/**
 * Database connection strings (Neon Postgres).
 *
 * DATABASE_URL is Neon's pooled connection, used by the app.
 * DATABASE_URL_UNPOOLED is the direct connection, used for migrations.
 * Neon's Vercel integration sets both. Locally they can be the same.
 */
export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || undefined;
}

/** Direct (non-pooled) connection for migrations; falls back to the main URL. */
export function directDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL_UNPOOLED || databaseUrl();
}

/** Names (never values) of database-looking variables, for build-log diagnostics. */
export function databaseVariableNames(): string[] {
  return Object.keys(process.env)
    .filter((name) => /DATABASE|NEON|PG(HOST|USER|DATABASE|PASSWORD)|_URL_UNPOOLED$/i.test(name))
    .sort();
}

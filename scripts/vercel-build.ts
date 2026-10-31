/* Vercel build step, run before `next build` (see vercel.json and `npm run vercel-build`).
 *
 * Production deploys:
 *   1. Apply database migrations.
 *   2. First deploy only (no admin account yet): load the catalogue, store settings
 *      and the admin account from prisma/seed.ts. Demo customers and orders are
 *      skipped unless SEED_DEMO_DATA="true".
 *
 * Preview deploys leave the database alone, because previews usually share the
 * production database. Set MIGRATE_ON_PREVIEW="true" only if previews get their
 * own database (e.g. Neon preview branches). */
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { databaseUrl, databaseVariableNames, directDatabaseUrl } from "../src/lib/database-url";

const target = process.env.VERCEL_ENV ?? "development";

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function run(command: string, env: Record<string, string>) {
  execSync(command, { stdio: "inherit", env: { ...process.env, ...env } });
}

async function main() {
  if (target !== "production" && process.env.MIGRATE_ON_PREVIEW !== "true") {
    console.log(`[vercel-build] ${target} deploy: database left unchanged.`);
    return;
  }

  const url = databaseUrl();
  if (!url) {
    const found = databaseVariableNames();
    const project = process.env.VERCEL_PROJECT_PRODUCTION_URL || "(unknown)";
    // Presence only — never print values.
    const has = (name: string) => (process.env[name] ? "yes" : "NO");
    fail(
      `No database connection found for this ${target} build (DATABASE_URL isn't set).\n` +
        `  Vercel project: ${project}\n` +
        `  Database-related variables visible to the build: ${found.length ? found.join(", ") : "none"}.\n` +
        `  Other settings from vercel.env: AUTH_SECRET ${has("AUTH_SECRET")}, SEED_ADMIN_PASSWORD ${has("SEED_ADMIN_PASSWORD")}.\n` +
        "  Fix: in this project's Storage tab, open the Neon database and click Connect Project, choose this\n" +
        "  project and tick Production (no custom prefix). Add the vercel.env settings under Settings →\n" +
        "  Environment Variables. Then open Deployments and Redeploy.",
    );
  }
  // Child processes (Prisma CLI, seed) read the standard names.
  const env = { DATABASE_URL: url, DATABASE_URL_UNPOOLED: directDatabaseUrl() ?? url };

  console.log("[vercel-build] Applying database migrations…");
  run("npx --no-install prisma migrate deploy", env);

  // The seed creates the admin account last, so "no admin yet" means setup never finished.
  const db = new PrismaClient({ datasourceUrl: url });
  const admins = await db.user.count({ where: { role: "ADMIN" } }).finally(() => db.$disconnect());
  if (admins > 0) {
    console.log("[vercel-build] Store already set up — catalogue and settings left as they are.");
    return;
  }

  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  if (password.length < 12) {
    fail(
      "First deploy: add SEED_ADMIN_PASSWORD (at least 12 characters) under Vercel → Settings → " +
        "Environment Variables, then redeploy. It becomes the password for the admin account.",
    );
  }

  console.log("[vercel-build] New database — loading the catalogue, settings and admin account…");
  run("npx --no-install prisma db seed", { ...env, SEED_DEMO_DATA: process.env.SEED_DEMO_DATA || "false" });
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));

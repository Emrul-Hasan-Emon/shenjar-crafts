/**
 * Shared environment loader for standalone scripts under server/scripts/ (never used by the
 * Next.js app itself — Next loads .env.local automatically; this is only for scripts run
 * directly via `tsx`/`node`, outside of `next dev`/`next build`).
 *
 * Loads the repo's single `.env.local` into `process.env` — it holds both the production
 * keys (SUPABASE_URL/SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY) and the development keys
 * (DEV_SUPABASE_URL/DEV_SUPABASE_ANON_KEY/DEV_SUPABASE_SERVICE_ROLE_KEY) side by side — see
 * README.md, "Two Supabase environments". Which pair actually gets used is decided by
 * `server/supabase/env.ts` based on `NODE_ENV`, defaulting to **"development"** when
 * NODE_ENV isn't set — a script should never silently end up pointed at production just
 * because nobody set NODE_ENV.
 *
 * Every script should call `loadSupabaseEnv()` before reading any Supabase env var (including
 * before importing `server/supabase/env.ts`'s getters), and mutating scripts (seeds, smoke
 * tests, imports) should additionally call `assertNotProduction(...)` before writing anything.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SupabaseEnvironment } from "../supabase/env";

function repoRoot(): string {
  // server/scripts/loadSupabaseEnv.ts -> repo root is two directories up.
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, "..", "..");
}

function parseEnvFile(filePath: string): Record<string, string> {
  const values: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return values;
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

/** Loads .env.local into process.env (only filling in keys not already set, so an explicit
 *  shell export always wins) and returns which environment NODE_ENV currently resolves to,
 *  so the caller can log/guard on it. */
export function loadSupabaseEnv(): SupabaseEnvironment {
  const values = parseEnvFile(path.join(repoRoot(), ".env.local"));
  for (const [key, value] of Object.entries(values)) {
    if (!(key in process.env)) process.env[key] = value;
  }
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

/**
 * Refuses to continue if the resolved environment is "production" — call this at the top of
 * any script that writes data or is meant purely for testing, so it can never touch the real
 * business database just because NODE_ENV was left unset or mis-set on someone's machine.
 * There is no override flag on purpose: a script that genuinely needs to run against
 * production should not be reachable through a "development-only" guard at all.
 */
export function assertNotProduction(scriptName: string): void {
  const environment: SupabaseEnvironment = process.env.NODE_ENV === "production" ? "production" : "development";
  if (environment === "production") {
    console.error(
      `${scriptName} refuses to run against the production Supabase project. ` +
        `Unset NODE_ENV (or set NODE_ENV=development) to target development instead.`
    );
    process.exit(1);
  }
}

/**
 * Resolves which Supabase project this app talks to — production or development — based on
 * `NODE_ENV`. This is the ONE place that branches on environment; every other file (the
 * Supabase clients, `next.config.ts`, the one-off scripts under `server/scripts/`) reads
 * through the functions below instead of touching `process.env` directly.
 *
 * Both projects' keys live side by side in the single `.env.local` file (not committed), by
 * variable name:
 *
 *   production   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *   development  DEV_SUPABASE_URL, DEV_SUPABASE_ANON_KEY, DEV_SUPABASE_SERVICE_ROLE_KEY
 *
 * `NODE_ENV` is anything other than "production" during local development (`next dev` sets it
 * to "development" automatically) and standalone scripts (which default to "development" too —
 * see `server/scripts/loadSupabaseEnv.ts`), and is "production" for `next build`/`next start`
 * and the Vercel deployment. See README.md, "Two Supabase environments" for the full setup.
 */

export type SupabaseEnvironment = "development" | "production";

export function getSupabaseEnvironment(): SupabaseEnvironment {
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

function required(value: string | undefined, name: string, environment: SupabaseEnvironment): string {
  if (!value) {
    throw new Error(
      `Missing ${name} for the "${environment}" Supabase environment. Set it in ` +
        `.env.local (see README.md, "Two Supabase environments").`
    );
  }
  return value;
}

/** The project URL + anon key for whichever environment is currently active. Safe to call
 *  from the browser (via `server/supabase/client.ts`) as well as the server — see
 *  `next.config.ts`, which is what makes these two values (never the service role key)
 *  reach the browser bundle. */
export function getSupabaseConfig(): { environment: SupabaseEnvironment; url: string; anonKey: string } {
  const environment = getSupabaseEnvironment();
  if (environment === "production") {
    return {
      environment,
      // The `?? NEXT_PUBLIC_...` fallback is a transitional shim for an `.env.local` still
      // using the old pre-dual-environment naming (just NEXT_PUBLIC_SUPABASE_URL/_ANON_KEY,
      // no SUPABASE_URL/DEV_SUPABASE_URL split) — new setups should only ever need
      // SUPABASE_URL/SUPABASE_ANON_KEY here.
      url: required(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL, "SUPABASE_URL", environment),
      anonKey: required(
        process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        "SUPABASE_ANON_KEY",
        environment
      ),
    };
  }
  return {
    environment,
    url: required(process.env.DEV_SUPABASE_URL, "DEV_SUPABASE_URL", environment),
    anonKey: required(process.env.DEV_SUPABASE_ANON_KEY, "DEV_SUPABASE_ANON_KEY", environment),
  };
}

export function getSupabaseUrl(): string {
  return getSupabaseConfig().url;
}

export function getSupabaseAnonKey(): string {
  return getSupabaseConfig().anonKey;
}

/** Server-only — never expose this to the browser (never add it to `next.config.ts`'s `env`). */
export function getSupabaseServiceRoleKey(): string {
  const environment = getSupabaseEnvironment();
  if (environment === "production") {
    return required(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY", environment);
  }
  return required(process.env.DEV_SUPABASE_SERVICE_ROLE_KEY, "DEV_SUPABASE_SERVICE_ROLE_KEY", environment);
}

/** Same as `getSupabaseUrl()`, but returns undefined instead of throwing when unset — used by
 *  `next.config.ts`, which runs even when env vars aren't fully configured yet (e.g. a fresh
 *  checkout before `.env.local` is filled in) and must not crash just to compute the
 *  image-loader's allowed hostname. */
export function tryGetSupabaseUrl(): string | undefined {
  try {
    return getSupabaseUrl();
  } catch {
    return undefined;
  }
}

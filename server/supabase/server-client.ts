import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import { authCookieOptions, PANEL_HEADER, type Panel } from "./panel";

/** Server-side Supabase client for Server Components, Server Actions, and Route Handlers. */
export async function createClient() {
  const cookieStore = await cookies();
  // Middleware tags /admin and /partner requests; everything else uses the default (admin) cookie.
  const panel: Panel = (await headers()).get(PANEL_HEADER) === "partner" ? "partner" : "admin";

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookieOptions: authCookieOptions(panel),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component render — safe to ignore since
          // middleware.ts refreshes the session on every request.
        }
      },
    },
  });
}

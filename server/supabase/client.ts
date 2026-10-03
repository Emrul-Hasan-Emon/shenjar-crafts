import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import { authCookieOptions, panelForPath, type Panel } from "./panel";

const clients = new Map<Panel, ReturnType<typeof createBrowserClient>>();

/**
 * Browser-side Supabase client (safe to use in "use client" components — protected by RLS).
 * The session cookie depends on which panel the page belongs to (see ./panel.ts), so clients are cached per
 * panel rather than as one global singleton.
 */
export function createClient() {
  const panel = panelForPath(window.location.pathname);
  let client = clients.get(panel);
  if (!client) {
    client = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookieOptions: authCookieOptions(panel),
      isSingleton: false,
    });
    clients.set(panel, client);
  }
  return client;
}

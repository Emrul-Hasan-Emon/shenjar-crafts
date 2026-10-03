/**
 * Admin and Partner are separate installable apps on one origin, and a phone can have both open. Browsers
 * share cookies per origin, so a single Supabase session cookie would make signing into one app sign the
 * other out. Each panel therefore keeps its session under its own cookie name.
 *
 * Admin keeps Supabase's default cookie name (existing admin sessions stay valid); Partner gets its own.
 * Pure helpers with no framework imports, so they are safe in middleware, server code and the browser.
 */
export type Panel = "admin" | "partner";

/** Set by middleware on /admin and /partner requests so server code knows which session cookie to use. */
export const PANEL_HEADER = "x-shenjar-panel";

const PARTNER_COOKIE_NAME = "sb-partner-auth-token";

export function panelForPath(pathname: string): Panel {
  // "/partners" is the public marketing page, not the partner panel.
  return pathname === "/partner" || pathname.startsWith("/partner/") ? "partner" : "admin";
}

export function authCookieOptions(panel: Panel) {
  return panel === "partner" ? { name: PARTNER_COOKIE_NAME } : undefined;
}

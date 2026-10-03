import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "./supabase/env";
import { authCookieOptions, panelForPath, PANEL_HEADER } from "./supabase/panel";

const ADMIN_LOGIN_PATH = "/admin/login";
const PARTNER_LOGIN_PATH = "/partner/login";

/**
 * Refreshes the Supabase auth session cookie on every request and keeps
 * unauthenticated visitors out of /admin and /partner — two independent
 * gates, neither depending on the other (see "Designing for easy extraction
 * later" in docs/partner-management-plan.md). Called from the root
 * middleware.ts.
 */
export async function updateSession(request: NextRequest) {
  // Tell server components/actions which panel this is, so they read the right session cookie.
  // Overwrites any client-supplied value.
  const panel = panelForPath(request.nextUrl.pathname);
  // Rebuilt on every use so a session refresh (request.cookies.set) is reflected in the forwarded cookie header.
  const forwardHeaders = () => {
    const headers = new Headers(request.headers);
    headers.set(PANEL_HEADER, panel);
    return headers;
  };
  let response = NextResponse.next({ request: { headers: forwardHeaders() } });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookieOptions: authCookieOptions(panel),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: forwardHeaders() } });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLoginRoute = pathname === ADMIN_LOGIN_PATH;
  const isPartnerRoute = pathname.startsWith("/partner");
  const isPartnerLoginRoute = pathname === PARTNER_LOGIN_PATH;

  if (isAdminRoute) {
    // "Is admin" here means a genuine app_admins row for this user, not just
    // "any logged-in session" — otherwise a logged-in partner would pass
    // straight into the admin panel shell (RLS would still block their
    // data, but this is the "clean redirect" the partner-management spec
    // promises instead). See is_admin() in schema.sql.
    let isAdmin = false;
    if (user) {
      const { data } = await supabase.rpc("is_admin");
      isAdmin = !!data;
    }

    if (!isAdminLoginRoute && !isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_LOGIN_PATH;
      return NextResponse.redirect(url);
    }

    if (isAdminLoginRoute && isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  if (isPartnerRoute) {
    // "Is a partner" here means an active partners row for this user, not
    // just any logged-in session — an admin session, or a deactivated
    // partner, both fail this and get sent to /partner/login. See
    // "Active/Inactive Partner Rules" in the spec: an inactive partner must
    // not be able to reach their panel at all.
    let isActivePartner = false;
    if (user) {
      const { data: partner } = await supabase
        .from("partners")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      isActivePartner = !!partner;
    }

    if (!isPartnerLoginRoute && !isActivePartner) {
      const url = request.nextUrl.clone();
      url.pathname = PARTNER_LOGIN_PATH;
      if (user) url.searchParams.set("error", "inactive");
      return NextResponse.redirect(url);
    }

    if (isPartnerLoginRoute && isActivePartner) {
      const url = request.nextUrl.clone();
      url.pathname = "/partner";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

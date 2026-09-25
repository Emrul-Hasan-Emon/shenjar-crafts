"use server";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@server/supabase/env";
import { partnerAuthEmail } from "./authEmail";

/**
 * Provisions a partner's Supabase Auth account, keyed by mobile (via
 * partnerAuthEmail — see that file for why). Needs the service role key
 * (partners can't self-register), so this is the one place in server/partners
 * allowed to import it, and it must run as a Server Action, never in the
 * browser. Called by the admin "create partner" flow before the partners /
 * partner_configs rows are created (server/partners/partners.ts).
 */
export async function createPartnerAuthUser(mobile: string, password: string): Promise<{ userId: string }> {
  const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
  const { data, error } = await supabase.auth.admin.createUser({
    email: partnerAuthEmail(mobile),
    password,
    email_confirm: true,
  });
  if (error) throw new Error(error.message);
  return { userId: data.user.id };
}

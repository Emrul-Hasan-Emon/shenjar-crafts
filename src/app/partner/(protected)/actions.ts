"use server";

import { redirect } from "next/navigation";
import { createClient } from "@server/supabase/server-client";

export async function partnerSignOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/partner/login");
}

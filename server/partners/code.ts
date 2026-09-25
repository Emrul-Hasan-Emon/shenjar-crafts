import type { SupabaseClient } from "@supabase/supabase-js";

// Excludes 0/O and 1/I — visually ambiguous in a code someone reads aloud or
// copies by hand.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 10;

function randomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

/**
 * Generates a 6-character alphanumeric partner code, retried against
 * partner_configs for uniqueness. partner_configs.code's own database
 * `unique` constraint is the hard backstop if two requests ever raced past
 * this check at the same time.
 */
export async function generateUniquePartnerCode(supabase: SupabaseClient): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = randomCode();
    const { data, error } = await supabase
      .from("partner_configs")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (error) throw error;
    if (!data) return code;
  }
  throw new Error("Could not generate a unique partner code — try again.");
}

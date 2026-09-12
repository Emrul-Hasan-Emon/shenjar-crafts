import type { SupabaseClient } from "@supabase/supabase-js";
import type { AboutUs } from "./types";

const ROW_ID = "default";

export async function getAboutUs(supabase: SupabaseClient): Promise<AboutUs | null> {
  const { data, error } = await supabase
    .from("about_us")
    .select("*")
    .eq("id", ROW_ID)
    .maybeSingle();
  if (error) throw error;
  return data as AboutUs | null;
}

export async function updateAboutUs(
  supabase: SupabaseClient,
  input: { content_en?: string | null; content_bn?: string | null }
): Promise<AboutUs> {
  const { data, error } = await supabase
    .from("about_us")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", ROW_ID)
    .select("*")
    .single();
  if (error) throw error;
  return data as AboutUs;
}

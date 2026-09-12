import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "../lib/slug";
import type { Category } from "./types";

export async function listCategories(supabase: SupabaseClient): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name_en", { ascending: true });
  if (error) throw error;
  return data as Category[];
}

export async function getCategoryById(
  supabase: SupabaseClient,
  id: string
): Promise<Category | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Category | null;
}

export async function getCategoryBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Category | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as Category | null;
}

async function uniqueSlug(supabase: SupabaseClient, nameEn: string): Promise<string> {
  const base = slugify(nameEn);
  let candidate = base;
  let suffix = 2;
  // Small business, tiny category count — a loop is simpler and safer than a DB-side trick.
  while (await getCategoryBySlug(supabase, candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export type CategoryInput = {
  name_en: string;
  name_bn?: string | null;
  banner_path?: string | null;
  description_en?: string | null;
  description_bn?: string | null;
};

export async function createCategory(
  supabase: SupabaseClient,
  input: CategoryInput
): Promise<Category> {
  const slug = await uniqueSlug(supabase, input.name_en);
  const { data, error } = await supabase
    .from("categories")
    .insert({
      slug,
      name_en: input.name_en,
      name_bn: input.name_bn ?? null,
      banner_path: input.banner_path ?? null,
      description_en: input.description_en ?? null,
      description_bn: input.description_bn ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  supabase: SupabaseClient,
  id: string,
  input: CategoryInput
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .update({
      name_en: input.name_en,
      name_bn: input.name_bn ?? null,
      banner_path: input.banner_path ?? null,
      description_en: input.description_en ?? null,
      description_bn: input.description_bn ?? null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Category;
}

/**
 * Upsert used only by the migration script: reuse an existing category by
 * name (case-insensitive) or create it, so re-running the import is safe.
 */
export async function findOrCreateCategoryByName(
  supabase: SupabaseClient,
  nameEn: string
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .ilike("name_en", nameEn)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as Category;
  return createCategory(supabase, { name_en: nameEn });
}

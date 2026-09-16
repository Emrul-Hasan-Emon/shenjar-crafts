import type { SupabaseClient } from "@supabase/supabase-js";
import type { Material } from "./types";

export type MaterialInput = {
  name_en: string;
  name_bn?: string | null;
  description_en?: string | null;
  description_bn?: string | null;
  unit: string;
  unit_price: number;
};

function toRow(input: MaterialInput) {
  return {
    name_en: input.name_en,
    name_bn: input.name_bn ?? null,
    description_en: input.description_en ?? null,
    description_bn: input.description_bn ?? null,
    unit: input.unit,
    unit_price: input.unit_price,
  };
}

export async function listMaterials(supabase: SupabaseClient): Promise<Material[]> {
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .order("name_en", { ascending: true });
  if (error) throw error;
  return data as Material[];
}

export async function createMaterial(
  supabase: SupabaseClient,
  input: MaterialInput
): Promise<Material> {
  const { data, error } = await supabase
    .from("materials")
    .insert(toRow(input))
    .select("*")
    .single();
  if (error) throw error;
  return data as Material;
}

export async function updateMaterial(
  supabase: SupabaseClient,
  id: string,
  input: MaterialInput
): Promise<Material> {
  const { data, error } = await supabase
    .from("materials")
    .update(toRow(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Material;
}

export async function deleteMaterial(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) throw error;
}

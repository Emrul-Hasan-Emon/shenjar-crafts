import type { SupabaseClient } from "@supabase/supabase-js";
import type { CraftDesignMaterial } from "./types";

export type CraftDesignMaterialDetail = CraftDesignMaterial & {
  material: { id: string; name_en: string; name_bn: string | null; unit: string; unit_price: number };
};

export async function listCraftDesignMaterials(
  supabase: SupabaseClient,
  craftsDesignId: string
): Promise<CraftDesignMaterialDetail[]> {
  const { data, error } = await supabase
    .from("craft_design_materials")
    .select("*, material:materials(id, name_en, name_bn, unit, unit_price)")
    .eq("crafts_design_id", craftsDesignId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as CraftDesignMaterialDetail[];
}

export async function addCraftDesignMaterial(
  supabase: SupabaseClient,
  craftsDesignId: string,
  materialId: string,
  quantity: number
): Promise<void> {
  const { error } = await supabase
    .from("craft_design_materials")
    .insert({ crafts_design_id: craftsDesignId, material_id: materialId, quantity });
  if (error) throw error;
}

export async function updateCraftDesignMaterialQuantity(
  supabase: SupabaseClient,
  id: string,
  quantity: number
): Promise<void> {
  const { error } = await supabase.from("craft_design_materials").update({ quantity }).eq("id", id);
  if (error) throw error;
}

export async function removeCraftDesignMaterial(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("craft_design_materials").delete().eq("id", id);
  if (error) throw error;
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CraftsDesign } from "./types";

export type CraftsDesignInput = {
  finance_record_id?: string | null;
  name_en: string;
  name_bn?: string | null;
  description_en?: string | null;
  description_bn?: string | null;
  quantity: number;
};

/** A design plus the linked Project's own name, if any — for the list page's
 * reference chip. Nothing about the Project's cost fields is touched or read here. */
export type CraftsDesignWithProject = CraftsDesign & {
  project_name: string | null;
};

export async function listCraftsDesigns(supabase: SupabaseClient): Promise<CraftsDesignWithProject[]> {
  const { data, error } = await supabase
    .from("crafts_designs")
    .select("*, finance_records(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Array<CraftsDesign & { finance_records: { name: string } | null }>).map((row) => {
    const { finance_records, ...design } = row;
    return { ...design, project_name: finance_records?.name ?? null };
  });
}

export async function getCraftsDesignById(
  supabase: SupabaseClient,
  id: string
): Promise<CraftsDesignWithProject | null> {
  const { data, error } = await supabase
    .from("crafts_designs")
    .select("*, finance_records(name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { finance_records, ...design } = data as CraftsDesign & {
    finance_records: { name: string } | null;
  };
  return { ...design, project_name: finance_records?.name ?? null };
}

function toRow(input: CraftsDesignInput) {
  return {
    finance_record_id: input.finance_record_id ?? null,
    name_en: input.name_en,
    name_bn: input.name_bn ?? null,
    description_en: input.description_en ?? null,
    description_bn: input.description_bn ?? null,
    quantity: input.quantity,
  };
}

export async function createCraftsDesign(
  supabase: SupabaseClient,
  input: CraftsDesignInput
): Promise<CraftsDesign> {
  const { data, error } = await supabase
    .from("crafts_designs")
    .insert(toRow(input))
    .select("*")
    .single();
  if (error) throw error;
  return data as CraftsDesign;
}

export async function updateCraftsDesign(
  supabase: SupabaseClient,
  id: string,
  input: CraftsDesignInput
): Promise<CraftsDesign> {
  const { data, error } = await supabase
    .from("crafts_designs")
    .update(toRow(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as CraftsDesign;
}

export async function deleteCraftsDesign(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("crafts_designs").delete().eq("id", id);
  if (error) throw error;
}

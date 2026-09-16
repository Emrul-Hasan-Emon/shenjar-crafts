import type { SupabaseClient } from "@supabase/supabase-js";
import type { MeasurementLabel } from "./types";

export type MeasurementLabelInput = {
  name_en: string;
  name_bn?: string | null;
  description_en?: string | null;
  description_bn?: string | null;
  default_quantity: number;
};

function toRow(input: MeasurementLabelInput) {
  return {
    name_en: input.name_en,
    name_bn: input.name_bn ?? null,
    description_en: input.description_en ?? null,
    description_bn: input.description_bn ?? null,
    default_quantity: input.default_quantity,
  };
}

export async function listMeasurementLabels(supabase: SupabaseClient): Promise<MeasurementLabel[]> {
  const { data, error } = await supabase
    .from("measurement_label")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name_en", { ascending: true });
  if (error) throw error;
  return data as MeasurementLabel[];
}

export async function getMeasurementLabelById(
  supabase: SupabaseClient,
  id: string
): Promise<MeasurementLabel | null> {
  const { data, error } = await supabase
    .from("measurement_label")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as MeasurementLabel | null;
}

export async function createMeasurementLabel(
  supabase: SupabaseClient,
  input: MeasurementLabelInput
): Promise<MeasurementLabel> {
  const { data, error } = await supabase
    .from("measurement_label")
    .insert(toRow(input))
    .select("*")
    .single();
  if (error) throw error;
  return data as MeasurementLabel;
}

export async function updateMeasurementLabel(
  supabase: SupabaseClient,
  id: string,
  input: MeasurementLabelInput
): Promise<MeasurementLabel> {
  const { data, error } = await supabase
    .from("measurement_label")
    .update(toRow(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as MeasurementLabel;
}

export async function deleteMeasurementLabel(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("measurement_label").delete().eq("id", id);
  if (error) throw error;
}

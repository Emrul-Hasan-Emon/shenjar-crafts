import type { SupabaseClient } from "@supabase/supabase-js";
import type { MeasurementLabelDimension } from "./types";

export type MeasurementLabelDimensionInput = {
  measurement_label_id: string;
  label_en: string;
  label_bn?: string | null;
  description_en?: string | null;
  description_bn?: string | null;
  sort_order?: number;
};

export async function listMeasurementLabelDimensions(
  supabase: SupabaseClient,
  measurementLabelId: string
): Promise<MeasurementLabelDimension[]> {
  const { data, error } = await supabase
    .from("measurement_label_dimensions")
    .select("*")
    .eq("measurement_label_id", measurementLabelId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as MeasurementLabelDimension[];
}

export async function createMeasurementLabelDimension(
  supabase: SupabaseClient,
  input: MeasurementLabelDimensionInput
): Promise<MeasurementLabelDimension> {
  const { data, error } = await supabase
    .from("measurement_label_dimensions")
    .insert({
      measurement_label_id: input.measurement_label_id,
      label_en: input.label_en,
      label_bn: input.label_bn ?? null,
      description_en: input.description_en ?? null,
      description_bn: input.description_bn ?? null,
      sort_order: input.sort_order ?? 0,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as MeasurementLabelDimension;
}

export async function updateMeasurementLabelDimension(
  supabase: SupabaseClient,
  id: string,
  input: Omit<MeasurementLabelDimensionInput, "measurement_label_id">
): Promise<MeasurementLabelDimension> {
  const { data, error } = await supabase
    .from("measurement_label_dimensions")
    .update({
      label_en: input.label_en,
      label_bn: input.label_bn ?? null,
      description_en: input.description_en ?? null,
      description_bn: input.description_bn ?? null,
      sort_order: input.sort_order ?? 0,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as MeasurementLabelDimension;
}

export async function deleteMeasurementLabelDimension(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("measurement_label_dimensions").delete().eq("id", id);
  if (error) throw error;
}

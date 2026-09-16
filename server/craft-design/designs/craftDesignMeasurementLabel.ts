import type { SupabaseClient } from "@supabase/supabase-js";
import type { CraftDesignMeasurementLabel, CraftDesignMeasurementLabelDimension } from "./types";

export type CraftDesignPartDetail = CraftDesignMeasurementLabel & {
  measurement_label: { id: string; name_en: string; name_bn: string | null; default_quantity: number };
  dimensions: Array<
    CraftDesignMeasurementLabelDimension & {
      measurement_label_dimensions: { id: string; label_en: string; label_bn: string | null };
    }
  >;
};

const PART_SELECT =
  "*, measurement_label(id, name_en, name_bn, default_quantity), " +
  "craft_design_measurement_label_dimensions(*, measurement_label_dimensions(id, label_en, label_bn))";

function normalizePart(row: Record<string, unknown>): CraftDesignPartDetail {
  const { craft_design_measurement_label_dimensions, ...part } = row as CraftDesignMeasurementLabel & {
    craft_design_measurement_label_dimensions: CraftDesignPartDetail["dimensions"];
    measurement_label: CraftDesignPartDetail["measurement_label"];
  };
  return { ...part, dimensions: craft_design_measurement_label_dimensions ?? [] } as CraftDesignPartDetail;
}

export async function listCraftDesignParts(
  supabase: SupabaseClient,
  craftsDesignId: string
): Promise<CraftDesignPartDetail[]> {
  const { data, error } = await supabase
    .from("craft_design_measurement_label")
    .select(PART_SELECT)
    .eq("crafts_design_id", craftsDesignId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as unknown as Record<string, unknown>[]).map(normalizePart);
}

/** Adds a measurement label to a design: creates the part row (quantity defaulted from
 * the label) plus one blank dimension-value row per dimension the label defines. When a
 * label has exactly 2 dimensions both default to counting toward area (the only sensible
 * choice); with 3+, none are pre-checked — admin must explicitly pick exactly 2. */
export async function addCraftDesignPart(
  supabase: SupabaseClient,
  craftsDesignId: string,
  measurementLabelId: string
): Promise<CraftDesignPartDetail> {
  const { data: label, error: labelError } = await supabase
    .from("measurement_label")
    .select("default_quantity")
    .eq("id", measurementLabelId)
    .single();
  if (labelError) throw labelError;

  const { data: dimensionDefs, error: dimError } = await supabase
    .from("measurement_label_dimensions")
    .select("id")
    .eq("measurement_label_id", measurementLabelId)
    .order("sort_order", { ascending: true });
  if (dimError) throw dimError;

  const { data: part, error: partError } = await supabase
    .from("craft_design_measurement_label")
    .insert({
      crafts_design_id: craftsDesignId,
      measurement_label_id: measurementLabelId,
      quantity: (label as { default_quantity: number }).default_quantity,
    })
    .select("id")
    .single();
  if (partError) throw partError;

  const dims = dimensionDefs as Array<{ id: string }>;
  const defaultCountsTowardArea = dims.length === 2;
  if (dims.length > 0) {
    const { error: insertDimError } = await supabase.from("craft_design_measurement_label_dimensions").insert(
      dims.map((d) => ({
        craft_design_measurement_label_id: (part as { id: string }).id,
        measurement_label_dimension_id: d.id,
        counts_toward_area: defaultCountsTowardArea,
      }))
    );
    if (insertDimError) throw insertDimError;
  }

  const created = await listCraftDesignParts(supabase, craftsDesignId);
  const result = created.find((p) => p.id === (part as { id: string }).id);
  if (!result) throw new Error("Failed to load the part that was just created.");
  return result;
}

export async function updateCraftDesignPartOverrides(
  supabase: SupabaseClient,
  partId: string,
  input: { color_id?: string | null; thickness_id?: string | null; quantity: number }
): Promise<void> {
  const { error } = await supabase
    .from("craft_design_measurement_label")
    .update({
      color_id: input.color_id ?? null,
      thickness_id: input.thickness_id ?? null,
      quantity: input.quantity,
    })
    .eq("id", partId);
  if (error) throw error;
}

/** Updates every dimension value on a part in one call. Enforces, server-side, that
 * exactly 2 are flagged counts_toward_area — the UI should already prevent this, but the
 * board-sheet math silently produces nonsense with 0, 1, or 3+ flagged, so it's worth a
 * hard backstop here rather than trusting the client. */
export async function updateCraftDesignPartDimensions(
  supabase: SupabaseClient,
  dimensions: Array<{ id: string; value_inches: number; value_shuta: number; counts_toward_area: boolean }>
): Promise<void> {
  const countTrue = dimensions.filter((d) => d.counts_toward_area).length;
  if (countTrue !== 2) {
    throw new Error("Pick exactly 2 measurements to count toward the board-area calculation.");
  }
  await Promise.all(
    dimensions.map((d) =>
      supabase
        .from("craft_design_measurement_label_dimensions")
        .update({
          value_inches: d.value_inches,
          value_shuta: d.value_shuta,
          counts_toward_area: d.counts_toward_area,
        })
        .eq("id", d.id)
        .then(({ error }) => {
          if (error) throw error;
        })
    )
  );
}

export async function removeCraftDesignPart(supabase: SupabaseClient, partId: string): Promise<void> {
  const { error } = await supabase.from("craft_design_measurement_label").delete().eq("id", partId);
  if (error) throw error;
}

/**
 * Assembles the cost breakdown for one Craft Design.
 *
 * This is the only place cost numbers come from — every UI screen that shows a cost figure
 * (`CostBreakdownPanel.tsx`, the invoice page) reads it from here, never computes its own.
 *
 * The work splits into two clear halves, matching the two files involved:
 *   1. FETCH — pull the raw rows this design needs from Supabase (this file, below).
 *   2. CALCULATE — turn those raw rows into board/material costs (`./calculation.ts`, a
 *      plain-TypeScript module with no Supabase calls, so it can be tested on its own).
 *
 * See docs/craft-design.md for the full pipeline explanation and a worked example.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CraftDesignBoardCostLine } from "./types";
import {
  computeBoardCosts,
  computeMaterialCost,
  resolvePart,
  type BoardForCalculation,
  type PartForCalculation,
  type ResolvedPart,
} from "./calculation";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** One board cost line, with the extra display info (color/thickness names) the UI needs
 *  that the calculation itself doesn't care about. */
export type BoardCostLineDetail = CraftDesignBoardCostLine & {
  board: {
    id: string;
    name_en: string | null;
    color: { id: string; name_en: string; name_bn: string | null };
    thickness: { id: string; value_mm: number };
  };
};

export type CraftDesignCostBreakdown = {
  boardLines: BoardCostLineDetail[];
  materialCost: number;
  boardCost: number;
  grandTotal: number;
};

// ---------------------------------------------------------------------------
// Step 1: fetching — one small function per piece of data this calculation needs
// ---------------------------------------------------------------------------

/** A `boards` catalog row, joined with the color/thickness display info the UI shows
 *  alongside every cost line (e.g. "Walnut · 18mm"). */
type BoardWithDisplay = BoardForCalculation & {
  name_en: string | null;
  color: { id: string; name_en: string; name_bn: string | null };
  thickness: { id: string; value_mm: number };
};

/** The exact shape Supabase returns for one `craft_design_measurement_label` row, including
 *  its nested measured dimensions. */
type PartRow = {
  id: string;
  quantity: number;
  color_id: string | null;
  thickness_id: string | null;
  craft_design_measurement_label_dimensions: Array<{
    value_inches: number;
    value_shuta: number;
    counts_toward_area: boolean;
  }>;
};

type MaterialUsageRow = {
  quantity: number;
  material: { unit_price: number } | null;
};

/** How many complete units of the whole design are being built — see docs/craft-design.md
 *  for why this is separate from any one part's own `quantity`. */
async function fetchDesignQuantity(supabase: SupabaseClient, craftsDesignId: string): Promise<number> {
  const { data, error } = await supabase.from("crafts_designs").select("quantity").eq("id", craftsDesignId).single();
  if (error) throw error;
  return (data as { quantity: number }).quantity;
}

/** Every part (measurement label instance) that's been added to this design, with its
 *  measured dimension values and area flags. */
async function fetchParts(supabase: SupabaseClient, craftsDesignId: string): Promise<PartRow[]> {
  const { data, error } = await supabase
    .from("craft_design_measurement_label")
    .select(
      "id, quantity, color_id, thickness_id, " +
        "craft_design_measurement_label_dimensions(value_inches, value_shuta, counts_toward_area)"
    )
    .eq("crafts_design_id", craftsDesignId);
  if (error) throw error;
  return (data ?? []) as unknown as PartRow[];
}

/** Every material (hardware) line added to this design, with its catalog unit price. */
async function fetchMaterialUsage(supabase: SupabaseClient, craftsDesignId: string): Promise<MaterialUsageRow[]> {
  const { data, error } = await supabase
    .from("craft_design_materials")
    .select("quantity, material:materials(unit_price)")
    .eq("crafts_design_id", craftsDesignId);
  if (error) throw error;
  return (data ?? []) as unknown as MaterialUsageRow[];
}

/** The whole `boards` catalog (every priced color+thickness combination that exists), with
 *  display info attached, since a part can match any board, not just ones already in use. */
async function fetchBoardsCatalog(supabase: SupabaseClient): Promise<BoardWithDisplay[]> {
  const { data, error } = await supabase
    .from("boards")
    .select(
      "id, color_id, thickness_id, sheet_length_inches, sheet_length_shuta, " +
        "sheet_width_inches, sheet_width_shuta, price_per_sheet, wastage_percent, name_en, " +
        "color:board_colors(id, name_en, name_bn), thickness:board_thicknesses(id, value_mm)"
    );
  if (error) throw error;
  return (data ?? []) as unknown as BoardWithDisplay[];
}

/** The id of whichever color/thickness catalog row is currently marked as the default — the
 *  fallback a part uses when it doesn't specify its own color/thickness. Either can be
 *  undefined if no catalog row is currently marked default. */
async function fetchDefaultBoardOptionIds(
  supabase: SupabaseClient
): Promise<{ defaultColorId: string | undefined; defaultThicknessId: string | undefined }> {
  const [colorResult, thicknessResult] = await Promise.all([
    supabase.from("board_colors").select("id").eq("is_default", true).maybeSingle(),
    supabase.from("board_thicknesses").select("id").eq("is_default", true).maybeSingle(),
  ]);
  if (colorResult.error) throw colorResult.error;
  if (thicknessResult.error) throw thicknessResult.error;

  return {
    defaultColorId: (colorResult.data as { id: string } | null)?.id,
    defaultThicknessId: (thicknessResult.data as { id: string } | null)?.id,
  };
}

// ---------------------------------------------------------------------------
// Step 2: mapping — reshaping raw database rows into the calculation's input types
// ---------------------------------------------------------------------------

/** Converts one raw `PartRow` from Supabase into the plain shape `resolvePart` expects. */
function toPartForCalculation(row: PartRow): PartForCalculation {
  return {
    craft_design_measurement_label_id: row.id,
    quantity: row.quantity,
    color_id: row.color_id,
    thickness_id: row.thickness_id,
    dimensions: row.craft_design_measurement_label_dimensions,
  };
}

/** Converts one raw `MaterialUsageRow` into `{ quantity, unit_price }`, defaulting a
 *  missing/deleted catalog join to a 0 price rather than throwing — a display concern, not
 *  something that should crash the whole cost breakdown. */
function toMaterialLine(row: MaterialUsageRow): { quantity: number; unit_price: number } {
  return { quantity: row.quantity, unit_price: row.material?.unit_price ?? 0 };
}

/** Attaches display info (board name, color, thickness) to one calculated board cost line,
 *  so the UI has everything it needs to render without a second lookup. */
function toBoardCostLineDetail(line: CraftDesignBoardCostLine, boardById: Map<string, BoardWithDisplay>): BoardCostLineDetail {
  const board = boardById.get(line.board_id);
  if (!board) throw new Error(`Board ${line.board_id} not found while building the cost breakdown.`);
  return {
    ...line,
    board: { id: board.id, name_en: board.name_en, color: board.color, thickness: board.thickness },
  };
}

// ---------------------------------------------------------------------------
// Step 3: orchestration — the one function the rest of the app calls
// ---------------------------------------------------------------------------

/**
 * Computes the full cost breakdown for one Craft Design:
 *   1. Fetch everything needed (design quantity, parts, materials, board catalog, defaults).
 *   2. Resolve every part to a board + area (`resolvePart`, per part).
 *   3. Pool resolved parts by board and price them (`computeBoardCosts`).
 *   4. Price the materials (`computeMaterialCost`).
 *   5. Add board cost + material cost for the grand total.
 */
export async function getCraftDesignCostBreakdown(
  supabase: SupabaseClient,
  craftsDesignId: string
): Promise<CraftDesignCostBreakdown> {
  // 1. Fetch. Every one of these queries is independent of the others, so they run
  // concurrently rather than one-after-another.
  const [designQuantity, partRows, materialRows, boards, { defaultColorId, defaultThicknessId }] = await Promise.all([
    fetchDesignQuantity(supabase, craftsDesignId),
    fetchParts(supabase, craftsDesignId),
    fetchMaterialUsage(supabase, craftsDesignId),
    fetchBoardsCatalog(supabase),
    fetchDefaultBoardOptionIds(supabase),
  ]);

  // 2. Resolve each part to its board + area. A part that doesn't resolve (no matching
  // board, or nothing measured yet) is simply left out — see resolvePart's own comment.
  const resolvedParts: ResolvedPart[] = partRows
    .map((row) => resolvePart(toPartForCalculation(row), boards, defaultColorId, defaultThicknessId))
    .filter((resolved): resolved is ResolvedPart => resolved !== null);

  // 3. Pool by board and price the sheets needed.
  const boardCostLines = computeBoardCosts(craftsDesignId, resolvedParts, boards, designQuantity);
  const boardById = new Map(boards.map((board) => [board.id, board]));
  const boardLines = boardCostLines.map((line) => toBoardCostLineDetail(line, boardById));

  // 4. Price the materials.
  const materialCost = computeMaterialCost(materialRows.map(toMaterialLine), designQuantity);

  // 5. Combine into the final totals the UI displays.
  const boardCost = boardLines.reduce((sum, line) => sum + line.board_cost, 0);

  return { boardLines, materialCost, boardCost, grandTotal: boardCost + materialCost };
}

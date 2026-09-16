import type { SupabaseClient } from "@supabase/supabase-js";
import type { CraftDesignBoardCostLine } from "./types";

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

/**
 * Reads the craft_design_board_costs / craft_design_material_costs views —
 * this is the ONLY place cost numbers come from. The database has already
 * done every calculation (unit conversion, area, wastage, sheet rounding,
 * quantity scaling); this function only reads and joins in display labels.
 */
export async function getCraftDesignCostBreakdown(
  supabase: SupabaseClient,
  craftsDesignId: string
): Promise<CraftDesignCostBreakdown> {
  const [boardCostsResult, materialCostResult] = await Promise.all([
    supabase
      .from("craft_design_board_costs")
      .select(
        "*, board:boards(id, name_en, color:board_colors(id, name_en, name_bn), thickness:board_thicknesses(id, value_mm))"
      )
      .eq("crafts_design_id", craftsDesignId),
    supabase
      .from("craft_design_material_costs")
      .select("material_cost")
      .eq("crafts_design_id", craftsDesignId)
      .maybeSingle(),
  ]);

  if (boardCostsResult.error) throw boardCostsResult.error;
  if (materialCostResult.error) throw materialCostResult.error;

  const boardLines = (boardCostsResult.data ?? []) as BoardCostLineDetail[];
  const boardCost = boardLines.reduce((sum, line) => sum + line.board_cost, 0);
  const materialCost = (materialCostResult.data as { material_cost: number } | null)?.material_cost ?? 0;

  return {
    boardLines,
    materialCost,
    boardCost,
    grandTotal: boardCost + materialCost,
  };
}

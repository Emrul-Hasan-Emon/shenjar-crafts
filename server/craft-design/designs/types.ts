export type CraftsDesign = {
  id: string;
  finance_record_id: string | null;
  name_en: string;
  name_bn: string | null;
  description_en: string | null;
  description_bn: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
};

export type CraftDesignMeasurementLabel = {
  id: string;
  crafts_design_id: string;
  measurement_label_id: string;
  color_id: string | null;
  thickness_id: string | null;
  quantity: number;
  created_at: string;
};

export type CraftDesignMeasurementLabelDimension = {
  id: string;
  craft_design_measurement_label_id: string;
  measurement_label_dimension_id: string;
  value_inches: number;
  value_shuta: number;
  counts_toward_area: boolean;
  created_at: string;
};

export type CraftDesignMaterial = {
  id: string;
  crafts_design_id: string;
  material_id: string;
  quantity: number;
  created_at: string;
};

/** A board cost line, resolved and pooled — one row per (design, board), computed by
 * `computeBoardCosts` in `./calculation.ts`. */
export type CraftDesignBoardCostLine = {
  crafts_design_id: string;
  board_id: string;
  total_area_shuta2: number;
  sheets_needed: number;
  board_cost: number;
};

export type CraftDesignMaterialCost = {
  crafts_design_id: string;
  material_cost: number;
};

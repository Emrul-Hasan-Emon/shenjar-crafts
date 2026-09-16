export type BoardColor = {
  id: string;
  name_en: string;
  name_bn: string | null;
  description_en: string | null;
  description_bn: string | null;
  is_default: boolean;
  sort_order: number;
  created_at: string;
};

export type BoardThickness = {
  id: string;
  value_mm: number;
  is_default: boolean;
  sort_order: number;
  created_at: string;
};

export type Board = {
  id: string;
  name_en: string | null;
  name_bn: string | null;
  description_en: string | null;
  description_bn: string | null;
  color_id: string;
  thickness_id: string;
  sheet_length_inches: number;
  sheet_length_shuta: number;
  sheet_width_inches: number;
  sheet_width_shuta: number;
  price_per_sheet: number;
  wastage_percent: number;
  created_at: string;
};

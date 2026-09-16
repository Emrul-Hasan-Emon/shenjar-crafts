export type MeasurementLabel = {
  id: string;
  name_en: string;
  name_bn: string | null;
  description_en: string | null;
  description_bn: string | null;
  default_quantity: number;
  sort_order: number;
  created_at: string;
};

export type MeasurementLabelDimension = {
  id: string;
  measurement_label_id: string;
  label_en: string;
  label_bn: string | null;
  description_en: string | null;
  description_bn: string | null;
  sort_order: number;
  created_at: string;
};

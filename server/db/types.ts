export type Category = {
  id: string;
  slug: string;
  name_en: string;
  name_bn: string | null;
  banner_path: string | null;
  description_en: string | null;
  description_bn: string | null;
  sort_order: number;
  created_at: string;
};

export type Banner = {
  id: string;
  image_path: string;
  sort_order: number;
  created_at: string;
};

export type Photocard = {
  id: string;
  category_id: string;
  image_path: string;
  width: number | null;
  height: number | null;
  name_en: string | null;
  name_bn: string | null;
  description_en: string | null;
  description_bn: string | null;
  created_at: string;
};

export type MediaKind = "image" | "video";

export type RawMedia = {
  id: string;
  category_id: string;
  kind: MediaKind;
  media_path: string;
  width: number | null;
  height: number | null;
  name_en: string | null;
  name_bn: string | null;
  description_en: string | null;
  description_bn: string | null;
  created_at: string;
};

export type AboutUs = {
  id: string;
  content_en: string | null;
  content_bn: string | null;
  updated_at: string;
};

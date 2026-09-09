export type GalleryCategory = "Furniture" | "Interior" | "Exterior" | "Electrical";

export const GALLERY_CATEGORIES: GalleryCategory[] = [
  "Furniture",
  "Interior",
  "Exterior",
  "Electrical",
];

export function gallerySlugToCategory(slug: string | null): GalleryCategory | "All" {
  const match = GALLERY_CATEGORIES.find((c) => c.toLowerCase() === slug?.toLowerCase());
  return match ?? "All";
}

export function galleryCategoryToSlug(category: GalleryCategory): string {
  return category.toLowerCase();
}

export type GalleryItem = {
  slug: string;
  title: string;
  category: GalleryCategory;
  image: string | null;
};

// `image: null` items don't have a photo yet — they render as a branded
// placeholder tile. Drop a real photo into /public/images/portfolio and set
// the path here to replace one.
export const gallery: GalleryItem[] = [
  {
    slug: "wardrobe-01",
    title: "Custom Wardrobe with Locking Drawers",
    category: "Furniture",
    image: "/images/portfolio/wardrobe-01.jpg",
  },
  {
    slug: "tv-console-wall-unit",
    title: "TV Console & Wall Unit",
    category: "Interior",
    image: null,
  },
  {
    slug: "wall-panel-cabinet",
    title: "Wall Panel with Storage Cabinet",
    category: "Interior",
    image: null,
  },
  {
    slug: "floating-shelf-unit",
    title: "Floating Shelf & Storage Unit",
    category: "Furniture",
    image: null,
  },
  {
    slug: "tall-cabinet",
    title: "Tall Multi-purpose Cabinet",
    category: "Furniture",
    image: null,
  },
  {
    slug: "house-wiring-project",
    title: "House Wiring & Distribution Setup",
    category: "Electrical",
    image: null,
  },
];

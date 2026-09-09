export type ProductCategory =
  | "Furniture"
  | "Interior"
  | "Wall Rack"
  | "Storage"
  | "Study & Office"
  | "Vanity";

export const PRODUCT_CATEGORIES: Array<{ slug: string; label: ProductCategory }> = [
  { slug: "furniture", label: "Furniture" },
  { slug: "interior", label: "Interior" },
  { slug: "wall-rack", label: "Wall Rack" },
  { slug: "storage", label: "Storage" },
  { slug: "study-office", label: "Study & Office" },
  { slug: "vanity", label: "Vanity" },
];

export function categorySlugToLabel(slug: string | null): ProductCategory | "All" {
  if (!slug) return "All";
  return PRODUCT_CATEGORIES.find((c) => c.slug === slug)?.label ?? "All";
}

export function categoryLabelToSlug(label: ProductCategory): string {
  return PRODUCT_CATEGORIES.find((c) => c.label === label)?.slug ?? "";
}

export type Product = {
  slug: string;
  title: string;
  category: ProductCategory;
  image: string;
  width: number;
  height: number;
};

// Designed promotional cards (with pricing/branding baked in) used to show
// what we can build. Real, unedited project photography will replace/join
// these over time — see /portfolio for that. width/height are each image's
// real pixel dimensions, needed so the masonry grid can reserve the right
// space before the image loads.
export const products: Product[] = [
  {
    slug: "furniture-collection",
    title: "Customized Board Furniture Collection",
    category: "Furniture",
    image: "/images/products/furniture-collection.jpg",
    width: 1149,
    height: 1369,
  },
  {
    slug: "furniture-showcase",
    title: "TV Wall Unit & Furniture Showcase",
    category: "Furniture",
    image: "/images/products/furniture-showcase.jpg",
    width: 1254,
    height: 1254,
  },
  {
    slug: "customized-furniture-spaces",
    title: "Customized Furniture for Every Space",
    category: "Interior",
    image: "/images/products/customized-furniture-spaces.jpg",
    width: 1024,
    height: 1416,
  },
  {
    slug: "kitchen-interior-design",
    title: "Custom Kitchen Design",
    category: "Interior",
    image: "/images/products/kitchen-interior-design.jpg",
    width: 1086,
    height: 1448,
  },
  {
    slug: "vanity-dressing-table-large",
    title: "Vanity Dressing Table — 5ft LED Mirror",
    category: "Vanity",
    image: "/images/products/vanity-dressing-table-large.jpg",
    width: 1122,
    height: 1402,
  },
  {
    slug: "vanity-dressing-table-compact",
    title: "Vanity Dressing Table — Compact",
    category: "Vanity",
    image: "/images/products/vanity-dressing-table-compact.jpg",
    width: 1086,
    height: 1448,
  },
  {
    slug: "study-desk",
    title: "Perfect Study Desk",
    category: "Study & Office",
    image: "/images/products/study-desk.jpg",
    width: 1254,
    height: 1254,
  },
  {
    slug: "study-table-with-cabinet",
    title: "Study Table with Cabinet",
    category: "Study & Office",
    image: "/images/products/study-table-with-cabinet.jpg",
    width: 1054,
    height: 1492,
  },
  {
    slug: "office-workstations",
    title: "Office Workstation Partitions",
    category: "Study & Office",
    image: "/images/products/office-workstations.jpg",
    width: 1448,
    height: 1086,
  },
  {
    slug: "bedside-cabinet-walnut",
    title: "Stylish Bedside Cabinet — Walnut",
    category: "Storage",
    image: "/images/products/bedside-cabinet-walnut.png",
    width: 2508,
    height: 2508,
  },
  {
    slug: "bedside-cabinet-white",
    title: "Stylish Bedside Cabinet — White",
    category: "Storage",
    image: "/images/products/bedside-cabinet-white.png",
    width: 2508,
    height: 2508,
  },
  {
    slug: "book-shelf-tall",
    title: "Tall Book Shelf",
    category: "Storage",
    image: "/images/products/book-shelf-tall.jpg",
    width: 1086,
    height: 1448,
  },
  {
    slug: "book-shelf-cube",
    title: "Stylish Cube Book Shelf",
    category: "Storage",
    image: "/images/products/book-shelf-cube.jpg",
    width: 1254,
    height: 1254,
  },
  {
    slug: "wall-rack-house",
    title: "Custom House-Shaped Wall Rack",
    category: "Wall Rack",
    image: "/images/products/wall-rack-house.jpg",
    width: 1254,
    height: 1254,
  },
  {
    slug: "geometric-wall-rack",
    title: "Geometric Series Wall Rack",
    category: "Wall Rack",
    image: "/images/products/geometric-wall-rack.jpg",
    width: 814,
    height: 1312,
  },
  {
    slug: "churi-rack",
    title: "Churi Rack — Bangle Organizer",
    category: "Storage",
    image: "/images/products/churi-rack.jpg",
    width: 1086,
    height: 1448,
  },
];

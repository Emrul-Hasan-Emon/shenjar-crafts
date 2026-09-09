"use client";

import { useRouter, useSearchParams } from "next/navigation";
import GalleryGrid from "./GalleryGrid";
import {
  gallery,
  GALLERY_CATEGORIES,
  gallerySlugToCategory,
  galleryCategoryToSlug,
  type GalleryCategory,
} from "@/data/gallery";

const FILTERS: Array<GalleryCategory | "All"> = ["All", ...GALLERY_CATEGORIES];

export default function PortfolioGallery() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = gallerySlugToCategory(searchParams.get("category"));

  const items =
    active === "All" ? gallery : gallery.filter((item) => item.category === active);

  function selectFilter(filter: (typeof FILTERS)[number]) {
    const slug = filter === "All" ? "" : galleryCategoryToSlug(filter);
    router.replace(slug ? `/portfolio?category=${slug}` : "/portfolio", {
      scroll: false,
    });
  }

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => selectFilter(filter)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              active === filter
                ? "bg-navy text-cream"
                : "bg-white text-navy hover:bg-cream-dark"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="mt-10">
        <GalleryGrid items={items} />
      </div>
    </div>
  );
}

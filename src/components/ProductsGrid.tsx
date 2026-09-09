"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  products,
  PRODUCT_CATEGORIES,
  categorySlugToLabel,
  categoryLabelToSlug,
  type ProductCategory,
} from "@/data/products";

const FILTERS: Array<ProductCategory | "All"> = [
  "All",
  ...PRODUCT_CATEGORIES.map((c) => c.label),
];

export default function ProductsGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = categorySlugToLabel(searchParams.get("category"));

  const items =
    active === "All" ? products : products.filter((p) => p.category === active);

  function selectFilter(filter: (typeof FILTERS)[number]) {
    const slug = filter === "All" ? "" : categoryLabelToSlug(filter);
    router.replace(slug ? `/products?category=${slug}` : "/products", {
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

      <div className="mt-10 columns-1 gap-6 sm:columns-2 lg:columns-3">
        {items.map((product) => (
          <div
            key={product.slug}
            className="group relative mb-6 break-inside-avoid overflow-hidden rounded-2xl border border-border bg-white transition-shadow duration-300 hover:shadow-[0_20px_40px_-24px_rgba(22,41,74,0.25)]"
          >
            <span className="absolute top-4 left-4 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide text-navy uppercase shadow-sm backdrop-blur">
              {product.category}
            </span>
            <Image
              src={product.image}
              alt={product.title}
              width={product.width}
              height={product.height}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

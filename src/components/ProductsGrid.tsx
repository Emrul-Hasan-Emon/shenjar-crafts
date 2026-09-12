"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { pickLocalized, useLanguage } from "@/lib/i18n";
import OrderModal from "./OrderModal";

export type ProductGridItem = {
  id: string;
  categorySlug: string;
  categoryName: string;
  categoryNameBn?: string | null;
  imageUrl: string;
  width: number | null;
  height: number | null;
  name: string | null;
  nameBn?: string | null;
  descriptionEn?: string | null;
  descriptionBn?: string | null;
};

export type ProductGridCategory = { slug: string; name: string; nameBn?: string | null };

export default function ProductsGrid({
  items,
  categories,
}: {
  items: ProductGridItem[];
  categories: ProductGridCategory[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const activeSlug = searchParams.get("category");
  const active = activeSlug ? categories.find((c) => c.slug === activeSlug) : undefined;
  const [selected, setSelected] = useState<ProductGridItem | null>(null);

  const visible = active ? items.filter((p) => p.categorySlug === active.slug) : items;

  function selectFilter(slug: string | null) {
    router.replace(slug ? `/products?category=${slug}` : "/products", { scroll: false });
  }

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => selectFilter(null)}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            !active ? "bg-navy text-cream" : "bg-white text-navy hover:bg-cream-dark"
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.slug}
            type="button"
            onClick={() => selectFilter(category.slug)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              active?.slug === category.slug
                ? "bg-navy text-cream"
                : "bg-white text-navy hover:bg-cream-dark"
            }`}
          >
            {pickLocalized(category.name, category.nameBn, lang)}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-12 text-center text-sm text-ink-soft">
          No products in this category yet — check back soon.
        </p>
      ) : (
        <div className="mt-10 columns-1 gap-6 sm:columns-2 lg:columns-3">
          {visible.map((product) => {
            const categoryName = pickLocalized(product.categoryName, product.categoryNameBn, lang);
            const name = pickLocalized(product.name, product.nameBn, lang);
            return (
              <button
                type="button"
                key={product.id}
                onClick={() => setSelected(product)}
                className="group relative mb-6 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-border bg-white text-left transition-shadow duration-300 hover:shadow-[0_20px_40px_-24px_rgba(22,41,74,0.25)]"
              >
                <span className="absolute top-4 left-4 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide text-navy uppercase shadow-sm backdrop-blur">
                  {categoryName}
                </span>
                {product.width && product.height ? (
                  <Image
                    src={product.imageUrl}
                    alt={name || categoryName}
                    width={product.width}
                    height={product.height}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={product.imageUrl}
                      alt={name || categoryName}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                )}
                {name ? <p className="px-4 py-3 text-sm text-ink-soft">{name}</p> : null}
              </button>
            );
          })}
        </div>
      )}

      <OrderModal
        item={
          selected
            ? {
                title: selected.name,
                titleBn: selected.nameBn,
                description: selected.descriptionEn ?? null,
                descriptionBn: selected.descriptionBn,
                imageUrl: selected.imageUrl,
                kind: "image",
              }
            : null
        }
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeSlug]);

  function selectFilter(slug: string | null) {
    router.replace(slug ? `/products?category=${slug}` : "/products", { scroll: false });
  }

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 border-b border-border bg-cream/95 px-4 py-2 backdrop-blur sm:-mx-8 sm:px-8 xl:top-20">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center">
          <button
            type="button"
            aria-pressed={!active}
            onClick={() => selectFilter(null)}
            className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              !active ? "bg-navy text-cream" : "bg-white text-navy hover:bg-cream-dark"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              aria-pressed={active?.slug === category.slug}
              onClick={() => selectFilter(category.slug)}
              className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active?.slug === category.slug
                  ? "bg-navy text-cream"
                  : "bg-white text-navy hover:bg-cream-dark"
              }`}
            >
              {pickLocalized(category.name, category.nameBn, lang)}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-12 text-center text-sm text-ink-soft">
          No products in this category yet — check back soon.
        </p>
      ) : (
        <div className="mt-4 columns-2 gap-3 sm:mt-6 sm:gap-6 lg:columns-3">
          {visible.map((product) => {
            const categoryName = pickLocalized(product.categoryName, product.categoryNameBn, lang);
            const name = pickLocalized(product.name, product.nameBn, lang);
            return (
              <button
                type="button"
                key={product.id}
                onClick={() => setSelected(product)}
                className="studio-card group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-border bg-white text-left transition-shadow duration-300 sm:mb-6"
              >
                <span className="absolute top-2 left-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-navy uppercase shadow-sm backdrop-blur sm:top-4 sm:left-4 sm:px-3 sm:py-1 sm:text-xs">
                  {categoryName}
                </span>
                {product.width && product.height ? (
                  <Image
                    src={product.imageUrl}
                    alt={name || categoryName}
                    width={product.width}
                    height={product.height}
                    sizes="(min-width: 1024px) 33vw, 50vw"
                    className="aspect-square w-full object-cover sm:aspect-auto sm:h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={product.imageUrl}
                      alt={name || categoryName}
                      fill
                      sizes="(min-width: 1024px) 33vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                )}
                {name ? <p className="px-3 py-2 text-xs text-ink-soft sm:px-4 sm:py-3 sm:text-sm">{name}</p> : null}
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

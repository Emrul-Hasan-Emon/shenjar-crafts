"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { pickLocalized, useLanguage } from "@/lib/i18n";
import OrderModal from "./OrderModal";

export type OurWorkItem = {
  id: string;
  categorySlug: string;
  categoryName: string;
  categoryNameBn?: string | null;
  kind: "image" | "video";
  url: string;
  width: number | null;
  height: number | null;
  name: string | null;
  nameBn?: string | null;
  descriptionEn?: string | null;
  descriptionBn?: string | null;
};

export type OurWorkCategory = { slug: string; name: string; nameBn?: string | null };

export default function OurWorkGrid({
  items,
  categories,
}: {
  items: OurWorkItem[];
  categories: OurWorkCategory[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const activeSlug = searchParams.get("category");
  const active = activeSlug ? categories.find((c) => c.slug === activeSlug) : undefined;
  const [selected, setSelected] = useState<OurWorkItem | null>(null);

  const visible = active ? items.filter((item) => item.categorySlug === active.slug) : items;

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeSlug]);

  function selectFilter(slug: string | null) {
    router.replace(slug ? `/our-work?category=${slug}` : "/our-work", { scroll: false });
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
          No photos from this category yet — check back soon.
        </p>
      ) : (
        <div className="mt-4 columns-2 gap-3 sm:mt-6 sm:gap-6 lg:columns-3">
          {visible.map((item) => {
            const categoryName = pickLocalized(item.categoryName, item.categoryNameBn, lang);
            const name = pickLocalized(item.name, item.nameBn, lang);
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setSelected(item)}
                className="studio-card group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-border bg-white text-left transition-shadow duration-300 sm:mb-6"
              >
                <span className="absolute top-2 left-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-navy uppercase shadow-sm backdrop-blur sm:top-4 sm:left-4 sm:px-3 sm:py-1 sm:text-xs">
                  {categoryName}
                </span>
                {item.kind === "video" ? (
                  <div className="relative aspect-[4/3] w-full bg-ink-dark">
                    <video src={item.url} muted preload="metadata" className="h-full w-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm transition-transform group-hover:scale-[1.03] sm:h-12 sm:w-12">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-4 w-4 sm:h-5 sm:w-5">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </span>
                  </div>
                ) : item.width && item.height ? (
                  <Image
                    src={item.url}
                    alt={name || categoryName}
                    width={item.width}
                    height={item.height}
                    sizes="(min-width: 1024px) 33vw, 50vw"
                    className="aspect-square w-full object-cover sm:aspect-auto sm:h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={item.url}
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
                imageUrl: selected.url,
                kind: selected.kind,
              }
            : null
        }
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

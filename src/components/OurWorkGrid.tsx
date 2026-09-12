"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
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

  function selectFilter(slug: string | null) {
    router.replace(slug ? `/our-work?category=${slug}` : "/our-work", { scroll: false });
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
          No photos from this category yet — check back soon.
        </p>
      ) : (
        <div className="mt-10 columns-1 gap-6 sm:columns-2 lg:columns-3">
          {visible.map((item) => {
            const categoryName = pickLocalized(item.categoryName, item.categoryNameBn, lang);
            const name = pickLocalized(item.name, item.nameBn, lang);
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setSelected(item)}
                className="group relative mb-6 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-border bg-white text-left transition-shadow duration-300 hover:shadow-[0_20px_40px_-24px_rgba(22,41,74,0.25)]"
              >
                <span className="absolute top-4 left-4 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide text-navy uppercase shadow-sm backdrop-blur">
                  {categoryName}
                </span>
                {item.kind === "video" ? (
                  <div className="relative aspect-[4/3] w-full bg-ink-dark">
                    <video src={item.url} muted preload="metadata" className="h-full w-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm transition-transform group-hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
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
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={item.url}
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

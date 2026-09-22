"use client";

import Image from "next/image";
import Link from "next/link";
import PlaceholderTile from "./PlaceholderTile";
import { pickLocalized, useLanguage } from "@/lib/i18n";

export type CategoryTile = {
  slug: string;
  title: string;
  titleBn?: string | null;
  subtitle: string;
  subtitleBn?: string | null;
  href: string;
  imageUrl: string | null;
};

export default function CategoryTiles({ tiles }: { tiles: CategoryTile[] }) {
  const { lang } = useLanguage();

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {tiles.map((tile) => {
        const title = pickLocalized(tile.title, tile.titleBn, lang);
        const subtitle = pickLocalized(tile.subtitle, tile.subtitleBn, lang);
        return (
          <Link
            key={tile.slug}
            href={tile.href}
            className="studio-card group relative block aspect-square sm:aspect-[4/5] overflow-hidden rounded-2xl"
          >
            {tile.imageUrl ? (
              <Image
                src={tile.imageUrl}
                alt={title}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="absolute inset-0">
                <PlaceholderTile category={tile.title} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-dark/90 via-ink-dark/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5">
              <p className="font-display text-sm font-semibold text-white sm:text-lg">{title}</p>
              <p className="mt-1 text-xs leading-snug text-white/85">{subtitle}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-wood-light">
                Explore
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-3.5 w-3.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

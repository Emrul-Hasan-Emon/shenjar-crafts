import Image from "next/image";
import PlaceholderTile from "./PlaceholderTile";
import type { GalleryItem } from "@/data/gallery";

export default function GalleryGrid({ items }: { items: GalleryItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <figure
          key={item.slug}
          className="group overflow-hidden rounded-2xl border border-border bg-white transition-shadow duration-300 hover:shadow-[0_20px_40px_-24px_rgba(22,41,74,0.25)]"
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <PlaceholderTile category={item.category} />
            )}
          </div>
          <figcaption className="flex items-center justify-between gap-3 px-5 py-4">
            <span className="text-sm font-medium text-navy">{item.title}</span>
            <span className="rounded-full bg-wood-soft px-3 py-1 text-xs font-semibold tracking-wide text-wood uppercase">
              {item.category}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

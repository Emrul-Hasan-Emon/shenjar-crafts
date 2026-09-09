import Image from "next/image";
import Link from "next/link";
import { categoryLabelToSlug } from "@/data/products";

const CATEGORIES = [
  {
    title: "Custom Furniture",
    subtitle: "Chairs, beds, wardrobes & more",
    href: `/products?category=${categoryLabelToSlug("Furniture")}`,
    image: "/images/products/furniture-collection.jpg",
    objectPosition: "object-top",
  },
  {
    title: "Interior Design",
    subtitle: "Kitchens, offices & living spaces",
    href: `/products?category=${categoryLabelToSlug("Interior")}`,
    image: "/images/products/kitchen-interior-design.jpg",
    objectPosition: "object-right",
  },
  {
    title: "Wall Racks & Decor",
    subtitle: "Custom shelving, made to size",
    href: `/products?category=${categoryLabelToSlug("Wall Rack")}`,
    image: "/images/products/wall-rack-house.jpg",
    objectPosition: "object-bottom",
  },
  {
    title: "Our Portfolio",
    subtitle: "Real projects, real workmanship",
    href: "/portfolio",
    image: "/images/portfolio/wardrobe-01.jpg",
    objectPosition: "object-center",
  },
];

export default function CategoryTiles() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.title}
          href={cat.href}
          className="group relative block aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_20px_45px_-24px_rgba(12,21,38,0.45)]"
        >
          <Image
            src={cat.image}
            alt={cat.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className={`object-cover ${cat.objectPosition} transition-transform duration-500 group-hover:scale-110`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-dark/90 via-ink-dark/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="font-display text-lg font-semibold text-white">
              {cat.title}
            </p>
            <p className="mt-1 text-xs text-white/70">{cat.subtitle}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-wood-light opacity-0 transition-opacity duration-300 group-hover:opacity-100">
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
      ))}
    </div>
  );
}

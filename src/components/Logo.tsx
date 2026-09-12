import Link from "next/link";

export default function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-baseline gap-2 shrink-0">
      <span
        className={`font-display text-lg font-bold leading-none sm:text-2xl ${
          dark ? "text-cream" : "text-navy"
        }`}
      >
        Shenjar
      </span>
      <span className="text-xs font-semibold tracking-[0.3em] text-wood uppercase leading-none">
        Crafts
      </span>
    </Link>
  );
}

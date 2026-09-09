import Link from "next/link";
import Icon from "./icons";
import type { Service } from "@/data/services";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/services#${service.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-wood/30 hover:shadow-[0_20px_40px_-24px_rgba(22,41,74,0.25)]"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-wood-soft text-wood transition-colors group-hover:bg-wood group-hover:text-white">
        <Icon name={service.icon} className="h-6 w-6" />
      </span>
      <h3 className="font-display mt-5 text-lg font-semibold text-navy">
        {service.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
        {service.summary}
      </p>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-wood">
        Learn more
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-4 w-4 transition-transform group-hover:translate-x-1"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}

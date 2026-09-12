import Link from "next/link";
import Icon from "./icons";
import type { Service } from "@/data/services";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/services#${service.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-wood/30 hover:shadow-[0_20px_40px_-24px_rgba(22,41,74,0.25)] sm:p-7"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-wood-soft text-wood transition-colors group-hover:bg-wood group-hover:text-white sm:h-12 sm:w-12">
        <Icon name={service.icon} className="h-5 w-5 sm:h-6 sm:w-6" />
      </span>
      <h3 className="font-display mt-3 text-base font-semibold text-navy sm:mt-5 sm:text-lg">
        {service.title}
      </h3>
      <p className="mt-1.5 flex-1 text-xs leading-relaxed text-ink-soft sm:mt-2 sm:text-sm">
        {service.summary}
      </p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-wood sm:mt-5 sm:text-sm">
        Learn more
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}

import type { ReactElement, SVGProps } from "react";

export type IconKey =
  | "furniture"
  | "wonder"
  | "interior"
  | "exterior"
  | "electrical"
  | "machine"
  | "fabrication"
  | "custom";

const PATHS: Record<IconKey, ReactElement> = {
  furniture: (
    <path d="M4 10V7a2 2 0 012-2h12a2 2 0 012 2v3M4 10h16M4 10v7m16-7v7M4 17h16M7 17v2m10-2v2" />
  ),
  wonder: (
    <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.5-6.5l-2 2m-9 9l-2 2m0-13l2 2m9 9l2 2M12 8a4 4 0 100 8 4 4 0 000-8z" />
  ),
  interior: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
  exterior: (
    <path d="M3 12l9-8 9 8M6 10.5V21h12V10.5M10 21v-5h4v5" />
  ),
  electrical: <path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" />,
  machine: (
    <path d="M10.3 3.4a2 2 0 013.4 0l.4.9a2 2 0 001.9 1.1l1-.1a2 2 0 012 2.7l-.4.9a2 2 0 000 2l.4.9a2 2 0 01-2 2.7l-1-.1a2 2 0 00-1.9 1.1l-.4.9a2 2 0 01-3.4 0l-.4-.9a2 2 0 00-1.9-1.1l-1 .1a2 2 0 01-2-2.7l.4-.9a2 2 0 000-2l-.4-.9a2 2 0 012-2.7l1 .1a2 2 0 001.9-1.1l.4-.9zM12 15a3 3 0 100-6 3 3 0 000 6z" />
  ),
  fabrication: (
    <path d="M14.7 6.3a1 1 0 010 1.4l-6 6a1 1 0 01-1.4 0l-1-1a1 1 0 010-1.4l6-6a1 1 0 011.4 0l1 1zM17 3l4 4-2 2-4-4 2-2zM3 21l3.5-1 8-8-2.5-2.5-8 8L3 21z" />
  ),
  custom: (
    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707M8 17a4 4 0 118 0c0 1.5-1 2-1 3.5H9c0-1.5-1-2-1-3.5z" />
  ),
};

export default function Icon({
  name,
  className,
  ...rest
}: { name: IconKey } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

const NAME_ICON_HINTS: Array<{ icon: IconKey; keywords: string[] }> = [
  { icon: "interior", keywords: ["interior", "kitchen", "room"] },
  { icon: "exterior", keywords: ["exterior", "outdoor"] },
  { icon: "electrical", keywords: ["electrical", "wiring"] },
  { icon: "machine", keywords: ["machine", "equipment"] },
  { icon: "fabrication", keywords: ["rack", "shelf", "fabrication"] },
  {
    icon: "furniture",
    keywords: [
      "furniture",
      "cabinet",
      "table",
      "storage",
      "vanity",
      "study",
      "office",
      "chair",
      "sofa",
      "bed",
    ],
  },
];

/**
 * Categories are free-form (admin-created), so there's no fixed name->icon
 * map any more — just a best-effort keyword guess, falling back to a generic
 * mark. Used by PlaceholderTile and anywhere a category has no banner image.
 */
export function iconForCategoryName(name: string): IconKey {
  const lower = name.toLowerCase();
  for (const { icon, keywords } of NAME_ICON_HINTS) {
    if (keywords.some((k) => lower.includes(k))) return icon;
  }
  return "custom";
}

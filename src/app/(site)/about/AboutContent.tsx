"use client";

import { pickLocalized, useLanguage } from "@/lib/i18n";

export default function AboutContent({
  contentEn,
  contentBn,
  fallbackParagraphs,
}: {
  contentEn: string | null;
  contentBn: string | null;
  fallbackParagraphs: string[];
}) {
  const { lang } = useLanguage();
  const text = pickLocalized(contentEn, contentBn, lang);
  const paragraphs = text.trim()
    ? text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    : fallbackParagraphs;

  return (
    <div className="mt-8 max-w-3xl space-y-5">
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="text-base leading-relaxed text-ink-soft sm:text-lg">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

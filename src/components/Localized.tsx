"use client";

import { pickLocalized, useLanguage } from "@/lib/i18n";

/** Drop-in inline text that follows the site language toggle, without converting the parent to a client component. */
export default function Localized({ en, bn }: { en: string | null | undefined; bn?: string | null }) {
  const { lang } = useLanguage();
  return <>{pickLocalized(en, bn, lang)}</>;
}

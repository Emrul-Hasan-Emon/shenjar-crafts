"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { site } from "@/data/site";
import { pickLocalized, useLanguage } from "@/lib/i18n";

export type ModalItem = {
  title: string | null;
  titleBn?: string | null;
  description: string | null;
  descriptionBn?: string | null;
  imageUrl: string;
  kind?: "image" | "video";
};

export default function OrderModal({ item, onClose }: { item: ModalItem | null; onClose: () => void }) {
  if (!item) return null;
  // Keying on the item swaps in a fresh component instance per item, so
  // internal state (showOrderOptions) naturally resets — no effect needed.
  return <OrderModalContent key={item.imageUrl} item={item} onClose={onClose} />;
}

function OrderModalContent({ item, onClose }: { item: ModalItem; onClose: () => void }) {
  const { lang } = useLanguage();
  const [showOrderOptions, setShowOrderOptions] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = pickLocalized(item.title, item.titleBn, lang);
  const description = pickLocalized(item.description, item.descriptionBn, lang);
  const whatsappMessage = title
    ? `Hi, I'm interested in ordering: ${title}`
    : "Hi, I'm interested in ordering this item.";
  const whatsappHref = `${site.whatsappHref}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-dark/70 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="relative aspect-[4/3] w-full bg-cream-dark/40">
          {item.kind === "video" ? (
            <video src={item.imageUrl} controls autoPlay className="h-full w-full bg-ink-dark object-contain" />
          ) : (
            <Image
              src={item.imageUrl}
              alt={title || ""}
              fill
              sizes="(min-width: 640px) 512px, 100vw"
              className="object-contain"
            />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm transition-colors hover:bg-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {title ? <h3 className="font-display text-lg font-semibold text-navy">{title}</h3> : null}
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>
          ) : null}

          {!showOrderOptions ? (
            <button
              type="button"
              onClick={() => setShowOrderOptions(true)}
              className="mt-5 w-full rounded-full bg-wood px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-wood-light"
            >
              Order Now
            </button>
          ) : (
            <div className="mt-5">
              <p className="mb-3 text-xs font-semibold tracking-wide text-ink-soft uppercase">
                Continue on
              </p>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                >
                  WhatsApp
                </a>
                <a
                  href={site.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Facebook
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

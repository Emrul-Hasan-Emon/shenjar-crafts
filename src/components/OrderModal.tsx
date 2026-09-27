"use client";

import { useEffect, useRef, useState } from "react";
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
  price?: number | null;
  discountedPrice?: number | null;
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

  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const title = pickLocalized(item.title, item.titleBn, lang);
  const description = pickLocalized(item.description, item.descriptionBn, lang);
  const activePrice = item.discountedPrice ?? item.price ?? null;
  const hasDiscount = item.discountedPrice !== null && item.discountedPrice !== undefined && item.price !== null && item.price !== undefined && item.discountedPrice < item.price;
  const formatPrice = (value: number | null | undefined) =>
    value === null || value === undefined ? null : `৳${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  const whatsappMessage = title
    ? `Hi, I'd like to discuss a custom piece inspired by: ${title}`
    : "Hi, I'd like to discuss a custom piece inspired by this design.";
  const whatsappHref = `${site.whatsappHref}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <dialog
      ref={dialogRef}
      aria-label={title || "Product details"}
      onCancel={onClose}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-lg bg-white p-0 shadow-2xl backdrop:bg-ink-dark/70"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl"
      >
        <div className="relative aspect-[4/3] max-h-[45dvh] w-full bg-cream-dark/40">
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
            className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm transition-colors hover:bg-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {title ? <h3 className="font-display text-lg font-semibold text-navy">{title}</h3> : null}
          <div className="mt-2 flex items-baseline gap-2">
            {activePrice !== null ? (
              <>
                <span className="text-lg font-semibold text-navy">{formatPrice(activePrice)}</span>
                {hasDiscount ? <span className="text-sm text-ink-soft line-through">{formatPrice(item.price)}</span> : null}
              </>
            ) : (
              <span className="text-sm font-semibold text-wood">Contact for price</span>
            )}
          </div>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>
          ) : null}

          {!showOrderOptions ? (
            <button
              type="button"
              onClick={() => setShowOrderOptions(true)}
              className="mt-5 w-full rounded-full bg-wood px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy"
            >
              Discuss This Piece
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
                  className="flex items-center justify-center gap-2 rounded-full bg-navy px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
                >
                  WhatsApp
                </a>
                <a
                  href={site.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-wood px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy"
                >
                  Facebook
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type BannerSlide = { id: string; url: string };

export default function BannerSlider({
  slides,
  fallbackUrl,
  className = "",
}: {
  slides: BannerSlide[];
  fallbackUrl?: string;
  className?: string;
}) {
  const items: BannerSlide[] =
    slides.length > 0
      ? slides
      : fallbackUrl
        ? [{ id: "fallback", url: fallbackUrl }]
        : [];

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (items.length <= 1 || paused) return;
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length, paused]);

  if (items.length === 0) return null;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl shadow-[0_30px_60px_-20px_rgba(22,41,74,0.25)] ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {items.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === active ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {/* Blurred, zoomed copy fills the box so there's never empty letterbox space... */}
          <Image
            src={slide.url}
            alt=""
            fill
            aria-hidden
            priority={i === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="scale-110 object-cover opacity-60 blur-2xl"
          />
          {/* ...while the sharp image sits on top, fully visible, never cropped. */}
          <Image
            src={slide.url}
            alt=""
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-contain"
          />
        </div>
      ))}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-dark/40 via-transparent to-transparent" />

      {items.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => setActive((i) => (i - 1 + items.length) % items.length)}
            className="absolute top-1/2 left-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-navy shadow-sm transition-colors hover:bg-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => setActive((i) => (i + 1) % items.length)}
            className="absolute top-1/2 right-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-navy shadow-sm transition-colors hover:bg-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {items.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setActive(i)}
                className={`h-2 rounded-full transition-all ${
                  i === active ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

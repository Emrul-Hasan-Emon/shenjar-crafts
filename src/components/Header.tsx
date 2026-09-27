"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Container from "./Container";
import Logo from "./Logo";
import { site } from "@/data/site";
import { useLanguage } from "@/lib/i18n";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/products", label: "Our Craft" },
  { href: "/our-work", label: "Projects" },
  // "Design Studio" nav link hidden by request — page still exists at
  // /design-studio, just not linked anywhere, until we revisit it.
  { href: "/contact", label: "Contact" },
];

function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  return (
    <div className={`flex items-center rounded-full border border-navy/15 p-0.5 text-xs font-semibold ${className}`}>
      <button
        type="button"
        aria-pressed={lang === "en"}
        onClick={() => setLang("en")}
        className={`min-h-9 rounded-full px-2.5 py-1 transition-colors ${lang === "en" ? "bg-navy text-cream" : "text-navy"}`}
      >
        EN
      </button>
      <button
        type="button"
        aria-pressed={lang === "bn"}
        onClick={() => setLang("bn")}
        className={`min-h-9 rounded-full px-2.5 py-1 transition-colors ${lang === "bn" ? "bg-navy text-cream" : "text-navy"}`}
      >
        বাং
      </button>
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-cream/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-3 xl:h-20">
        <Logo />

        <nav className="hidden items-center gap-5 xl:flex">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                aria-current={active ? "page" : undefined}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-wood ${
                  active ? "text-wood" : "text-navy"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <LanguageToggle />
          <Link
            href="/partner/login"
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-navy/30 hover:bg-navy/5"
          >
            Partner Portal
          </Link>
          <a
            href={site.phoneHref}
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-navy/30 hover:bg-navy/5"
          >
            {site.phoneDisplay}
          </a>
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-wood px-5 py-2.5 text-sm font-semibold text-white  transition-colors hover:bg-navy"
          >
            Let’s Talk
          </a>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-md text-navy xl:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-6 w-6"
          >
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </Container>

      {open ? (
        <div id="mobile-navigation" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-cream xl:hidden">
          <Container className="grid grid-cols-2 gap-2 py-3">
            <LanguageToggle className="col-span-2 mb-1 w-fit" />
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === link.href ? "page" : undefined}
                className={`rounded-xl px-3 py-3 text-sm font-medium ${pathname === link.href ? "bg-navy text-cream" : "bg-white/60 text-navy hover:bg-cream-dark"}`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/partner/login"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-navy/10 bg-white/70 px-3 py-3 text-sm font-semibold text-navy hover:bg-cream-dark"
            >
              Partner Portal
            </Link>
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 mt-2 rounded-full bg-wood px-5 py-2.5 text-center text-sm font-semibold text-white"
            >
              WhatsApp: {site.phoneDisplay}
            </a>
          </Container>
        </div>
      ) : null}
    </header>
  );
}

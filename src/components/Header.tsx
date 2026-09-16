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
  { href: "/products", label: "Products" },
  { href: "/our-work", label: "Our Work" },
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
        onClick={() => setLang("en")}
        className={`rounded-full px-2.5 py-1 transition-colors ${lang === "en" ? "bg-navy text-cream" : "text-navy"}`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("bn")}
        className={`rounded-full px-2.5 py-1 transition-colors ${lang === "bn" ? "bg-navy text-cream" : "text-navy"}`}
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
    <header className="sticky top-0 z-50 border-b border-border bg-cream/90 backdrop-blur">
      <Container className="flex h-20 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
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

        <div className="hidden items-center gap-3 md:flex">
          <LanguageToggle />
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
            className="rounded-full bg-wood px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-wood/20 transition-colors hover:bg-wood-light"
          >
            WhatsApp
          </a>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-navy md:hidden"
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
        <div className="border-t border-border bg-cream md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            <LanguageToggle className="mb-2 w-fit" />
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-navy hover:bg-cream-dark"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 rounded-full bg-wood px-5 py-2.5 text-center text-sm font-semibold text-white"
            >
              WhatsApp: {site.phoneDisplay}
            </a>
          </Container>
        </div>
      ) : null}
    </header>
  );
}

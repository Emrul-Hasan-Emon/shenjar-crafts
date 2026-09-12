"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/photocards", label: "Photocards" },
  { href: "/admin/raw-media", label: "Raw Media" },
  { href: "/admin/about-us", label: "About Us" },
  { href: "/admin/finance", label: "Finance" },
];

export default function AdminNav({
  userEmail,
  signOutAction,
}: {
  userEmail: string | null;
  signOutAction: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname?.startsWith(href);
  }

  return (
    <header className="border-b border-border bg-white print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/admin" className="font-display text-lg font-bold text-navy">
          Shenjar Admin
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium hover:bg-cream-dark ${
                isActive(item.href) ? "bg-cream-dark text-wood" : "text-navy"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 text-sm text-ink-soft md:flex">
          {userEmail ? <span>{userEmail}</span> : null}
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-full border border-navy/15 px-4 py-1.5 font-semibold text-navy hover:bg-cream-dark"
            >
              Sign out
            </button>
          </form>
          <Link href="/" className="text-wood hover:underline">
            View site
          </Link>
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
      </div>

      {open ? (
        <div className="border-t border-border bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2.5 text-sm font-medium hover:bg-cream-dark ${
                  isActive(item.href) ? "bg-cream-dark text-wood" : "text-navy"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-4 text-sm text-ink-soft">
              {userEmail ? <span className="truncate">{userEmail}</span> : <span />}
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="shrink-0 rounded-full border border-navy/15 px-4 py-1.5 font-semibold text-navy hover:bg-cream-dark"
                >
                  Sign out
                </button>
              </form>
            </div>
            <Link href="/" onClick={() => setOpen(false)} className="mt-1 text-sm text-wood hover:underline">
              View site
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

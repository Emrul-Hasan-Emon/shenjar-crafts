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
  { href: "/admin/boards", label: "Boards" },
  { href: "/admin/materials", label: "Materials" },
  { href: "/admin/measurement-labels", label: "Measurement Labels" },
  { href: "/admin/craft-designs", label: "Craft Designs" },
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
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-white print:hidden md:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-2">
          <Link href="/admin" className="font-display text-lg font-bold text-navy">
            Shenjar Admin
          </Link>
          <button
            type="button"
            aria-label={open ? "Close admin menu" : "Open admin menu"}
            aria-expanded={open}
            aria-controls="admin-mobile-navigation"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-navy"
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
          <div id="admin-mobile-navigation" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-white">
            <div className="grid grid-cols-2 gap-2 px-4 py-3">
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
              <div className="col-span-2 mt-2 flex items-center justify-between gap-3 border-t border-border pt-4 text-sm text-ink-soft">
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
              <Link href="/" onClick={() => setOpen(false)} className="col-span-2 mt-1 text-sm text-wood hover:underline">
                View site
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 h-dvh hidden shrink-0 border-r border-border bg-white print:hidden md:flex md:w-60 md:flex-col">
        <div className="border-b border-border px-5 py-5">
          <Link href="/admin" className="font-display text-lg font-bold text-navy">
            Shenjar Admin
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium hover:bg-cream-dark ${
                isActive(item.href) ? "bg-cream-dark text-wood" : "text-navy"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-3 border-t border-border px-5 py-4 text-sm text-ink-soft">
          {userEmail ? <p className="truncate">{userEmail}</p> : null}
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-full border border-navy/15 px-4 py-1.5 font-semibold text-navy hover:bg-cream-dark"
            >
              Sign out
            </button>
          </form>
          <Link href="/" className="block text-wood hover:underline">
            View site
          </Link>
        </div>
      </aside>
    </>
  );
}

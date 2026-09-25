"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/partner", label: "Dashboard" },
  { href: "/partner/orders", label: "My Orders" },
];

export default function PartnerNav({
  partnerName,
  partnerCode,
  signOutAction,
}: {
  partnerName: string;
  partnerCode: string;
  signOutAction: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return href === "/partner" ? pathname === "/partner" : pathname?.startsWith(href);
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-white md:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-2">
          <Link href="/partner" className="font-display text-lg font-bold text-navy">
            Partner Portal
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
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
          <div className="border-t border-border bg-white">
            <div className="flex flex-col gap-1 px-4 py-3">
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
                <span className="truncate">
                  {partnerName} &middot; {partnerCode}
                </span>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="shrink-0 rounded-full border border-navy/15 px-4 py-1.5 font-semibold text-navy hover:bg-cream-dark"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 h-dvh hidden shrink-0 border-r border-border bg-white md:flex md:w-60 md:flex-col">
        <div className="border-b border-border px-5 py-5">
          <Link href="/partner" className="font-display text-lg font-bold text-navy">
            Partner Portal
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
          <p className="truncate font-semibold text-navy">{partnerName}</p>
          <p className="truncate text-xs">Code: {partnerCode}</p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-full border border-navy/15 px-4 py-1.5 font-semibold text-navy hover:bg-cream-dark"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

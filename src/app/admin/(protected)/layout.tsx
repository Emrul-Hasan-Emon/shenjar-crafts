import type { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@server/supabase/server-client";
import { signOutAction } from "./actions";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/photocards", label: "Photocards" },
  { href: "/admin/raw-media", label: "Raw Media" },
  { href: "/admin/about-us", label: "About Us" },
  { href: "/admin/finance", label: "Finance" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-cream-dark/30 print:bg-white">
      <header className="border-b border-border bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/admin" className="font-display text-lg font-bold text-navy">
              Shenjar Admin
            </Link>
            <nav className="flex flex-wrap gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-navy hover:bg-cream-dark"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-soft">
            {user?.email ? <span>{user.email}</span> : null}
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
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}

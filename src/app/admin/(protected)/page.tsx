import Link from "next/link";
import { createClient } from "@server/supabase/server-client";
import { listCategories } from "@server/db/categories";
import { listBanners, MAX_BANNERS } from "@server/db/banners";
import { listPhotocards } from "@server/db/photocards";
import { listRawMedia } from "@server/db/rawMedia";
import { listFinanceRecords } from "@server/db/finance";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [categories, banners, photocards, rawMedia, financeRecords] = await Promise.all([
    listCategories(supabase),
    listBanners(supabase),
    listPhotocards(supabase),
    listRawMedia(supabase),
    listFinanceRecords(supabase),
  ]);

  const cards = [
    { label: "Banners", count: banners.length, hint: `max ${MAX_BANNERS}`, href: "/admin/banners" },
    { label: "Categories", count: categories.length, href: "/admin/categories" },
    { label: "Photocards", count: photocards.length, href: "/admin/photocards" },
    { label: "Raw Media", count: rawMedia.length, href: "/admin/raw-media" },
    { label: "Finance Records", count: financeRecords.length, href: "/admin/finance" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Manage everything shown on the live site from here.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-border bg-white p-6 transition-shadow hover:shadow-[0_20px_40px_-28px_rgba(22,41,74,0.3)]"
          >
            <p className="text-sm font-semibold tracking-wide text-wood uppercase">{card.label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-navy">
              {card.count}
              {card.hint ? <span className="ml-2 text-sm font-normal text-ink-soft">{card.hint}</span> : null}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-white p-6">
        <Link href="/admin/about-us" className="text-sm font-semibold text-wood hover:underline">
          Edit About Us content →
        </Link>
      </div>
    </div>
  );
}

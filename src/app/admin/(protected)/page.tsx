import Link from "next/link";
import { createClient } from "@server/supabase/server-client";
import { listCategories } from "@server/db/categories";
import { listBanners, MAX_BANNERS } from "@server/db/banners";
import { listPhotocards } from "@server/db/photocards";
import { listRawMedia } from "@server/db/rawMedia";
import { listFinanceRecords } from "@server/db/finance";
import { getAdminPartnerStats } from "@server/partners/dashboard";
import AdminInstallBanner from "./_components/AdminInstallBanner";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [categories, banners, products, rawMedia, financeRecords, partnerStats] = await Promise.all([
    listCategories(supabase),
    listBanners(supabase),
    listPhotocards(supabase),
    listRawMedia(supabase),
    listFinanceRecords(supabase),
    getAdminPartnerStats(supabase),
  ]);

  const cards = [
    { label: "Banners", count: banners.length, hint: `max ${MAX_BANNERS}`, href: "/admin/banners" },
    { label: "Categories", count: categories.length, href: "/admin/categories" },
    { label: "Products", count: products.length, href: "/admin/products" },
    { label: "Raw Media", count: rawMedia.length, href: "/admin/raw-media" },
    { label: "Finance Records", count: financeRecords.length, href: "/admin/finance" },
    { label: "Partners", count: partnerStats.totalPartners, href: "/admin/partners" },
  ];

  return (
    <div>
      <div className="panel-dashboard-intro"><div><p className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">Workspace overview</p>
      <h1 className="font-display text-2xl font-semibold text-navy">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Manage your workshop, business, and website in one place.
      </p></div><div className="panel-quick-actions"><Link href="/admin/finance/projects/new">+ New project</Link><Link href="/admin/craft-designs">Open workshop</Link></div></div>

      <AdminInstallBanner />

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="panel-stat"
          >
            <p className="text-xs font-semibold tracking-wide text-wood uppercase sm:text-sm">{card.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">
              {card.count}
              {card.hint ? <span className="ml-2 text-xs font-normal text-ink-soft sm:text-sm">{card.hint}</span> : null}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-white p-6">
        <Link href="/admin/about-us" className="text-sm font-semibold text-wood hover:underline">
          Update your studio story →
        </Link>
      </div>
    </div>
  );
}

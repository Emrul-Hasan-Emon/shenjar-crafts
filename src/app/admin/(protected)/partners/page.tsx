import Link from "next/link";
import { createClient } from "@server/supabase/server-client";
import { listPartners } from "@server/partners/partners";
import { getAdminPartnerStats } from "@server/partners/dashboard";
import PartnersList from "./PartnersList";

const PAGE_SIZE = 20;

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; active?: string }>;
}) {
  const { page: pageParam, search, active } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const isActive = active === "true" ? true : active === "false" ? false : undefined;

  const supabase = await createClient();
  const [{ data: partners, count }, stats] = await Promise.all([
    listPartners(supabase, { page, pageSize: PAGE_SIZE, search, isActive }),
    getAdminPartnerStats(supabase),
  ]);

  const statCards = [
    { label: "Total Partners", value: stats.totalPartners },
    { label: "Total Orders", value: stats.totalOrders },
    { label: "Delivered Orders", value: stats.totalDeliveredOrders },
    { label: "Total Commission", value: `৳${stats.totalCommission.toFixed(2)}` },
    { label: "Total Discount", value: `৳${stats.totalDiscount.toFixed(2)}` },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">Partners</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Referral partners — their unique code, commission/discount configuration, and their Projects.
          </p>
        </div>
        <Link
          href="/admin/partners/new"
          className="rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white hover:bg-wood-light"
        >
          + New Partner
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-white p-4 sm:p-6">
            <p className="text-xs font-semibold tracking-wide text-wood uppercase sm:text-sm">{card.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <PartnersList
          partners={partners}
          count={count}
          page={page}
          pageSize={PAGE_SIZE}
          search={search ?? ""}
          isActive={isActive}
        />
      </div>
    </div>
  );
}

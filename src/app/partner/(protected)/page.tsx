import Link from "next/link";
import { createClient } from "@server/supabase/server-client";
import { getPartnerByUserId } from "@server/partners/partners";

export default async function PartnerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const partner = user ? await getPartnerByUserId(supabase, user.id) : null;
  const config = partner?.config;

  const cards = [
    { label: "Total Orders", value: config?.total_orders ?? 0 },
    { label: "Delivered", value: config?.total_delivered_orders ?? 0 },
    { label: "Commission Earned", value: `৳${(config?.total_commission ?? 0).toFixed(2)}` },
    { label: "Customer Discount Given", value: `৳${(config?.total_discount ?? 0).toFixed(2)}` },
  ];

  return (
    <div>
      <div className="panel-dashboard-intro"><div><p className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">Partner overview</p>
      <h1 className="font-display text-2xl font-semibold text-navy">Welcome, {partner?.name}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {partner?.organization_name ?? partner?.institution ?? "—"} &middot; Partner code{" "}
        <span className="font-semibold text-wood">{config?.code ?? "—"}</span>
      </p></div><div className="panel-quick-actions"><Link href="/partner/orders/new">+ New order</Link><Link href="/partner/orders">View orders</Link></div></div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="panel-stat">
            <p className="text-xs font-semibold tracking-wide text-wood uppercase sm:text-sm">{card.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-navy">Your commission &amp; discount</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Commission</dt>
            <dd className="mt-1 text-lg font-semibold text-navy">
              {config ? `${config.commission}${config.commission_type === "percentage" ? "%" : " ৳"} per delivered order` : "Not configured"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Customer discount</dt>
            <dd className="mt-1 text-lg font-semibold text-navy">
              {config ? `${config.discount}${config.discount_type === "percentage" ? "%" : " ৳"} per order` : "Not configured"}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-ink-soft">
          Commission is only earned once an order is delivered — pending and in-progress orders don&apos;t
          count toward the totals above yet.
        </p>
      </div>
    </div>
  );
}

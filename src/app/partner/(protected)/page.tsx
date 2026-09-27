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
    { label: "Orders", value: config?.total_orders ?? 0, hint: "Total created" },
    { label: "Delivered", value: config?.total_delivered_orders ?? 0, hint: "Completed" },
    { label: "Commission", value: `৳${(config?.total_commission ?? 0).toFixed(2)}`, hint: "Earned" },
    { label: "Discount", value: `৳${(config?.total_discount ?? 0).toFixed(2)}`, hint: "Given to customers" },
  ];

  return (
    <div className="partner-dashboard">
      <div className="partner-hero">
        <div className="min-w-0">
          <p className="partner-eyebrow">Partner overview</p>
          <h1 className="font-display text-2xl font-semibold text-navy">Welcome, {partner?.name}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {partner?.organization_name ?? partner?.institution ?? "Shenjar Crafts partner"}
          </p>
        </div>
        <div className="partner-code-card" aria-label="Partner code">
          <span>Partner code</span>
          <strong>{config?.code ?? "—"}</strong>
        </div>
        <div className="panel-quick-actions partner-primary-actions">
          <Link href="/partner/orders/new">+ New order</Link>
          <Link href="/partner/orders">View orders</Link>
        </div>
      </div>

      <div className="partner-stat-grid">
        {cards.map((card) => (
          <div key={card.label} className="panel-stat">
            <p>{card.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">{card.value}</p>
            <span>{card.hint}</span>
          </div>
        ))}
      </div>

      <div className="partner-rate-card rounded-2xl border border-border bg-white p-6">
        <div>
          <p className="partner-eyebrow">Active rates</p>
          <h2 className="font-display text-lg font-semibold text-navy">Commission &amp; customer discount</h2>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Commission</dt>
            <dd className="mt-1 text-lg font-semibold text-navy">
              {config ? `${config.commission}${config.commission_type === "percentage" ? "%" : " ৳"}` : "—"}
            </dd>
            <p className="mt-1 text-xs text-ink-soft">per delivered order</p>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Customer discount</dt>
            <dd className="mt-1 text-lg font-semibold text-navy">
              {config ? `${config.discount}${config.discount_type === "percentage" ? "%" : " ৳"}` : "—"}
            </dd>
            <p className="mt-1 text-xs text-ink-soft">applies per order</p>
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

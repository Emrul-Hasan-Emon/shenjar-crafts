import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@server/supabase/server-client";
import { getPartnerByUserId } from "@server/partners/partners";
import { listPartnerOrders } from "@server/partners/orders";

const PAGE_SIZE = 20;

function money(value: number) {
  return `৳${value.toFixed(2)}`;
}

function statusClass(status: string | null | undefined) {
  if (status === "delivered") return "partner-status success";
  if (status === "cancelled") return "partner-status danger";
  if (status === "in_progress") return "partner-status info";
  return "partner-status muted";
}

function commissionClass(status: string | null | undefined) {
  if (status === "earned") return "partner-status success";
  if (status === "unearned") return "partner-status danger";
  return "partner-status muted";
}

export default async function PartnerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/partner/login");
  const partner = await getPartnerByUserId(supabase, user.id);
  if (!partner) redirect("/partner/login");

  const { data: orders, count } = await listPartnerOrders(supabase, partner.id, { page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="partner-orders-page">
      <div className="partner-page-header">
        <div>
          <p className="partner-eyebrow">Order tracking</p>
          <h1 className="font-display text-2xl font-semibold text-navy">My Orders</h1>
          <p className="mt-1 text-sm text-ink-soft">Orders you created, or Admin created on your behalf.</p>
        </div>
        <Link href="/partner/orders/new" className="partner-action-button">
          + New Order
        </Link>
      </div>

      <div className="partner-mobile-orders" aria-label="Partner order cards">
        {orders.map((o) => (
          <article key={o.id} className="partner-order-card">
            <div className="partner-order-card-top">
              <div className="min-w-0">
                <h2>{o.name}</h2>
                <p>{o.category}</p>
              </div>
              <span className={statusClass(o.status)}>{o.status ?? "Pending"}</span>
            </div>
            <div className="partner-order-amount">{money(o.total_amount)}</div>
            <dl>
              <div>
                <dt>Your commission</dt>
                <dd>{money(o.commission_amount)}</dd>
              </div>
              <div>
                <dt>Customer discount</dt>
                <dd>{money(o.discount_amount)}</dd>
              </div>
            </dl>
            <div className="partner-order-card-foot">
              <span>Commission status</span>
              <span className={commissionClass(o.commission_status)}>{o.commission_status}</span>
            </div>
          </article>
        ))}
        {orders.length === 0 ? (
          <div className="partner-empty-card">
            <h2>No orders yet</h2>
            <p>Create your first order and it will appear here with commission and discount details.</p>
            <Link href="/partner/orders/new">Create order</Link>
          </div>
        ) : null}
      </div>

      <div className="partner-desktop-table mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-cream-dark/40 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total Amount</th>
              <th className="px-4 py-3">Your Commission</th>
              <th className="px-4 py-3">Customer Discount</th>
              <th className="px-4 py-3">Commission Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 align-top">
                  <p className="font-semibold text-navy">{o.name}</p>
                  <p className="text-xs text-ink-soft">{o.category}</p>
                </td>
                <td className="px-4 py-3 align-top capitalize"><span className={statusClass(o.status)}>{o.status ?? "Pending"}</span></td>
                <td className="px-4 py-3 align-top font-semibold text-navy">{money(o.total_amount)}</td>
                <td className="px-4 py-3 align-top">{money(o.commission_amount)}</td>
                <td className="px-4 py-3 align-top">{money(o.discount_amount)}</td>
                <td className="px-4 py-3 align-top"><span className={commissionClass(o.commission_status)}>{o.commission_status}</span></td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No orders yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="partner-pagination">
          <span>
            Page {page} of {totalPages} &middot; {count} order{count === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <Link
              href={`/partner/orders?page=${page - 1}`}
              aria-disabled={page <= 1}
              className={`rounded-lg border border-border px-3 py-1.5 font-semibold text-navy ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
            >
              Previous
            </Link>
            <Link
              href={`/partner/orders?page=${page + 1}`}
              aria-disabled={page >= totalPages}
              className={`rounded-lg border border-border px-3 py-1.5 font-semibold text-navy ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
            >
              Next
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

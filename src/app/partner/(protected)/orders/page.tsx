import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@server/supabase/server-client";
import { getPartnerByUserId } from "@server/partners/partners";
import { listPartnerOrders } from "@server/partners/orders";

const PAGE_SIZE = 20;

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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">My Orders</h1>
          <p className="mt-1 text-sm text-ink-soft">Orders you created, or Admin created on your behalf.</p>
        </div>
        <Link
          href="/partner/orders/new"
          className="rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white hover:bg-wood-light"
        >
          + New Order
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="panel-mobile-table w-full min-w-[720px] text-left text-sm">
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
                <td data-label="Order" className="px-4 py-3 align-top"><div className="panel-cell-value">
                  <p className="font-semibold text-navy">{o.name}</p>
                  <p className="text-xs text-ink-soft">{o.category}</p>
                </div></td>
                <td data-label="Status" className="px-4 py-3 align-top capitalize"><div className="panel-cell-value">{o.status ?? "—"}</div></td>
                <td data-label="Total Amount" className="px-4 py-3 align-top font-semibold text-navy"><div className="panel-cell-value">৳{o.total_amount.toFixed(2)}</div></td>
                <td data-label="Your Commission" className="px-4 py-3 align-top"><div className="panel-cell-value">৳{o.commission_amount.toFixed(2)}</div></td>
                <td data-label="Customer Discount" className="px-4 py-3 align-top"><div className="panel-cell-value">৳{o.discount_amount.toFixed(2)}</div></td>
                <td data-label="Commission Status" className="px-4 py-3 align-top"><div className="panel-cell-value">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      o.commission_status === "earned"
                        ? "bg-wood-soft text-wood"
                        : o.commission_status === "unearned"
                          ? "bg-red-50 text-red-600"
                          : "bg-cream-dark text-ink-soft"
                    }`}
                  >
                    {o.commission_status}
                  </span>
                </div></td>
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
        <div className="mt-4 flex items-center justify-between gap-4 text-sm text-ink-soft">
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

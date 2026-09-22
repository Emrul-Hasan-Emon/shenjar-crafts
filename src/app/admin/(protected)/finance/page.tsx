import Link from "next/link";
import { createClient } from "@server/supabase/server-client";
import { listFinanceRecords, type ProjectStatus } from "@server/db/finance";

const STATUSES: { key: ProjectStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "started", label: "Started" },
  { key: "finished", label: "Finished" },
  { key: "delivered", label: "Delivered" },
];

export default async function AdminFinancePage() {
  const supabase = await createClient();
  const [projects, spends] = await Promise.all([
    listFinanceRecords(supabase, { type: "project" }),
    listFinanceRecords(supabase, { type: "spend" }),
  ]);

  // Total Price is the shop's income; missing quantity counts as 1 unit,
  // matching the same convention the database uses for total_price itself.
  const totalIncome = projects.reduce((sum, p) => sum + p.total_price, 0);
  const totalSpend = spends.reduce((sum, s) => sum + s.total_price, 0);
  const totalMaterialsCost = projects.reduce(
    (sum, p) => sum + (p.material_cost ?? 0) * (p.quantity ?? 1),
    0
  );
  const totalMakingCost = projects.reduce(
    (sum, p) => sum + (p.making_cost ?? 0) * (p.quantity ?? 1),
    0
  );
  const totalCost = totalMaterialsCost + totalMakingCost;

  const statusBreakdown = STATUSES.map(({ key, label }) => {
    const matching = projects.filter((p) => p.status === key);
    return {
      key,
      label,
      count: matching.length,
      totalQuantity: matching.reduce((sum, p) => sum + (p.quantity ?? 1), 0),
    };
  });
  const noStatusCount = projects.filter((p) => !p.status).length;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Finance</h1>
      <p className="mt-1 text-sm text-ink-soft">Track projects (income) and spends (costs).</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Link
          href="/admin/finance/projects"
          className="rounded-2xl border border-border bg-white p-4 transition-shadow hover:shadow-[0_20px_40px_-28px_rgba(22,41,74,0.3)] sm:p-6"
        >
          <p className="text-xs font-semibold tracking-wide text-wood uppercase sm:text-sm">Projects</p>
          <p className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">{projects.length}</p>
        </Link>
        <Link
          href="/admin/finance/spends"
          className="rounded-2xl border border-border bg-white p-4 transition-shadow hover:shadow-[0_20px_40px_-28px_rgba(22,41,74,0.3)] sm:p-6"
        >
          <p className="text-xs font-semibold tracking-wide text-wood uppercase sm:text-sm">Spends</p>
          <p className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">{spends.length}</p>
        </Link>
        <div className="rounded-2xl border border-border bg-white p-4 sm:p-6">
          <p className="text-xs font-semibold tracking-wide text-wood uppercase sm:text-sm">Total Income (Projects)</p>
          <p className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">৳{totalIncome.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 sm:p-6">
          <p className="text-xs font-semibold tracking-wide text-wood uppercase sm:text-sm">Total Spend</p>
          <p className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">৳{totalSpend.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-navy">Projects by Status</h2>
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
              <tr>
                <th className="py-2">Status</th>
                <th className="py-2">Count</th>
                <th className="py-2">Total Quantity</th>
              </tr>
            </thead>
            <tbody>
              {statusBreakdown.map((row) => (
                <tr key={row.key} className="border-t border-border">
                  <td className="py-2 font-semibold text-navy">{row.label}</td>
                  <td className="py-2 font-semibold text-navy">{row.count}</td>
                  <td className="py-2 font-semibold text-navy">{row.totalQuantity}</td>
                </tr>
              ))}
              {noStatusCount > 0 ? (
                <tr className="border-t border-border">
                  <td className="py-2 text-ink-soft">— not set —</td>
                  <td className="py-2 text-ink-soft">{noStatusCount}</td>
                  <td className="py-2 text-ink-soft">—</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-navy">Cost Breakdown (Projects)</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-soft">Total Materials Cost</dt>
              <dd className="font-semibold text-navy">৳{totalMaterialsCost.toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-soft">Total Making Cost</dt>
              <dd className="font-semibold text-navy">৳{totalMakingCost.toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <dt className="font-semibold text-navy">Total Cost</dt>
              <dd className="font-semibold text-navy">৳{totalCost.toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/finance/projects/new"
          className="rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white hover:bg-wood-light"
        >
          + New Project
        </Link>
        <Link
          href="/admin/finance/spends/new"
          className="rounded-full border border-navy/15 px-5 py-2 text-sm font-semibold text-navy hover:bg-cream-dark"
        >
          + New Spend
        </Link>
      </div>
    </div>
  );
}

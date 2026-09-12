"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@server/supabase/client";
import { deleteFinanceRecord, updateFinanceRecord, type FinanceRecord, type ProjectStatus } from "@server/db/finance";

export default function ProjectsTable({ projects }: { projects: FinanceRecord[] }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState("");
  const [category, setCategory] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(projects.map((p) => p.category))).sort(),
    [projects]
  );

  const filtered = projects.filter((p) => {
    if (status && p.status !== status) return false;
    if (gender && p.customer_gender !== gender) return false;
    if (category && p.category !== category) return false;
    if (customerName && !(p.customer_name ?? "").toLowerCase().includes(customerName.toLowerCase())) return false;
    if (mobile && !(p.customer_mobile ?? "").toLowerCase().includes(mobile.toLowerCase())) return false;
    return true;
  });

  async function handleStatusChange(id: string, next: string) {
    setSavingId(id);
    try {
      await updateFinanceRecord(createClient(), id, {
        status: (next || null) as ProjectStatus | null,
      });
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(project: FinanceRecord) {
    if (!window.confirm(`Delete "${project.name}"? This can't be undone.`)) return;
    setSavingId(project.id);
    try {
      await deleteFinanceRecord(createClient(), project.id);
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="started">Started</option>
          <option value="finished">Finished</option>
          <option value="delivered">Delivered</option>
        </select>
        <input
          placeholder="Customer name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          placeholder="Mobile number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="">All genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border bg-cream-dark/40 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Quantity &amp; Cost</th>
              <th className="px-4 py-3">Total Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-cream-dark/20">
                <td className="px-4 py-3 align-top">
                  <Link href={`/admin/finance/projects/${p.id}`} className="font-semibold text-navy hover:underline">
                    {p.name}
                  </Link>
                  <p className="mt-1 text-xs text-ink-soft">{p.customer_name ?? "—"}</p>
                  <p className="text-xs text-ink-soft">
                    {p.customer_gender ? p.customer_gender[0].toUpperCase() + p.customer_gender.slice(1) : "—"}
                    {p.customer_mobile ? ` · ${p.customer_mobile}` : ""}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">{p.category}</td>
                <td className="px-4 py-3 align-top text-xs font-semibold text-navy">
                  <p>Qty: {p.quantity ?? "—"}</p>
                  <p>Price/qty: ৳{p.price.toFixed(2)}</p>
                  <p>Material: {p.material_cost !== null ? `৳${p.material_cost.toFixed(2)}` : "—"}</p>
                  <p>Making: {p.making_cost !== null ? `৳${p.making_cost.toFixed(2)}` : "—"}</p>
                  <p>Cost/qty: {p.total_cost_per_quantity !== null ? `৳${p.total_cost_per_quantity.toFixed(2)}` : "—"}</p>
                  <p>Total Cost: {p.total_cost_all !== null ? `৳${p.total_cost_all.toFixed(2)}` : "—"}</p>
                </td>
                <td className="px-4 py-3 align-top font-semibold text-navy">৳{p.total_price.toFixed(2)}</td>
                <td className="px-4 py-3 align-top">
                  <select
                    value={p.status ?? ""}
                    disabled={savingId === p.id}
                    onChange={(e) => handleStatusChange(p.id, e.target.value)}
                    className="rounded-full border border-border bg-wood-soft px-3 py-1 text-xs font-semibold text-wood disabled:opacity-50"
                  >
                    <option value="">— not set —</option>
                    <option value="pending">Pending</option>
                    <option value="started">Started</option>
                    <option value="finished">Finished</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </td>
                <td className="px-4 py-3 align-top text-xs text-ink-soft">
                  <p>Start: {p.estimated_start_time ?? "—"}</p>
                  <p>Delivery: {p.estimated_delivery_time ?? "—"}</p>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-col items-start gap-2">
                    <Link
                      href={`/admin/finance/projects/${p.id}/invoice`}
                      className="text-xs font-semibold text-wood hover:underline"
                    >
                      Invoice
                    </Link>
                    <button
                      type="button"
                      disabled={savingId === p.id}
                      onClick={() => handleDelete(p)}
                      className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No projects match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

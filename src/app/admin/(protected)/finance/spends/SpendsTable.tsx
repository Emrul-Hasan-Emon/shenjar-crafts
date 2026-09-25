"use client";

import { confirmPanel, notifyPanel } from "@/components/panel/PanelFeedback";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@server/supabase/client";
import { deleteFinanceRecord, type FinanceRecord } from "@server/db/finance";

export default function SpendsTable({ spends }: { spends: FinanceRecord[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(spend: FinanceRecord) {
    if (!await confirmPanel(`Delete "${spend.name}"? This can't be undone.`)) return;
    setBusyId(spend.id);
    try {
      await deleteFinanceRecord(createClient(), spend.id);
      notifyPanel();
      router.refresh();
    } catch (error) {
      notifyPanel(error instanceof Error ? error.message : "Unable to save changes. Please try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white">
      <table className="panel-mobile-table w-full min-w-[600px] text-left text-sm">
        <thead className="border-b border-border bg-cream-dark/40 text-xs font-semibold tracking-wide text-ink-soft uppercase">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Cost</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {spends.map((s) => (
            <tr key={s.id} className="border-b border-border last:border-0 hover:bg-cream-dark/20">
              <td data-label="Name" className="px-4 py-3"><div className="panel-cell-value">
                <Link href={`/admin/finance/spends/${s.id}`} className="font-semibold text-navy hover:underline">
                  {s.name}
                </Link>
              </div></td>
              <td data-label="Category" className="px-4 py-3"><div className="panel-cell-value">{s.category}</div></td>
              <td data-label="Description" className="px-4 py-3 text-ink-soft"><div className="panel-cell-value">{s.description ?? "—"}</div></td>
              <td data-label="Cost" className="px-4 py-3 font-semibold text-navy"><div className="panel-cell-value">৳{s.price.toFixed(2)}</div></td>
              <td data-label="Actions" className="px-4 py-3"><div className="panel-cell-value">
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => handleDelete(s)}
                  className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </div></td>
            </tr>
          ))}
          {spends.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-soft">
                No spends recorded yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

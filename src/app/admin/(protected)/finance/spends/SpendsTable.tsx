"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@server/supabase/client";
import { deleteFinanceRecord, type FinanceRecord } from "@server/db/finance";

export default function SpendsTable({ spends }: { spends: FinanceRecord[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(spend: FinanceRecord) {
    if (!window.confirm(`Delete "${spend.name}"? This can't be undone.`)) return;
    setBusyId(spend.id);
    try {
      await deleteFinanceRecord(createClient(), spend.id);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white">
      <table className="w-full min-w-[600px] text-left text-sm">
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
              <td className="px-4 py-3">
                <Link href={`/admin/finance/spends/${s.id}`} className="font-semibold text-navy hover:underline">
                  {s.name}
                </Link>
              </td>
              <td className="px-4 py-3">{s.category}</td>
              <td className="px-4 py-3 text-ink-soft">{s.description ?? "—"}</td>
              <td className="px-4 py-3 font-semibold text-navy">৳{s.price.toFixed(2)}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => handleDelete(s)}
                  className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </td>
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

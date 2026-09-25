"use client";

import { confirmPanel, notifyPanel } from "@/components/panel/PanelFeedback";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@server/supabase/client";
import { setPartnerActive } from "@server/partners/partners";
import type { PartnerWithConfig } from "@server/partners/types";

export default function PartnersList({
  partners,
  count,
  page,
  pageSize,
  search,
  isActive,
}: {
  partners: PartnerWithConfig[];
  count: number;
  page: number;
  pageSize: number;
  search: string;
  isActive: boolean | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(search);
  const [busyId, setBusyId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  function pushParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    pushParams({ search: searchInput || undefined, page: undefined });
  }

  function handleActiveFilter(value: string) {
    pushParams({ active: value || undefined, page: undefined });
  }

  async function handleToggleActive(partner: PartnerWithConfig) {
    if (partner.is_active && !await confirmPanel(`Deactivate ${partner.name}? They will no longer be able to access the partner portal.`)) return;
    setBusyId(partner.id);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Your admin session has expired — please sign in again and retry.");
      await setPartnerActive(supabase, partner.id, !partner.is_active, user.id, user.email ?? "admin");
      notifyPanel();
      router.refresh();
    } catch (error) {
      notifyPanel(error instanceof Error ? error.message : "Unable to save changes. Please try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 min-w-[220px] gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search partners" placeholder="Search name, email, or mobile"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-navy hover:bg-cream-dark"
          >
            Search
          </button>
        </form>
        <select
          aria-label="Partner status" value={isActive === undefined ? "" : String(isActive)}
          onChange={(e) => handleActiveFilter(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="">All partners</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="panel-mobile-table w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-border bg-cream-dark/40 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            <tr>
              <th className="px-4 py-3">Partner</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Org / Institution</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-cream-dark/20">
                <td data-label="Partner" className="px-4 py-3 align-top"><div className="panel-cell-value">
                  <Link href={`/admin/partners/${p.id}`} className="font-semibold text-navy hover:underline">
                    {p.name}
                  </Link>
                  <p className="mt-1 text-xs font-semibold text-wood">{p.config?.code ?? "—"}</p>
                </div></td>
                <td data-label="Contact" className="px-4 py-3 align-top text-xs text-ink-soft"><div className="panel-cell-value">
                  <p>{p.mobile}</p>
                  <p>{p.email ?? "—"}</p>
                </div></td>
                <td data-label="Org / Institution" className="px-4 py-3 align-top text-xs text-ink-soft"><div className="panel-cell-value">
                  {p.organization_name ?? p.institution ?? "—"}
                </div></td>
                <td data-label="Commission" className="px-4 py-3 align-top"><div className="panel-cell-value">
                  {p.config ? `${p.config.commission}${p.config.commission_type === "percentage" ? "%" : "৳"}` : "—"}
                </div></td>
                <td data-label="Discount" className="px-4 py-3 align-top"><div className="panel-cell-value">
                  {p.config ? `${p.config.discount}${p.config.discount_type === "percentage" ? "%" : "৳"}` : "—"}
                </div></td>
                <td data-label="Status" className="px-4 py-3 align-top"><div className="panel-cell-value">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      p.is_active ? "bg-wood-soft text-wood" : "bg-cream-dark text-ink-soft"
                    }`}
                  >
                    {p.is_active ? "Active" : "Inactive"}
                  </span>
                </div></td>
                <td data-label="Actions" className="px-4 py-3 align-top"><div className="panel-cell-value">
                  <div className="flex flex-col items-start gap-2">
                    <Link href={`/admin/partners/${p.id}`} className="text-xs font-semibold text-wood hover:underline">
                      View
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => handleToggleActive(p)}
                      className="text-xs font-semibold text-navy hover:underline disabled:opacity-50"
                    >
                      {p.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div></td>
              </tr>
            ))}
            {partners.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No partners match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-4 text-sm text-ink-soft">
          <span>
            Page {page} of {totalPages} &middot; {count} partner{count === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => pushParams({ page: String(page - 1) })}
              className="rounded-lg border border-border px-3 py-1.5 font-semibold text-navy disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => pushParams({ page: String(page + 1) })}
              className="rounded-lg border border-border px-3 py-1.5 font-semibold text-navy disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

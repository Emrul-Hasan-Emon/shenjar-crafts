"use client";

import { confirmPanel, notifyPanel } from "@/components/panel/PanelFeedback";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@server/supabase/client";
import { deleteCraftsDesign } from "@server/craft-design/designs/craftsDesigns";
import type { CraftsDesignListItem } from "@server/craft-design/designs/craftsDesigns";

export default function CraftDesignCard({ design }: { design: CraftsDesignListItem }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!await confirmPanel(`Delete "${design.name_en}"? This can't be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteCraftsDesign(createClient(), design.id);
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4 transition-shadow hover:shadow-[0_20px_40px_-28px_rgba(22,41,74,0.3)] sm:p-5">
      <Link href={`/admin/craft-designs/${design.id}`}>
        <p className="font-display text-base font-semibold text-navy sm:text-lg">{design.name_en}</p>
        <p className="mt-1 text-xs text-ink-soft sm:text-sm">Quantity: {design.quantity}</p>
        <p className="mt-1 text-xs text-ink-soft sm:text-sm">
          {design.partCount} part{design.partCount === 1 ? "" : "s"} · {design.materialCount} material
          {design.materialCount === 1 ? "" : "s"}
        </p>
        {design.project_name ? (
          <span className="mt-2 inline-block truncate rounded-full bg-wood-soft px-3 py-1 text-xs font-semibold text-wood max-w-full">
            Project: {design.project_name}
          </span>
        ) : null}
      </Link>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
        <Link href={`/admin/craft-designs/${design.id}`} className="text-xs font-semibold text-wood hover:underline">
          Open →
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={handleDelete}
          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      </div>
      {error ? <p role="alert" className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

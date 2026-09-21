"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@server/supabase/client";
import { deleteCraftsDesign } from "@server/craft-design/designs/craftsDesigns";
import type { CraftsDesignWithProject } from "@server/craft-design/designs/craftsDesigns";

export default function CraftDesignCard({ design }: { design: CraftsDesignWithProject }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(`Delete "${design.name_en}"? This can't be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteCraftsDesign(createClient(), design.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-[0_20px_40px_-28px_rgba(22,41,74,0.3)]">
      <Link href={`/admin/craft-designs/${design.id}`}>
        <p className="font-display text-lg font-semibold text-navy">{design.name_en}</p>
        <p className="mt-1 text-sm text-ink-soft">Quantity: {design.quantity}</p>
        {design.project_name ? (
          <span className="mt-2 inline-block rounded-full bg-wood-soft px-3 py-1 text-xs font-semibold text-wood">
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
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { updateCraftsDesign, getCraftsDesignById } from "@server/craft-design/designs/craftsDesigns";
import Spinner from "@/components/Spinner";

export default function DesignQuantityForm({ designId, quantity }: { designId: string; quantity: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const supabase = createClient();
      const current = await getCraftsDesignById(supabase, designId);
      if (!current) throw new Error("Design not found");
      await updateCraftsDesign(supabase, designId, {
        finance_record_id: current.finance_record_id,
        name_en: current.name_en,
        name_bn: current.name_bn,
        description_en: current.description_en,
        description_bn: current.description_bn,
        quantity: Number(form.get("quantity") ?? 1),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quantity");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div>
        <label className="block text-sm font-medium text-navy">
          Quantity — how many of this whole piece
        </label>
        <input
          name="quantity"
          type="number"
          min="1"
          defaultValue={quantity}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-wood px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? <Spinner className="h-3.5 w-3.5 border-2 text-white" /> : null}
        Save
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

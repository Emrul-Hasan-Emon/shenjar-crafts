"use client";

import { notifyPanel } from "@/components/panel/PanelFeedback";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@server/supabase/client";
import {
  addCraftDesignMaterial,
  removeCraftDesignMaterial,
  updateCraftDesignMaterialQuantity,
  type CraftDesignMaterialDetail,
} from "@server/craft-design/designs/craftDesignMaterials";
import type { Material } from "@server/materials/types";
import Spinner from "@/components/Spinner";

export default function MaterialsSection({
  designId,
  materials,
  materialCatalog,
}: {
  designId: string;
  materials: CraftDesignMaterialDetail[];
  materialCatalog: Material[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [quantity, setQuantity] = useState("1");

  async function handleAdd() {
    if (!selectedMaterialId) return;
    setBusy(true);
    setError(null);
    try {
      await addCraftDesignMaterial(createClient(), designId, selectedMaterialId, Number(quantity) || 1);
      setSelectedMaterialId("");
      setQuantity("1");
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add material");
    } finally {
      setBusy(false);
    }
  }

  async function handleQuantityChange(id: string, value: string) {
    const qty = Number(value);
    if (!value || Number.isNaN(qty) || qty <= 0) return;
    setBusy(true);
    setError(null);
    try {
      await updateCraftDesignMaterialQuantity(createClient(), id, qty);
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quantity");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    setBusy(true);
    setError(null);
    try {
      await removeCraftDesignMaterial(createClient(), id);
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove material");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <h2 className="font-display text-lg font-semibold text-navy">Materials</h2>

      <ul className="mt-3 space-y-2">
        {materials.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            <span>
              {m.material.name_en} <span className="text-ink-soft">@ ৳{m.material.unit_price.toFixed(2)}</span>
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="any"
                defaultValue={m.quantity}
                onBlur={(e) => handleQuantityChange(m.id, e.target.value)}
                disabled={busy}
                className="w-20 rounded-lg border border-border px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => handleRemove(m.id)}
                disabled={busy}
                className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
        {materials.length === 0 ? <p className="text-sm text-ink-soft">No materials added yet.</p> : null}
      </ul>

      {materialCatalog.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <select
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            <option value="">Add a material...</option>
            {materialCatalog.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name_en}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20 rounded-lg border border-border px-2 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={busy || !selectedMaterialId}
            className="inline-flex items-center gap-2 rounded-full bg-wood px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? <Spinner className="h-3.5 w-3.5 border-2 text-white" /> : null}
            Add
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-soft">No materials in the catalog yet — add one under Materials.</p>
      )}
      {error ? <p role="alert" className="mt-2 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import {
  updateCraftDesignPartOverrides,
  updateCraftDesignPartDimensions,
  removeCraftDesignPart,
  type CraftDesignPartDetail,
} from "@server/craft-design/designs/craftDesignMeasurementLabel";
import type { BoardColor, BoardThickness } from "@server/boards/types";
import Spinner from "@/components/Spinner";

export default function PartCard({
  part,
  colors,
  thicknesses,
}: {
  part: CraftDesignPartDetail;
  colors: BoardColor[];
  thicknesses: BoardThickness[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsAreaPicker = part.dimensions.length > 2;

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);

      const dimensions = part.dimensions.map((d) => ({
        id: d.id,
        value_inches: Number(form.get(`inches_${d.id}`) ?? 0),
        value_shuta: Number(form.get(`shuta_${d.id}`) ?? 0),
        counts_toward_area: needsAreaPicker ? form.get(`counts_${d.id}`) === "on" : true,
      }));

      if (needsAreaPicker) {
        const checkedCount = dimensions.filter((d) => d.counts_toward_area).length;
        if (checkedCount !== 2) {
          throw new Error("Pick exactly 2 measurements to count toward the board-area calculation.");
        }
      }

      const supabase = createClient();
      const colorId = String(form.get("color_id") ?? "");
      const thicknessId = String(form.get("thickness_id") ?? "");
      await Promise.all([
        updateCraftDesignPartOverrides(supabase, part.id, {
          color_id: colorId || null,
          thickness_id: thicknessId || null,
          quantity: Number(form.get("quantity") ?? 1),
        }),
        updateCraftDesignPartDimensions(supabase, dimensions),
      ]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!window.confirm(`Remove "${part.measurement_label.name_en}" from this design?`)) return;
    setBusy(true);
    setError(null);
    try {
      await removeCraftDesignPart(createClient(), part.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove part");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-base font-semibold text-navy">{part.measurement_label.name_en}</h3>
        <button
          type="button"
          onClick={handleRemove}
          disabled={busy}
          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
        >
          Remove
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {part.dimensions.map((d) => (
          <div key={d.id} className="flex flex-wrap items-end gap-2">
            <div className="w-28">
              <label className="block text-xs font-medium text-navy">{d.measurement_label_dimensions.label_en}</label>
              <input
                name={`inches_${d.id}`}
                type="number"
                step="any"
                min="0"
                defaultValue={d.value_inches}
                placeholder="Inches"
                className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-navy">Shuta</label>
              <input
                name={`shuta_${d.id}`}
                type="number"
                step="any"
                min="0"
                max="7"
                defaultValue={d.value_shuta}
                className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
              />
            </div>
            {needsAreaPicker ? (
              <label className="flex items-center gap-1.5 pb-1.5 text-xs text-ink-soft">
                <input type="checkbox" name={`counts_${d.id}`} defaultChecked={d.counts_toward_area} />
                Counts toward area
              </label>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-navy">Color — optional</label>
          <select
            name="color_id"
            defaultValue={part.color_id ?? ""}
            className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
          >
            <option value="">Use default</option>
            {colors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-navy">Thickness — optional</label>
          <select
            name="thickness_id"
            defaultValue={part.thickness_id ?? ""}
            className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
          >
            <option value="">Use default</option>
            {thicknesses.map((t) => (
              <option key={t.id} value={t.id}>
                {t.value_mm}mm
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-navy">Quantity</label>
          <input
            name="quantity"
            type="number"
            min="1"
            defaultValue={part.quantity}
            className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-wood px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? <Spinner className="h-3.5 w-3.5 border-2 text-white" /> : null}
        Save part
      </button>
    </form>
  );
}

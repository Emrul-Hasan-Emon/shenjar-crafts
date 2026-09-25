"use client";

import { confirmPanel, notifyPanel } from "@/components/panel/PanelFeedback";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import {
  createMeasurementLabelDimension,
  updateMeasurementLabelDimension,
  deleteMeasurementLabelDimension,
} from "@server/craft-design/measurement-labels/measurementLabelDimensions";
import type { MeasurementLabelDimension } from "@server/craft-design/measurement-labels/types";
import Spinner from "@/components/Spinner";

export default function MeasurementLabelDimensionsManager({
  measurementLabelId,
  dimensions,
}: {
  measurementLabelId: string;
  dimensions: MeasurementLabelDimension[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labelEn, setLabelEn] = useState("");
  const [labelBn, setLabelBn] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!labelEn.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createMeasurementLabelDimension(createClient(), {
        measurement_label_id: measurementLabelId,
        label_en: labelEn.trim(),
        label_bn: labelBn.trim() || null,
        sort_order: dimensions.length,
      });
      setLabelEn("");
      setLabelBn("");
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add dimension");
    } finally {
      setBusy(false);
    }
  }

  async function handleEditSave(e: FormEvent<HTMLFormElement>, dimension: MeasurementLabelDimension) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const editLabelEn = String(form.get("label_en") ?? "").trim();
      if (!editLabelEn) throw new Error("Field name is required");
      await updateMeasurementLabelDimension(createClient(), dimension.id, {
        label_en: editLabelEn,
        label_bn: String(form.get("label_bn") ?? "").trim() || null,
        description_en: dimension.description_en,
        description_bn: dimension.description_bn,
        sort_order: dimension.sort_order,
      });
      setEditingId(null);
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update dimension");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!await confirmPanel("Delete this dimension field?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteMeasurementLabelDimension(createClient(), id);
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete dimension");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-navy">Dimension Fields</h2>
      <p className="mt-1 text-sm text-ink-soft">
        e.g. &quot;Depth&quot; + &quot;Length&quot; for a 2-field part, or add a 3rd like
        &quot;Width&quot; if this part needs it. When building a Craft Design, admin picks
        which 2 of these count toward the board-area calculation.
      </p>

      <ul className="mt-4 space-y-2">
        {dimensions.map((d) =>
          editingId === d.id ? (
            <li key={d.id}>
              <form
                onSubmit={(e) => handleEditSave(e, d)}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-wood/40 px-3 py-2"
              >
                <input
                  name="label_en"
                  defaultValue={d.label_en}
                  placeholder="Field name (English)"
                  className="rounded-lg border border-border px-2 py-1 text-sm"
                />
                <input
                  name="label_bn"
                  defaultValue={d.label_bn ?? ""}
                  placeholder="Field name (Bangla) — optional"
                  className="rounded-lg border border-border px-2 py-1 text-sm"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="text-xs font-semibold text-wood hover:underline disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs font-semibold text-ink-soft hover:underline"
                >
                  Cancel
                </button>
              </form>
            </li>
          ) : (
            <li
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span>
                {d.label_en}
                {d.label_bn ? <span className="text-ink-soft"> ({d.label_bn})</span> : null}
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setEditingId(d.id)}
                  className="text-xs font-semibold text-navy hover:underline disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDelete(d.id)}
                  className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          )
        )}
        {dimensions.length === 0 ? <p className="text-sm text-ink-soft">No dimension fields yet.</p> : null}
      </ul>

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap gap-2">
        <input
          value={labelEn}
          onChange={(e) => setLabelEn(e.target.value)}
          placeholder="Field name (English), e.g. Depth"
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        />
        <input
          value={labelBn}
          onChange={(e) => setLabelBn(e.target.value)}
          placeholder="Field name (Bangla) — optional"
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !labelEn.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-wood px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? <Spinner className="h-3.5 w-3.5 border-2 text-white" /> : null}
          Add
        </button>
      </form>
      {error ? <p role="alert" className="mt-2 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}

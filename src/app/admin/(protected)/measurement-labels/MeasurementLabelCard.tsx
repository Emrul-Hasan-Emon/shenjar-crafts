"use client";

import { confirmPanel, notifyPanel } from "@/components/panel/PanelFeedback";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import {
  updateMeasurementLabel,
  deleteMeasurementLabel,
} from "@server/craft-design/measurement-labels/measurementLabels";
import type { MeasurementLabel } from "@server/craft-design/measurement-labels/types";
import Spinner from "@/components/Spinner";

export default function MeasurementLabelCard({ label }: { label: MeasurementLabel }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const nameEn = String(form.get("name_en") ?? "").trim();
      if (!nameEn) throw new Error("Name is required");
      await updateMeasurementLabel(createClient(), label.id, {
        name_en: nameEn,
        name_bn: String(form.get("name_bn") ?? "").trim() || null,
        description_en: String(form.get("description_en") ?? "").trim() || null,
        description_bn: String(form.get("description_bn") ?? "").trim() || null,
        default_quantity: Number(form.get("default_quantity") ?? 1),
      });
      setEditing(false);
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!await confirmPanel(`Delete "${label.name_en}"? This can't be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteMeasurementLabel(createClient(), label.id);
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="space-y-2 rounded-2xl border border-wood/40 bg-white p-5">
        <input
          name="name_en"
          required
          defaultValue={label.name_en}
          placeholder="Name (English)"
          className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
        />
        <input
          name="name_bn"
          defaultValue={label.name_bn ?? ""}
          placeholder="Name (Bangla) — optional"
          className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
        />
        <input
          name="default_quantity"
          type="number"
          min="1"
          defaultValue={label.default_quantity}
          className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
        />
        <textarea
          name="description_en"
          rows={2}
          defaultValue={label.description_en ?? ""}
          placeholder="Description (English) — optional"
          className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
        />
        <textarea
          name="description_bn"
          rows={2}
          defaultValue={label.description_bn ?? ""}
          placeholder="Description (Bangla) — optional"
          className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
        />
        {error ? <p role="alert" className="text-xs text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-wood px-2 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {busy ? <Spinner className="h-3 w-3 border-2 text-white" /> : null}
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={busy}
            className="rounded-md border border-border px-2 py-1.5 text-xs"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      <p className="font-display text-base font-semibold text-navy sm:text-lg">{label.name_en}</p>
      <p className="mt-1 text-xs text-ink-soft sm:text-sm">Default quantity: {label.default_quantity}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <Link href={`/admin/measurement-labels/${label.id}`} className="text-sm font-semibold text-wood hover:underline">
          Manage dimensions →
        </Link>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-navy hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
      {error ? <p role="alert" className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

"use client";

import { notifyPanel } from "@/components/panel/PanelFeedback";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { createMeasurementLabel } from "@server/craft-design/measurement-labels/measurementLabels";
import Spinner from "@/components/Spinner";

export default function CreateMeasurementLabelForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const nameEn = String(form.get("name_en") ?? "").trim();
      if (!nameEn) throw new Error("Name is required");
      await createMeasurementLabel(createClient(), {
        name_en: nameEn,
        name_bn: String(form.get("name_bn") ?? "").trim() || null,
        description_en: String(form.get("description_en") ?? "").trim() || null,
        description_bn: String(form.get("description_bn") ?? "").trim() || null,
        default_quantity: Number(form.get("default_quantity") ?? 1),
      });
      formRef.current?.reset();
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create measurement label");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-navy">Add a measurement label</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-navy">Name (English) *</label>
          <input name="name_en" required placeholder="e.g. Side (Left + Right)" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Name (Bangla) — optional</label>
          <input name="name_bn" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Default Quantity</label>
          <input
            name="default_quantity"
            type="number"
            min="1"
            defaultValue={1}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-ink-soft">e.g. 2 for Side (left + right), 1 for most others.</p>
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-navy">Description (English) — optional</label>
        <textarea name="description_en" rows={2} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-navy">Description (Bangla) — optional</label>
        <textarea name="description_bn" rows={2} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
      >
        {busy ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
        {busy ? "Creating..." : "Add label"}
      </button>
    </form>
  );
}

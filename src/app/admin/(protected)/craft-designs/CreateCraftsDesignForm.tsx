"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { createCraftsDesign } from "@server/craft-design/designs/craftsDesigns";
import Spinner from "@/components/Spinner";

export default function CreateCraftsDesignForm({ projects }: { projects: { id: string; name: string }[] }) {
  const router = useRouter();
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
      const projectId = String(form.get("finance_record_id") ?? "");
      const design = await createCraftsDesign(createClient(), {
        name_en: nameEn,
        name_bn: String(form.get("name_bn") ?? "").trim() || null,
        description_en: String(form.get("description_en") ?? "").trim() || null,
        description_bn: String(form.get("description_bn") ?? "").trim() || null,
        quantity: Number(form.get("quantity") ?? 1),
        finance_record_id: projectId || null,
      });
      router.push(`/admin/craft-designs/${design.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create design");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-navy">New Craft Design</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-navy">Name (English) *</label>
          <input name="name_en" required placeholder="e.g. Wardrobe #1" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Name (Bangla) — optional</label>
          <input name="name_bn" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Quantity</label>
          <input
            name="quantity"
            type="number"
            min="1"
            defaultValue={1}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-ink-soft">How many of this whole piece are being made.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Project — optional reference</label>
          <select name="finance_record_id" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm">
            <option value="">— none —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-soft">For navigation only — never affects the Project&apos;s cost fields.</p>
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
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
      >
        {busy ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
        {busy ? "Creating..." : "Create design"}
      </button>
    </form>
  );
}

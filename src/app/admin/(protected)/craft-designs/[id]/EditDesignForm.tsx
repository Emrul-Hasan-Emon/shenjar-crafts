"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import {
  updateCraftsDesign,
  deleteCraftsDesign,
  type CraftsDesignWithProject,
} from "@server/craft-design/designs/craftsDesigns";
import Spinner from "@/components/Spinner";

export default function EditDesignForm({
  design,
  projects,
}: {
  design: CraftsDesignWithProject;
  projects: { id: string; name: string }[];
}) {
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
      const projectId = String(form.get("finance_record_id") ?? "");
      await updateCraftsDesign(createClient(), design.id, {
        name_en: nameEn,
        name_bn: String(form.get("name_bn") ?? "").trim() || null,
        description_en: String(form.get("description_en") ?? "").trim() || null,
        description_bn: String(form.get("description_bn") ?? "").trim() || null,
        quantity: Number(form.get("quantity") ?? 1),
        finance_record_id: projectId || null,
      });
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${design.name_en}"? This can't be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteCraftsDesign(createClient(), design.id);
      router.push("/admin/craft-designs");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full border border-navy/15 px-4 py-1.5 text-sm font-semibold text-navy hover:bg-cream-dark"
        >
          Edit design
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleDelete}
          className="rounded-full border border-red-200 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Delete design
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-xl space-y-4 rounded-2xl border border-wood/40 bg-white p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-navy">Name (English) *</label>
          <input
            name="name_en"
            required
            defaultValue={design.name_en}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Name (Bangla) — optional</label>
          <input
            name="name_bn"
            defaultValue={design.name_bn ?? ""}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Quantity</label>
          <input
            name="quantity"
            type="number"
            min="1"
            defaultValue={design.quantity}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Project — optional reference</label>
          <select
            name="finance_record_id"
            defaultValue={design.finance_record_id ?? ""}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          >
            <option value="">— none —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-navy">Description (English) — optional</label>
        <textarea
          name="description_en"
          rows={2}
          defaultValue={design.description_en ?? ""}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-navy">Description (Bangla) — optional</label>
        <textarea
          name="description_bn"
          rows={2}
          defaultValue={design.description_bn ?? ""}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
          Save changes
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-navy"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

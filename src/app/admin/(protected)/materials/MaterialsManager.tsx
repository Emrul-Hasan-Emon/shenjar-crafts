"use client";

import { confirmPanel, notifyPanel } from "@/components/panel/PanelFeedback";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { createMaterial, updateMaterial, deleteMaterial } from "@server/materials/materials";
import type { Material } from "@server/materials/types";
import Spinner from "@/components/Spinner";

export default function MaterialsManager({ materials }: { materials: Material[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const nameEn = String(form.get("name_en") ?? "").trim();
      if (!nameEn) throw new Error("Name is required");
      const input = {
        name_en: nameEn,
        name_bn: String(form.get("name_bn") ?? "").trim() || null,
        description_en: String(form.get("description_en") ?? "").trim() || null,
        description_bn: String(form.get("description_bn") ?? "").trim() || null,
        unit: String(form.get("unit") ?? "piece").trim() || "piece",
        unit_price: Number(form.get("unit_price") ?? 0),
      };
      const supabase = createClient();
      if (editingMaterial) {
        await updateMaterial(supabase, editingMaterial.id, input);
        setEditingMaterial(null);
      } else {
        await createMaterial(supabase, input);
        (e.target as HTMLFormElement).reset();
      }
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save material");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!await confirmPanel("Delete this material?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteMaterial(createClient(), id);
      if (editingMaterial?.id === id) setEditingMaterial(null);
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete material");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        key={editingMaterial?.id ?? "new"}
        onSubmit={handleSubmit}
        className={`rounded-2xl border bg-white p-6 ${editingMaterial ? "border-wood/40" : "border-border"}`}
      >
        <h2 className="font-display text-lg font-semibold text-navy">
          {editingMaterial ? `Editing: ${editingMaterial.name_en}` : "Add a material"}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-navy">Name (English) *</label>
            <input
              name="name_en"
              required
              defaultValue={editingMaterial?.name_en ?? ""}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Name (Bangla) — optional</label>
            <input
              name="name_bn"
              defaultValue={editingMaterial?.name_bn ?? ""}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Unit</label>
            <input
              name="unit"
              defaultValue={editingMaterial?.unit ?? "piece"}
              placeholder="piece, pair, set..."
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Unit Price (৳) *</label>
            <input
              name="unit_price"
              type="number"
              step="any"
              min="0"
              required
              defaultValue={editingMaterial?.unit_price ?? undefined}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-navy">Description (English) — optional</label>
            <textarea
              name="description_en"
              rows={2}
              defaultValue={editingMaterial?.description_en ?? ""}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-navy">Description (Bangla) — optional</label>
            <textarea
              name="description_bn"
              rows={2}
              defaultValue={editingMaterial?.description_bn ?? ""}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
        </div>
        {error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
          >
            {busy ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
            {busy ? "Saving..." : editingMaterial ? "Save changes" : "Add material"}
          </button>
          {editingMaterial ? (
            <button
              type="button"
              onClick={() => setEditingMaterial(null)}
              className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-navy"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="panel-mobile-table w-full min-w-[500px] text-left text-sm">
          <thead className="border-b border-border bg-cream-dark/40 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Unit Price</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td data-label="Name" className="px-4 py-3 font-semibold text-navy"><div className="panel-cell-value">{m.name_en}</div></td>
                <td data-label="Unit" className="px-4 py-3"><div className="panel-cell-value">{m.unit}</div></td>
                <td data-label="Unit Price" className="px-4 py-3"><div className="panel-cell-value">৳{m.unit_price.toFixed(2)}</div></td>
                <td data-label="Actions" className="px-4 py-3"><div className="panel-cell-value">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setEditingMaterial(m)}
                      className="text-xs font-semibold text-navy hover:underline disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(m.id)}
                      className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div></td>
              </tr>
            ))}
            {materials.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No materials yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

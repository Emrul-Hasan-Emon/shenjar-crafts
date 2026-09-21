"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import {
  createBoardThickness,
  updateBoardThickness,
  deleteBoardThickness,
  setDefaultBoardThickness,
} from "@server/boards/thicknesses";
import type { BoardThickness } from "@server/boards/types";
import Spinner from "@/components/Spinner";

export default function BoardThicknessesManager({ thicknesses }: { thicknesses: BoardThickness[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valueMm, setValueMm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = Number(valueMm);
    if (!valueMm || Number.isNaN(value) || value <= 0) return;
    setBusy(true);
    setError(null);
    try {
      await createBoardThickness(createClient(), { value_mm: value });
      setValueMm("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add thickness");
    } finally {
      setBusy(false);
    }
  }

  async function handleEditSave(e: FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const value = Number(form.get("value_mm") ?? 0);
      if (!value || value <= 0) throw new Error("Enter a valid thickness");
      await updateBoardThickness(createClient(), id, { value_mm: value });
      setEditingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update thickness");
    } finally {
      setBusy(false);
    }
  }

  async function handleSetDefault(id: string) {
    setBusy(true);
    setError(null);
    try {
      await setDefaultBoardThickness(createClient(), id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this thickness?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteBoardThickness(createClient(), id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete — it may still be used by a board.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-navy">Board Thicknesses</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {thicknesses.map((thickness) =>
          editingId === thickness.id ? (
            <form
              key={thickness.id}
              onSubmit={(e) => handleEditSave(e, thickness.id)}
              className="flex items-center gap-2 rounded-full border border-wood/40 px-2 py-1"
            >
              <input
                name="value_mm"
                type="number"
                step="any"
                min="0"
                defaultValue={thickness.value_mm}
                className="w-20 rounded-lg border border-border px-2 py-1 text-sm"
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
          ) : (
            <span
              key={thickness.id}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                thickness.is_default ? "border-wood bg-wood-soft text-wood" : "border-border text-navy"
              }`}
            >
              {thickness.is_default ? "★" : null} {thickness.value_mm}mm
              {!thickness.is_default ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleSetDefault(thickness.id)}
                  className="text-xs font-semibold text-wood hover:underline disabled:opacity-50"
                >
                  Set default
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditingId(thickness.id)}
                className="text-xs font-semibold text-navy hover:underline disabled:opacity-50"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDelete(thickness.id)}
                className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
              >
                Delete
              </button>
            </span>
          )
        )}
        {thicknesses.length === 0 ? <p className="text-sm text-ink-soft">No thicknesses yet.</p> : null}
      </div>

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap gap-2">
        <input
          value={valueMm}
          onChange={(e) => setValueMm(e.target.value)}
          type="number"
          step="any"
          min="0"
          placeholder="Thickness in mm"
          className="w-40 rounded-lg border border-border px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !valueMm}
          className="inline-flex items-center gap-2 rounded-full bg-wood px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? <Spinner className="h-3.5 w-3.5 border-2 text-white" /> : null}
          Add
        </button>
      </form>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}

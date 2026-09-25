"use client";

import { confirmPanel, notifyPanel } from "@/components/panel/PanelFeedback";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import {
  createBoardColor,
  updateBoardColor,
  deleteBoardColor,
  setDefaultBoardColor,
} from "@server/boards/colors";
import type { BoardColor } from "@server/boards/types";
import Spinner from "@/components/Spinner";

export default function BoardColorsManager({ colors }: { colors: BoardColor[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameEn, setNameEn] = useState("");
  const [nameBn, setNameBn] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nameEn.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createBoardColor(createClient(), { name_en: nameEn.trim(), name_bn: nameBn.trim() || null });
      setNameEn("");
      setNameBn("");
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add color");
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
      const editNameEn = String(form.get("name_en") ?? "").trim();
      if (!editNameEn) throw new Error("Name is required");
      await updateBoardColor(createClient(), id, {
        name_en: editNameEn,
        name_bn: String(form.get("name_bn") ?? "").trim() || null,
        description_en: String(form.get("description_en") ?? "").trim() || null,
        description_bn: String(form.get("description_bn") ?? "").trim() || null,
      });
      setEditingId(null);
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update color");
    } finally {
      setBusy(false);
    }
  }

  async function handleSetDefault(id: string) {
    setBusy(true);
    setError(null);
    try {
      await setDefaultBoardColor(createClient(), id);
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!await confirmPanel("Delete this color?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteBoardColor(createClient(), id);
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete — it may still be used by a board.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-navy">Board Colors</h2>

      <div className="mt-4 space-y-2">
        {colors.map((color) =>
          editingId === color.id ? (
            <form
              key={color.id}
              onSubmit={(e) => handleEditSave(e, color.id)}
              className="space-y-2 rounded-xl border border-wood/40 p-3"
            >
              <div className="flex flex-wrap gap-2">
                <input
                  name="name_en"
                  defaultValue={color.name_en}
                  placeholder="Name (English)"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm"
                />
                <input
                  name="name_bn"
                  defaultValue={color.name_bn ?? ""}
                  placeholder="Name (Bangla) — optional"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  name="description_en"
                  defaultValue={color.description_en ?? ""}
                  placeholder="Description (English) — optional"
                  className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm"
                />
                <input
                  name="description_bn"
                  defaultValue={color.description_bn ?? ""}
                  placeholder="Description (Bangla) — optional"
                  className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-full bg-wood px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy ? <Spinner className="h-3.5 w-3.5 border-2 text-white" /> : null}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-navy"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <span
              key={color.id}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                color.is_default ? "border-wood bg-wood-soft text-wood" : "border-border text-navy"
              }`}
            >
              {color.is_default ? "★" : null} {color.name_en}
              {!color.is_default ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleSetDefault(color.id)}
                  className="text-xs font-semibold text-wood hover:underline disabled:opacity-50"
                >
                  Set default
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditingId(color.id)}
                className="text-xs font-semibold text-navy hover:underline disabled:opacity-50"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDelete(color.id)}
                className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
              >
                Delete
              </button>
            </span>
          )
        )}
        {colors.length === 0 ? <p className="text-sm text-ink-soft">No colors yet.</p> : null}
      </div>

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap gap-2">
        <input
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder="Name (English)"
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        />
        <input
          value={nameBn}
          onChange={(e) => setNameBn(e.target.value)}
          placeholder="Name (Bangla) — optional"
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !nameEn.trim()}
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

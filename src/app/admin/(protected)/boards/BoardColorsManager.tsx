"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { createBoardColor, deleteBoardColor, setDefaultBoardColor } from "@server/boards/colors";
import type { BoardColor } from "@server/boards/types";
import Spinner from "@/components/Spinner";

export default function BoardColorsManager({ colors }: { colors: BoardColor[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameEn, setNameEn] = useState("");
  const [nameBn, setNameBn] = useState("");

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nameEn.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createBoardColor(createClient(), { name_en: nameEn.trim(), name_bn: nameBn.trim() || null });
      setNameEn("");
      setNameBn("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add color");
    } finally {
      setBusy(false);
    }
  }

  async function handleSetDefault(id: string) {
    setBusy(true);
    setError(null);
    try {
      await setDefaultBoardColor(createClient(), id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this color?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteBoardColor(createClient(), id);
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
      <div className="mt-4 flex flex-wrap gap-2">
        {colors.map((color) => (
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
              onClick={() => handleDelete(color.id)}
              className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          </span>
        ))}
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
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { createBoard, updateBoard, deleteBoard } from "@server/boards/boards";
import type { Board, BoardColor, BoardThickness } from "@server/boards/types";
import Spinner from "@/components/Spinner";

export default function BoardsManager({
  boards,
  colors,
  thicknesses,
}: {
  boards: Board[];
  colors: BoardColor[];
  thicknesses: BoardThickness[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);

  const colorById = new Map(colors.map((c) => [c.id, c]));
  const thicknessById = new Map(thicknesses.map((t) => [t.id, t]));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const input = {
        name_en: String(form.get("name_en") ?? "").trim() || null,
        name_bn: String(form.get("name_bn") ?? "").trim() || null,
        description_en: String(form.get("description_en") ?? "").trim() || null,
        description_bn: String(form.get("description_bn") ?? "").trim() || null,
        color_id: String(form.get("color_id") ?? ""),
        thickness_id: String(form.get("thickness_id") ?? ""),
        sheet_length_inches: Number(form.get("sheet_length_inches") ?? 0),
        sheet_length_shuta: Number(form.get("sheet_length_shuta") ?? 0),
        sheet_width_inches: Number(form.get("sheet_width_inches") ?? 0),
        sheet_width_shuta: Number(form.get("sheet_width_shuta") ?? 0),
        price_per_sheet: Number(form.get("price_per_sheet") ?? 0),
        wastage_percent: Number(form.get("wastage_percent") ?? 10),
      };
      const supabase = createClient();
      if (editingBoard) {
        await updateBoard(supabase, editingBoard.id, input);
        setEditingBoard(null);
      } else {
        await createBoard(supabase, input);
        (e.target as HTMLFormElement).reset();
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save board");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this board?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteBoard(createClient(), id);
      if (editingBoard?.id === id) setEditingBoard(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete board");
    } finally {
      setBusy(false);
    }
  }

  const noOptions = colors.length === 0 || thicknesses.length === 0;

  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-navy">Boards</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Each board is one specific color + thickness combination, with its own sheet size
        and price.
      </p>

      {noOptions ? (
        <p className="mt-4 text-sm text-red-600">
          Add at least one Board Color and one Board Thickness above before creating a board.
        </p>
      ) : (
        <form
          key={editingBoard?.id ?? "new"}
          onSubmit={handleSubmit}
          className={`mt-4 space-y-4 rounded-xl border p-4 ${editingBoard ? "border-wood/40" : "border-border"}`}
        >
          {editingBoard ? (
            <p className="text-sm font-semibold text-wood">Editing: {editingBoard.name_en || "(unnamed board)"}</p>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-navy">Name (English) — optional</label>
              <input
                name="name_en"
                defaultValue={editingBoard?.name_en ?? ""}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy">Name (Bangla) — optional</label>
              <input
                name="name_bn"
                defaultValue={editingBoard?.name_bn ?? ""}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy">Color *</label>
              <select
                name="color_id"
                required
                defaultValue={editingBoard?.color_id ?? ""}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Choose a color
                </option>
                {colors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy">Thickness *</label>
              <select
                name="thickness_id"
                required
                defaultValue={editingBoard?.thickness_id ?? ""}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Choose a thickness
                </option>
                {thicknesses.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.value_mm}mm
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy">Sheet Length *</label>
            <div className="mt-1 flex gap-2">
              <input
                name="sheet_length_inches"
                type="number"
                step="any"
                min="0"
                required
                placeholder="Inches"
                defaultValue={editingBoard?.sheet_length_inches ?? undefined}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <input
                name="sheet_length_shuta"
                type="number"
                step="any"
                min="0"
                placeholder="Shuta (0-7)"
                defaultValue={editingBoard?.sheet_length_shuta ?? 0}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy">Sheet Width *</label>
            <div className="mt-1 flex gap-2">
              <input
                name="sheet_width_inches"
                type="number"
                step="any"
                min="0"
                required
                placeholder="Inches"
                defaultValue={editingBoard?.sheet_width_inches ?? undefined}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <input
                name="sheet_width_shuta"
                type="number"
                step="any"
                min="0"
                placeholder="Shuta (0-7)"
                defaultValue={editingBoard?.sheet_width_shuta ?? 0}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-navy">Price per Sheet (৳) *</label>
              <input
                name="price_per_sheet"
                type="number"
                step="any"
                min="0"
                required
                defaultValue={editingBoard?.price_per_sheet ?? undefined}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy">Wastage % — cutting/kerf buffer</label>
              <input
                name="wastage_percent"
                type="number"
                step="any"
                min="0"
                defaultValue={editingBoard?.wastage_percent ?? 10}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy">Description (English) — optional</label>
            <textarea
              name="description_en"
              rows={2}
              defaultValue={editingBoard?.description_en ?? ""}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Description (Bangla) — optional</label>
            <textarea
              name="description_bn"
              rows={2}
              defaultValue={editingBoard?.description_bn ?? ""}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
            >
              {busy ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
              {busy ? "Saving..." : editingBoard ? "Save changes" : "Create board"}
            </button>
            {editingBoard ? (
              <button
                type="button"
                onClick={() => setEditingBoard(null)}
                className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-navy"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-border bg-cream-dark/40 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3">Thickness</th>
              <th className="px-4 py-3">Sheet Size</th>
              <th className="px-4 py-3">Price/Sheet</th>
              <th className="px-4 py-3">Wastage</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {boards.map((b) => (
              <tr key={b.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{b.name_en ?? "—"}</td>
                <td className="px-4 py-3">{colorById.get(b.color_id)?.name_en ?? "—"}</td>
                <td className="px-4 py-3">{thicknessById.get(b.thickness_id)?.value_mm ?? "—"}mm</td>
                <td className="px-4 py-3 text-xs">
                  {b.sheet_length_inches}in {b.sheet_length_shuta}sh × {b.sheet_width_inches}in{" "}
                  {b.sheet_width_shuta}sh
                </td>
                <td className="px-4 py-3">৳{b.price_per_sheet.toFixed(2)}</td>
                <td className="px-4 py-3">{b.wastage_percent}%</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setEditingBoard(b)}
                      className="text-xs font-semibold text-navy hover:underline disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(b.id)}
                      className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {boards.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No boards yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

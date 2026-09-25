"use client";

import { confirmPanel, notifyPanel } from "@/components/panel/PanelFeedback";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { createPhotocard, deletePhotocard } from "@server/db/photocards";
import { uploadFile, safeFileName } from "@server/supabase/storage";
import { compressImageIfNeeded } from "@/lib/compressImage";
import { measureImage } from "@/lib/measureImage";
import MediaPreviewInput from "../_components/MediaPreviewInput";
import PhotocardCard, { type CategoryOption, type PhotocardItem } from "../_components/PhotocardCard";

export default function PhotocardsManager({
  categories,
  items,
  initialCategoryId,
}: {
  categories: CategoryOption[];
  items: PhotocardItem[];
  initialCategoryId?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [filter, setFilter] = useState<string>(initialCategoryId ?? "all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = filter === "all" ? items : items.filter((i) => i.categoryId === filter);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const categoryId = String(form.get("category_id") ?? "");
      const nameEn = String(form.get("name_en") ?? "").trim();
      const file = form.get("image") as File | null;
      if (!categoryId) throw new Error("Choose a category");
      if (!nameEn) throw new Error("Enter a name");
      if (!file || file.size === 0) throw new Error("Choose an image");

      const supabase = createClient();
      const compressed = await compressImageIfNeeded(file);
      const dims = await measureImage(compressed);
      const path = `photocards/${safeFileName(compressed.name)}`;
      await uploadFile(supabase, path, compressed, compressed.type);
      await createPhotocard(supabase, {
        category_id: categoryId,
        image_path: path,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
        name_en: nameEn,
        name_bn: String(form.get("name_bn") ?? "").trim() || null,
        description_en: String(form.get("description_en") ?? "").trim() || null,
        description_bn: String(form.get("description_bn") ?? "").trim() || null,
      });

      formRef.current?.reset();
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add photocard");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!await confirmPanel("Delete this photocard? This cannot be undone.")) return;
    setBusy(true);
    try {
      await deletePhotocard(createClient(), id);
      notifyPanel("The photocard was deleted.");
      router.refresh();
    } catch (err) {
      notifyPanel(err instanceof Error ? err.message : "Delete failed. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        ref={formRef}
        onSubmit={handleCreate}
        className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-white p-6 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <MediaPreviewInput name="image" accept="image/*" required busy={busy} />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Category *</label>
          <select
            name="category_id"
            required
            defaultValue={initialCategoryId ?? ""}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Name (English) *</label>
          <input name="name_en" required className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Name (Bangla)</label>
          <input name="name_bn" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Description (English) — optional</label>
          <textarea name="description_en" rows={2} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Description (Bangla) — optional</label>
          <textarea name="description_bn" rows={2} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        {error ? <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
          >
            {busy ? "Uploading..." : "Add photocard"}
          </button>
        </div>
      </form>

      <div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              filter === "all" ? "bg-navy text-cream" : "bg-white text-navy"
            }`}
          >
            All ({items.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                filter === c.id ? "bg-navy text-cream" : "bg-white text-navy"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {visible.map((item) => (
            <PhotocardCard key={item.id} item={item} categories={categories} onDelete={handleDelete} />
          ))}
          {visible.length === 0 ? <p className="text-sm text-ink-soft">No photocards here yet.</p> : null}
        </div>
      </div>
    </div>
  );
}

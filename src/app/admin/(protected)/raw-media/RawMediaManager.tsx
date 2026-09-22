"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { createRawMedia, deleteRawMedia } from "@server/db/rawMedia";
import { uploadFile, safeFileName } from "@server/supabase/storage";
import { compressImageIfNeeded } from "@/lib/compressImage";
import { measureImage } from "@/lib/measureImage";
import MediaPreviewInput from "../_components/MediaPreviewInput";
import RawMediaCard, { MAX_VIDEO_BYTES, type RawMediaItem } from "../_components/RawMediaCard";
import type { CategoryOption } from "../_components/PhotocardCard";
import type { MediaKind } from "@server/db/types";

export default function RawMediaManager({
  categories,
  items,
  initialCategoryId,
}: {
  categories: CategoryOption[];
  items: RawMediaItem[];
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
      const file = form.get("media") as File | null;
      if (!categoryId) throw new Error("Choose a category");
      if (!nameEn) throw new Error("Enter a name");
      if (!file || file.size === 0) throw new Error("Choose an image or video");

      const kind: MediaKind = file.type.startsWith("video/") ? "video" : "image";
      if (kind === "video" && file.size > MAX_VIDEO_BYTES) {
        throw new Error("Video is too large (max 15MB). Please compress it before uploading.");
      }

      const supabase = createClient();
      const uploadable = kind === "image" ? await compressImageIfNeeded(file) : file;
      const dims = kind === "image" ? await measureImage(uploadable) : null;
      const path = `raw-media/${safeFileName(uploadable.name)}`;
      await uploadFile(supabase, path, uploadable, uploadable.type);
      await createRawMedia(supabase, {
        category_id: categoryId,
        kind,
        media_path: path,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
        name_en: nameEn,
        name_bn: String(form.get("name_bn") ?? "").trim() || null,
        description_en: String(form.get("description_en") ?? "").trim() || null,
        description_bn: String(form.get("description_bn") ?? "").trim() || null,
      });

      formRef.current?.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add media");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    try {
      await deleteRawMedia(createClient(), id);
      router.refresh();
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
          <MediaPreviewInput name="media" accept="image/*,video/*" required busy={busy} />
          <p className="mt-2 text-xs text-ink-soft">
            Images are automatically compressed. Videos are capped at 15MB.
          </p>
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
        {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
          >
            {busy ? "Uploading..." : "Add media"}
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
            <RawMediaCard key={item.id} item={item} categories={categories} onDelete={handleDelete} />
          ))}
          {visible.length === 0 ? <p className="text-sm text-ink-soft">No media here yet.</p> : null}
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { updatePhotocard } from "@server/db/photocards";
import { uploadFile, safeFileName } from "@server/supabase/storage";
import { compressImageIfNeeded } from "@/lib/compressImage";
import { measureImage } from "@/lib/measureImage";
import MediaPreviewInput from "./MediaPreviewInput";

export type CategoryOption = { id: string; name: string };
export type PhotocardItem = {
  id: string;
  url: string;
  categoryId: string;
  categoryName: string;
  nameEn: string | null;
  nameBn: string | null;
  descriptionEn: string | null;
  descriptionBn: string | null;
};

export function extractStoragePath(publicUrl: string): string | undefined {
  const marker = "/object/public/media/";
  const idx = publicUrl.indexOf(marker);
  return idx === -1 ? undefined : publicUrl.slice(idx + marker.length);
}

export default function PhotocardCard({
  item,
  categories,
  onDelete,
}: {
  item: PhotocardItem;
  categories: CategoryOption[];
  onDelete: (id: string) => void;
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
      if (!nameEn) throw new Error("Enter a name");

      const supabase = createClient();
      const file = form.get("image") as File | null;
      let imagePath: string | undefined;
      let width: number | null | undefined;
      let height: number | null | undefined;
      if (file && file.size > 0) {
        const compressed = await compressImageIfNeeded(file);
        const dims = await measureImage(compressed);
        imagePath = `photocards/${safeFileName(compressed.name)}`;
        await uploadFile(supabase, imagePath, compressed, compressed.type);
        width = dims?.width ?? null;
        height = dims?.height ?? null;
      }

      await updatePhotocard(supabase, item.id, {
        category_id: String(form.get("category_id") ?? item.categoryId),
        name_en: nameEn,
        name_bn: String(form.get("name_bn") ?? "").trim() || null,
        description_en: String(form.get("description_en") ?? "").trim() || null,
        description_bn: String(form.get("description_bn") ?? "").trim() || null,
        ...(imagePath ? { image_path: imagePath, width, height } : {}),
        previousImagePath: imagePath ? extractStoragePath(item.url) : undefined,
      });

      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="col-span-1 space-y-2 rounded-2xl border border-wood/40 bg-white p-3">
        <MediaPreviewInput name="image" accept="image/*" busy={busy} existingUrl={item.url} />
        <select
          name="category_id"
          defaultValue={item.categoryId}
          className="w-full rounded-lg border border-border px-2 py-1.5 text-xs"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          name="name_en"
          required
          defaultValue={item.nameEn ?? ""}
          placeholder="Name (English)"
          className="w-full rounded-lg border border-border px-2 py-1.5 text-xs"
        />
        <input
          name="name_bn"
          defaultValue={item.nameBn ?? ""}
          placeholder="Name (Bangla)"
          className="w-full rounded-lg border border-border px-2 py-1.5 text-xs"
        />
        <textarea
          name="description_en"
          rows={2}
          defaultValue={item.descriptionEn ?? ""}
          placeholder="Description (English) — optional"
          className="w-full rounded-lg border border-border px-2 py-1.5 text-xs"
        />
        <textarea
          name="description_bn"
          rows={2}
          defaultValue={item.descriptionBn ?? ""}
          placeholder="Description (Bangla) — optional"
          className="w-full rounded-lg border border-border px-2 py-1.5 text-xs"
        />
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 rounded-md bg-wood px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={busy}
            className="rounded-md border border-border px-2 py-1 text-xs"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="relative aspect-[4/3] w-full bg-cream-dark/40">
        <Image src={item.url} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-wood uppercase">{item.categoryName}</p>
        <p className="mt-1 truncate text-xs text-ink-soft">{item.nameEn ?? "—"}</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md px-2 py-1 text-xs font-semibold text-navy hover:bg-cream-dark"
          >
            Update
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

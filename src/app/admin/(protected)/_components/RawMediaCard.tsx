"use client";

import { notifyPanel } from "@/components/panel/PanelFeedback";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { updateRawMedia } from "@server/db/rawMedia";
import { uploadFile, safeFileName } from "@server/supabase/storage";
import { compressImageIfNeeded } from "@/lib/compressImage";
import { measureImage } from "@/lib/measureImage";
import MediaPreviewInput from "./MediaPreviewInput";
import { extractStoragePath, type CategoryOption } from "./PhotocardCard";
import Spinner from "@/components/Spinner";
import type { MediaKind } from "@server/db/types";

export const MAX_VIDEO_BYTES = 15 * 1024 * 1024; // 15MB

export type RawMediaItem = {
  id: string;
  url: string;
  kind: MediaKind;
  categoryId: string;
  categoryName: string;
  nameEn: string | null;
  nameBn: string | null;
  descriptionEn: string | null;
  descriptionBn: string | null;
};

export default function RawMediaCard({
  item,
  categories,
  onDelete,
}: {
  item: RawMediaItem;
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
      const file = form.get("media") as File | null;
      let mediaPath: string | undefined;
      let kind: MediaKind | undefined;
      let width: number | null | undefined;
      let height: number | null | undefined;
      if (file && file.size > 0) {
        kind = file.type.startsWith("video/") ? "video" : "image";
        if (kind === "video" && file.size > MAX_VIDEO_BYTES) {
          throw new Error("Video is too large (max 15MB).");
        }
        const uploadable = kind === "image" ? await compressImageIfNeeded(file) : file;
        const dims = kind === "image" ? await measureImage(uploadable) : null;
        mediaPath = `raw-media/${safeFileName(uploadable.name)}`;
        await uploadFile(supabase, mediaPath, uploadable, uploadable.type);
        width = dims?.width ?? null;
        height = dims?.height ?? null;
      }

      await updateRawMedia(supabase, item.id, {
        category_id: String(form.get("category_id") ?? item.categoryId),
        name_en: nameEn,
        name_bn: String(form.get("name_bn") ?? "").trim() || null,
        description_en: String(form.get("description_en") ?? "").trim() || null,
        description_bn: String(form.get("description_bn") ?? "").trim() || null,
        ...(mediaPath ? { media_path: mediaPath, kind, width, height } : {}),
        previousMediaPath: mediaPath ? extractStoragePath(item.url) : undefined,
      });

      setEditing(false);
      notifyPanel();
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
        <MediaPreviewInput
          name="media"
          accept="image/*,video/*"
          busy={busy}
          existingUrl={item.url}
          existingIsVideo={item.kind === "video"}
        />
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
        {error ? <p role="alert" className="text-xs text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-wood px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            {busy ? <Spinner className="h-3 w-3 border-2 text-white" /> : null}
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
        {item.kind === "video" ? (
          <video src={item.url} className="h-full w-full object-cover" muted preload="metadata" />
        ) : (
          <Image src={item.url} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-wood uppercase">
          {item.categoryName} &middot; {item.kind}
        </p>
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

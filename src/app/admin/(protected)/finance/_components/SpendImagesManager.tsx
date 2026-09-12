"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { createSpendImage, deleteSpendImage, MAX_SPEND_IMAGES } from "@server/db/spendImages";
import { uploadFile, safeFileName } from "@server/supabase/storage";
import { compressImageIfNeeded } from "@/lib/compressImage";
import MediaPreviewInput from "../../_components/MediaPreviewInput";

export type SpendImageItem = { id: string; url: string };

export default function SpendImagesManager({
  financeRecordId,
  images,
}: {
  financeRecordId: string;
  images: SpendImageItem[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atLimit = images.length >= MAX_SPEND_IMAGES;

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const file = form.get("image") as File | null;
    if (!file || file.size === 0) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const compressed = await compressImageIfNeeded(file);
      const path = `spend-images/${safeFileName(compressed.name)}`;
      await uploadFile(supabase, path, compressed, compressed.type);
      await createSpendImage(supabase, financeRecordId, path);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    setError(null);
    try {
      await deleteSpendImage(createClient(), id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-navy">
        Images ({images.length}/{MAX_SPEND_IMAGES})
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        Optional photos for this spend — receipts, materials, whatever helps document it.
      </p>

      {images.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-xl border border-border bg-cream-dark/30">
              <div className="relative aspect-square w-full">
                <Image src={img.url} alt="" fill sizes="200px" className="object-cover" />
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDelete(img.id)}
                className="w-full px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {atLimit ? (
        <p className="mt-4 text-sm text-ink-soft">
          Limit reached ({MAX_SPEND_IMAGES}) — delete one to add another.
        </p>
      ) : (
        <form onSubmit={handleUpload} className="mt-4 max-w-xs">
          <MediaPreviewInput name="image" accept="image/*" required busy={busy} />
          <button
            type="submit"
            disabled={busy}
            className="mt-3 w-full rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
          >
            {busy ? "Uploading..." : "Add image"}
          </button>
        </form>
      )}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { createBanner, deleteBanner, moveBanner } from "@server/db/banners";
import { uploadFile, safeFileName } from "@server/supabase/storage";
import { compressImageIfNeeded } from "@/lib/compressImage";
import MediaPreviewInput from "../_components/MediaPreviewInput";
import Spinner from "@/components/Spinner";

type BannerItem = { id: string; url: string };

export default function BannersManager({
  initialBanners,
  maxBanners,
}: {
  initialBanners: BannerItem[];
  maxBanners: number;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atLimit = initialBanners.length >= maxBanners;

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
      const path = `banners/${safeFileName(compressed.name)}`;
      await uploadFile(supabase, path, compressed, compressed.type);
      await createBanner(supabase, path);
      formRef.current?.reset();
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
      const supabase = createClient();
      await deleteBanner(supabase, id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleMove(id: string, direction: "up" | "down") {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      await moveBanner(supabase, id, direction);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        ref={formRef}
        onSubmit={handleUpload}
        className="max-w-sm rounded-2xl border border-border bg-white p-5"
      >
        <MediaPreviewInput name="image" accept="image/*" required busy={busy} />
        <p className="mt-2 text-xs text-ink-soft">Images are automatically compressed to keep the site fast.</p>
        <button
          type="submit"
          disabled={atLimit || busy}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
        >
          {busy ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
          {busy ? "Uploading..." : "Add banner"}
        </button>
        {atLimit ? (
          <p className="mt-2 text-sm text-ink-soft">Limit reached ({maxBanners}) — delete one to add another.</p>
        ) : null}
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {initialBanners.length === 0 ? (
        <p className="text-sm text-ink-soft">No banners yet — add one above.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialBanners.map((banner, i) => (
            <div key={banner.id} className="overflow-hidden rounded-2xl border border-border bg-white">
              <div className="relative aspect-[16/7] w-full bg-cream-dark/40">
                <Image src={banner.url} alt="" fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={i === 0 || busy}
                    onClick={() => handleMove(banner.id, "up")}
                    className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === initialBanners.length - 1 || busy}
                    onClick={() => handleMove(banner.id, "down")}
                    className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-40"
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDelete(banner.id)}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

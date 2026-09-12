"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { updateCategory } from "@server/db/categories";
import { uploadFile, safeFileName, getPublicUrl } from "@server/supabase/storage";
import { compressImageIfNeeded } from "@/lib/compressImage";
import MediaPreviewInput from "../../_components/MediaPreviewInput";
import type { Category } from "@server/db/types";
import Spinner from "@/components/Spinner";

export default function EditCategoryForm({ category }: { category: Category }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const bannerUrl = category.banner_path ? getPublicUrl(createClient(), category.banner_path) : null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const form = new FormData(e.currentTarget);
      const nameEn = String(form.get("name_en") ?? "").trim();
      if (!nameEn) throw new Error("English name is required");

      const supabase = createClient();
      let bannerPath = category.banner_path;
      const bannerFile = form.get("banner") as File | null;
      if (bannerFile && bannerFile.size > 0) {
        const compressed = await compressImageIfNeeded(bannerFile);
        bannerPath = `categories/${safeFileName(compressed.name)}`;
        await uploadFile(supabase, bannerPath, compressed, compressed.type);
      }

      await updateCategory(supabase, category.id, {
        name_en: nameEn,
        name_bn: String(form.get("name_bn") ?? "").trim() || null,
        banner_path: bannerPath,
        description_en: String(form.get("description_en") ?? "").trim() || null,
        description_bn: String(form.get("description_bn") ?? "").trim() || null,
      });

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-navy">Banner image — optional</label>
        <div className="mt-1 max-w-xs">
          <MediaPreviewInput name="banner" accept="image/*" busy={busy} existingUrl={bannerUrl} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-navy">Name (English) *</label>
          <input
            name="name_en"
            required
            defaultValue={category.name_en}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Name (Bangla) — optional</label>
          <input
            name="name_bn"
            defaultValue={category.name_bn ?? ""}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-navy">Description (English) — optional</label>
        <textarea
          name="description_en"
          rows={2}
          defaultValue={category.description_en ?? ""}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-navy">Description (Bangla) — optional</label>
        <textarea
          name="description_bn"
          rows={2}
          defaultValue={category.description_bn ?? ""}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {saved ? <p className="text-sm text-green-700">Saved.</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
      >
        {busy ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
        {busy ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

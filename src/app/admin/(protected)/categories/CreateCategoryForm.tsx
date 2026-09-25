"use client";

import { notifyPanel } from "@/components/panel/PanelFeedback";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { createCategory } from "@server/db/categories";
import { uploadFile, safeFileName } from "@server/supabase/storage";
import { compressImageIfNeeded } from "@/lib/compressImage";
import MediaPreviewInput from "../_components/MediaPreviewInput";
import Spinner from "@/components/Spinner";

export default function CreateCategoryForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const nameEn = String(form.get("name_en") ?? "").trim();
      if (!nameEn) throw new Error("English name is required");

      const supabase = createClient();
      let bannerPath: string | null = null;
      const bannerFile = form.get("banner") as File | null;
      if (bannerFile && bannerFile.size > 0) {
        const compressed = await compressImageIfNeeded(bannerFile);
        bannerPath = `categories/${safeFileName(compressed.name)}`;
        await uploadFile(supabase, bannerPath, compressed, compressed.type);
      }

      await createCategory(supabase, {
        name_en: nameEn,
        name_bn: String(form.get("name_bn") ?? "").trim() || null,
        banner_path: bannerPath,
        description_en: String(form.get("description_en") ?? "").trim() || null,
        description_bn: String(form.get("description_bn") ?? "").trim() || null,
      });

      formRef.current?.reset();
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-navy">Name (English) *</label>
          <input name="name_en" required className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Name (Bangla) — optional</label>
          <input name="name_bn" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-navy">Banner image — optional</label>
        <div className="mt-1 max-w-xs">
          <MediaPreviewInput name="banner" accept="image/*" busy={busy} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-navy">Description (English) — optional</label>
        <textarea name="description_en" rows={2} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-navy">Description (Bangla) — optional</label>
        <textarea name="description_bn" rows={2} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
      </div>
      {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
      >
        {busy ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
        {busy ? "Creating..." : "Create category"}
      </button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { updateAboutUs } from "@server/db/aboutUs";
import type { AboutUs } from "@server/db/types";
import Spinner from "@/components/Spinner";

export default function AboutUsForm({ initial }: { initial: AboutUs | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const form = new FormData(e.currentTarget);
      await updateAboutUs(createClient(), {
        content_en: String(form.get("content_en") ?? "").trim() || null,
        content_bn: String(form.get("content_bn") ?? "").trim() || null,
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-navy">Content (English)</label>
        <p className="mt-1 text-xs text-ink-soft">Separate paragraphs with a blank line.</p>
        <textarea
          name="content_en"
          rows={8}
          defaultValue={initial?.content_en ?? ""}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-navy">Content (Bangla) — optional</label>
        <p className="mt-1 text-xs text-ink-soft">
          Shown when a visitor switches the site to বাং. Leave blank to always show the English text.
        </p>
        <textarea
          name="content_bn"
          rows={8}
          defaultValue={initial?.content_bn ?? ""}
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
        {busy ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

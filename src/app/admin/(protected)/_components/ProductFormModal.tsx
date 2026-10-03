"use client";

import { notifyPanel } from "@/components/panel/PanelFeedback";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { createPhotocard, updatePhotocard } from "@server/db/photocards";
import { uploadFile, safeFileName } from "@server/supabase/storage";
import { compressImageIfNeeded } from "@/lib/compressImage";
import { measureImage } from "@/lib/measureImage";
import Spinner from "@/components/Spinner";
import MediaPreviewInput from "./MediaPreviewInput";
import { extractStoragePath, parseProductPrice, type CategoryOption, type PhotocardItem } from "./PhotocardCard";

const fieldClass = "mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm";

/**
 * Create / update dialog for a product. Mount it to open it (it calls showModal on mount) and unmount it from
 * `onClose` to dismiss. Passing `item` switches it to update mode.
 */
export default function ProductFormModal({
  categories,
  item,
  initialCategoryId,
  onClose,
}: {
  categories: CategoryOption[];
  item?: PhotocardItem;
  initialCategoryId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = !!item;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const categoryId = String(form.get("category_id") ?? "");
      const nameEn = String(form.get("name_en") ?? "").trim();
      const file = form.get("image") as File | null;
      const hasFile = !!file && file.size > 0;
      const price = parseProductPrice(form.get("price"), "Price", false);
      const discountedPrice = parseProductPrice(form.get("discounted_price"), "Discounted price", false);
      if (price !== null && discountedPrice !== null && discountedPrice > price) throw new Error("Discounted price cannot be greater than price");
      if (!categoryId) throw new Error("Choose a category");
      if (!nameEn) throw new Error("Enter a name");
      if (!editing && !hasFile) throw new Error("Choose an image");

      const text = {
        name_en: nameEn,
        name_bn: String(form.get("name_bn") ?? "").trim() || null,
        description_en: String(form.get("description_en") ?? "").trim() || null,
        description_bn: String(form.get("description_bn") ?? "").trim() || null,
        price,
        discounted_price: discountedPrice,
      };

      const supabase = createClient();
      let imagePath: string | undefined;
      let width: number | null = null;
      let height: number | null = null;
      if (hasFile) {
        const compressed = await compressImageIfNeeded(file);
        const dims = await measureImage(compressed);
        imagePath = `photocards/${safeFileName(compressed.name)}`;
        await uploadFile(supabase, imagePath, compressed, compressed.type);
        width = dims?.width ?? null;
        height = dims?.height ?? null;
      }

      if (item) {
        await updatePhotocard(supabase, item.id, {
          category_id: categoryId,
          ...text,
          ...(imagePath ? { image_path: imagePath, width, height } : {}),
          previousImagePath: imagePath ? extractStoragePath(item.url) : undefined,
        });
      } else {
        await createPhotocard(supabase, { category_id: categoryId, image_path: imagePath!, width, height, ...text });
      }

      notifyPanel();
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : editing ? "Failed to save" : "Failed to add product");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="panel-theme panel-modal"
      aria-labelledby="product-modal-title"
      onCancel={(e) => { if (busy) e.preventDefault(); }}
      onClose={onClose}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) dialogRef.current?.close(); }}
    >
      <form onSubmit={handleSubmit} className="panel-modal-form">
        <header className="panel-modal-head">
          <h2 id="product-modal-title">{editing ? "Update product" : "Create product"}</h2>
          <button type="button" onClick={() => dialogRef.current?.close()} disabled={busy} aria-label="Close">×</button>
        </header>

        <div className="panel-modal-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <MediaPreviewInput name="image" accept="image/*" required={!editing} busy={busy} existingUrl={item?.url} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-navy">Category *</label>
              <select name="category_id" required defaultValue={item?.categoryId ?? initialCategoryId ?? ""} className={fieldClass}>
                <option value="" disabled>Choose a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy">Name (English) *</label>
              <input name="name_en" required defaultValue={item?.nameEn ?? ""} className={fieldClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy">Name (Bangla)</label>
              <input name="name_bn" defaultValue={item?.nameBn ?? ""} className={fieldClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy">Price</label>
              <input name="price" type="number" min="0" step="any" inputMode="decimal" defaultValue={item?.price ?? ""} className={fieldClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy">Discounted Price</label>
              <input name="discounted_price" type="number" min="0" step="any" inputMode="decimal" defaultValue={item?.discountedPrice ?? ""} className={fieldClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy">Description (English) — optional</label>
              <textarea name="description_en" rows={3} defaultValue={item?.descriptionEn ?? ""} className={fieldClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy">Description (Bangla) — optional</label>
              <textarea name="description_bn" rows={3} defaultValue={item?.descriptionBn ?? ""} className={fieldClass} />
            </div>
          </div>
          {error ? <p role="alert" className="mt-4 text-sm text-red-600">{error}</p> : null}
        </div>

        <footer className="panel-modal-foot">
          <button type="button" onClick={() => dialogRef.current?.close()} disabled={busy} className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-navy disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50">
            {busy ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
            {busy ? (editing ? "Saving..." : "Uploading...") : editing ? "Save changes" : "Add product"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}

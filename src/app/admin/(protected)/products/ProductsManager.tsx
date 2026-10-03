"use client";

import { confirmPanel, notifyPanel } from "@/components/panel/PanelFeedback";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@server/supabase/client";
import { deletePhotocard } from "@server/db/photocards";
import PhotocardCard, { type CategoryOption, type PhotocardItem } from "../_components/PhotocardCard";
import ProductFormModal from "../_components/ProductFormModal";

export default function ProductsManager({
  categories,
  items,
  initialCategoryId,
}: {
  categories: CategoryOption[];
  items: PhotocardItem[];
  initialCategoryId?: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>(initialCategoryId ?? "all");
  const [creating, setCreating] = useState(false);

  const visible = filter === "all" ? items : items.filter((i) => i.categoryId === filter);

  async function handleDelete(id: string) {
    if (!await confirmPanel("Delete this product? This cannot be undone.")) return;
    try {
      await deletePhotocard(createClient(), id);
      notifyPanel("The product was deleted.");
      router.refresh();
    } catch (err) {
      notifyPanel(err instanceof Error ? err.message : "Delete failed. Please try again.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">Products</h1>
          <p className="mt-1 text-sm text-ink-soft">Product images and prices shown on the Products page.</p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="shrink-0 rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light"
        >
          + Create
        </button>
      </div>

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
          {visible.length === 0 ? <p className="text-sm text-ink-soft">No products here yet.</p> : null}
        </div>
      </div>
      {creating ? <ProductFormModal categories={categories} initialCategoryId={initialCategoryId} onClose={() => setCreating(false)} /> : null}
    </div>
  );
}

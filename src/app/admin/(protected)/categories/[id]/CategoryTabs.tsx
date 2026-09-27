"use client";

import { notifyPanel } from "@/components/panel/PanelFeedback";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@server/supabase/client";
import { deletePhotocard } from "@server/db/photocards";
import { deleteRawMedia } from "@server/db/rawMedia";
import PhotocardCard, { type CategoryOption, type PhotocardItem } from "../../_components/PhotocardCard";
import RawMediaCard, { type RawMediaItem } from "../../_components/RawMediaCard";

export default function CategoryTabs({
  categoryId,
  categories,
  products,
  rawMedia,
}: {
  categoryId: string;
  categories: CategoryOption[];
  products: PhotocardItem[];
  rawMedia: RawMediaItem[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"products" | "rawMedia">("products");

  async function handleDeleteProduct(id: string) {
    await deletePhotocard(createClient(), id);
    notifyPanel();
      router.refresh();
  }

  async function handleDeleteRawMedia(id: string) {
    await deleteRawMedia(createClient(), id);
    notifyPanel();
      router.refresh();
  }

  return (
    <div>
      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("products")}
          className={`px-4 py-2 text-sm font-semibold ${
            tab === "products" ? "border-b-2 border-wood text-navy" : "text-ink-soft"
          }`}
        >
          Products ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("rawMedia")}
          className={`px-4 py-2 text-sm font-semibold ${
            tab === "rawMedia" ? "border-b-2 border-wood text-navy" : "text-ink-soft"
          }`}
        >
          Raw Media ({rawMedia.length})
        </button>
      </div>

      <div className="mt-6">
        {tab === "products" ? (
          <>
            <Link
              href={`/admin/products?category=${categoryId}`}
              className="inline-flex text-sm font-semibold text-wood hover:underline"
            >
              + Add product to this category
            </Link>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {products.map((p) => (
                <PhotocardCard key={p.id} item={p} categories={categories} onDelete={handleDeleteProduct} />
              ))}
              {products.length === 0 ? (
                <p className="text-sm text-ink-soft">No products in this category yet.</p>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <Link
              href={`/admin/raw-media?category=${categoryId}`}
              className="inline-flex text-sm font-semibold text-wood hover:underline"
            >
              + Add raw media to this category
            </Link>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {rawMedia.map((m) => (
                <RawMediaCard key={m.id} item={m} categories={categories} onDelete={handleDeleteRawMedia} />
              ))}
              {rawMedia.length === 0 ? (
                <p className="text-sm text-ink-soft">No raw media in this category yet.</p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";
import ProductFormModal from "./ProductFormModal";

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
  price: number | null;
  discountedPrice: number | null;
};

export function extractStoragePath(publicUrl: string): string | undefined {
  const marker = "/object/public/media/";
  const idx = publicUrl.indexOf(marker);
  return idx === -1 ? undefined : publicUrl.slice(idx + marker.length);
}

export function parseProductPrice(value: FormDataEntryValue | null, label: string, required: true): number;
export function parseProductPrice(value: FormDataEntryValue | null, label: string, required?: false): number | null;
export function parseProductPrice(value: FormDataEntryValue | null, label: string, required = false): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) {
    if (required) throw new Error(`${label} is required`);
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${label} must be a positive number`);
  return parsed;
}

export function formatProductPrice(value: number | null): string | null {
  if (value === null) return null;
  return `৳${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
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
  const [editing, setEditing] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="relative aspect-[4/3] w-full bg-cream-dark/40">
        <Image src={item.url} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-wood uppercase">{item.categoryName}</p>
        <p className="mt-1 truncate text-xs text-ink-soft">{item.nameEn ?? "—"}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-2 text-xs">
          {item.discountedPrice !== null ? (
            <>
              <span className="font-semibold text-navy">{formatProductPrice(item.discountedPrice)}</span>
              <span className="text-ink-soft line-through">{formatProductPrice(item.price)}</span>
            </>
          ) : item.price !== null ? (
            <span className="font-semibold text-navy">{formatProductPrice(item.price)}</span>
          ) : (
            <span className="text-ink-soft">Price not set</span>
          )}
        </div>
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
      {editing ? <ProductFormModal categories={categories} item={item} onClose={() => setEditing(false)} /> : null}
    </div>
  );
}

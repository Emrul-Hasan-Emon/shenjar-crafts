import { notFound } from "next/navigation";
import { createClient } from "@server/supabase/server-client";
import { getCategoryById, listCategories } from "@server/db/categories";
import { listPhotocards } from "@server/db/photocards";
import { listRawMedia } from "@server/db/rawMedia";
import { getPublicUrl } from "@server/supabase/storage";
import EditCategoryForm from "./EditCategoryForm";
import CategoryTabs from "./CategoryTabs";

export default async function AdminCategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const category = await getCategoryById(supabase, id);
  if (!category) notFound();

  const [allCategories, products, rawMedia] = await Promise.all([
    listCategories(supabase),
    listPhotocards(supabase, { categoryId: id }),
    listRawMedia(supabase, { categoryId: id }),
  ]);

  const categoryById = new Map(allCategories.map((c) => [c.id, c]));
  const productItems = products.map((p) => ({
    id: p.id,
    url: getPublicUrl(supabase, p.image_path),
    categoryId: p.category_id,
    categoryName: categoryById.get(p.category_id)?.name_en ?? "Unknown",
    nameEn: p.name_en,
    nameBn: p.name_bn,
    descriptionEn: p.description_en,
    descriptionBn: p.description_bn,
    price: p.price ?? null,
    discountedPrice: p.discounted_price ?? null,
  }));
  const rawMediaItems = rawMedia.map((m) => ({
    id: m.id,
    url: getPublicUrl(supabase, m.media_path),
    kind: m.kind,
    categoryId: m.category_id,
    categoryName: categoryById.get(m.category_id)?.name_en ?? "Unknown",
    nameEn: m.name_en,
    nameBn: m.name_bn,
    descriptionEn: m.description_en,
    descriptionBn: m.description_bn,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">{category.name_en}</h1>
      <p className="mt-1 text-sm text-ink-soft">/{category.slug}</p>

      <div className="mt-8 max-w-xl rounded-2xl border border-border bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-navy">Edit category</h2>
        <div className="mt-4">
          <EditCategoryForm category={category} />
        </div>
      </div>

      <div className="mt-10">
        <CategoryTabs
          categoryId={category.id}
          categories={allCategories.map((c) => ({ id: c.id, name: c.name_en }))}
          products={productItems}
          rawMedia={rawMediaItems}
        />
      </div>
    </div>
  );
}

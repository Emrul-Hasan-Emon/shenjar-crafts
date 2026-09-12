import { createClient } from "@server/supabase/server-client";
import { listCategories } from "@server/db/categories";
import { listPhotocards } from "@server/db/photocards";
import { getPublicUrl } from "@server/supabase/storage";
import PhotocardsManager from "./PhotocardsManager";

export default async function AdminPhotocardsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();
  const [categories, photocards] = await Promise.all([listCategories(supabase), listPhotocards(supabase)]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const items = photocards.map((p) => ({
    id: p.id,
    url: getPublicUrl(supabase, p.image_path),
    categoryId: p.category_id,
    categoryName: categoryById.get(p.category_id)?.name_en ?? "Unknown",
    nameEn: p.name_en,
    nameBn: p.name_bn,
    descriptionEn: p.description_en,
    descriptionBn: p.description_bn,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Photocards</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Promotional images shown on the Products page.
      </p>
      <div className="mt-8">
        <PhotocardsManager
          categories={categories.map((c) => ({ id: c.id, name: c.name_en }))}
          items={items}
          initialCategoryId={category}
        />
      </div>
    </div>
  );
}

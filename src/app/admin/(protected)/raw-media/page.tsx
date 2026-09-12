import { createClient } from "@server/supabase/server-client";
import { listCategories } from "@server/db/categories";
import { listRawMedia } from "@server/db/rawMedia";
import { getPublicUrl } from "@server/supabase/storage";
import RawMediaManager from "./RawMediaManager";

export default async function AdminRawMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();
  const [categories, rawMedia] = await Promise.all([listCategories(supabase), listRawMedia(supabase)]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const items = rawMedia.map((m) => ({
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
      <h1 className="font-display text-2xl font-semibold text-navy">Raw Media</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Real photos and videos shown on the Our Work page.
      </p>
      <div className="mt-8">
        <RawMediaManager
          categories={categories.map((c) => ({ id: c.id, name: c.name_en }))}
          items={items}
          initialCategoryId={category}
        />
      </div>
    </div>
  );
}

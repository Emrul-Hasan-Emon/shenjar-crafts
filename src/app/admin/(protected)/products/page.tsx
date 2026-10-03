import { createClient } from "@server/supabase/server-client";
import { listCategories } from "@server/db/categories";
import { listPhotocards } from "@server/db/photocards";
import { getPublicUrl } from "@server/supabase/storage";
import ProductsManager from "./ProductsManager";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();
  const [categories, products] = await Promise.all([listCategories(supabase), listPhotocards(supabase)]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const items = products.map((p) => ({
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

  return (
    <ProductsManager
      categories={categories.map((c) => ({ id: c.id, name: c.name_en }))}
      items={items}
      initialCategoryId={category}
    />
  );
}

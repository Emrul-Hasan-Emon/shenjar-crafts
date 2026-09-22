import PageIntro from "@/components/PageIntro";
import type { Metadata } from "next";
import { Suspense } from "react";
import Container from "@/components/Container";
import ProductsGrid, { type ProductGridCategory, type ProductGridItem } from "@/components/ProductsGrid";
import CTABand from "@/components/CTABand";
import { createClient } from "@server/supabase/server-client";
import { listCategories } from "@server/db/categories";
import { listPhotocards } from "@server/db/photocards";
import { getPublicUrl } from "@server/supabase/storage";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Our Craft",
  description:
    "Browse custom furniture, storage, and interior pieces made by Shenjar Crafts in Dhaka — bedside cabinets, dressing tables, bookshelves, wall racks, and more.",
};

export default async function ProductsPage() {
  const supabase = await createClient();
  const [categories, photocards] = await Promise.all([
    listCategories(supabase),
    listPhotocards(supabase),
  ]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const items: ProductGridItem[] = photocards
    .map((p) => {
      const category = categoryById.get(p.category_id);
      if (!category) return null;
      const item: ProductGridItem = {
        id: p.id,
        categorySlug: category.slug,
        categoryName: category.name_en,
        categoryNameBn: category.name_bn,
        imageUrl: getPublicUrl(supabase, p.image_path),
        width: p.width,
        height: p.height,
        name: p.name_en,
        nameBn: p.name_bn,
        descriptionEn: p.description_en,
        descriptionBn: p.description_bn,
      };
      return item;
    })
    .filter((item): item is ProductGridItem => item !== null);

  const activeSlugs = new Set(items.map((i) => i.categorySlug));
  const gridCategories: ProductGridCategory[] = categories
    .filter((c) => activeSlugs.has(c.slug))
    .map((c) => ({ slug: c.slug, name: c.name_en, nameBn: c.name_bn }));

  return (
    <>
      <PageIntro eyebrow="Our Craft" title="Made for your space. Made to be yours." description="Explore furniture and interior pieces, then make a design your own in size, material, and finish." />
      <section className="py-6 sm:py-10 lg:py-12">
        <Container>
<div className="min-w-0">
            <Suspense fallback={null}>
              <ProductsGrid items={items} categories={gridCategories} />
            </Suspense>
          </div>
        </Container>
      </section>

      <CTABand />
    </>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import ProductsGrid, { type ProductGridCategory, type ProductGridItem } from "@/components/ProductsGrid";
import CTABand from "@/components/CTABand";
import { createClient } from "@server/supabase/server-client";
import { listCategories } from "@server/db/categories";
import { listPhotocards } from "@server/db/photocards";
import { getPublicUrl } from "@server/supabase/storage";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Products",
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
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="What We Can Build"
            title="Products"
            description="A look at furniture and interior pieces we design and build — share one as a reference or ask for a fully custom size, color, and finish."
            align="center"
          />
          <div className="mt-12">
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

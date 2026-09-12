import type { Metadata } from "next";
import { Suspense } from "react";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import OurWorkGrid, { type OurWorkCategory, type OurWorkItem } from "@/components/OurWorkGrid";
import CTABand from "@/components/CTABand";
import { createClient } from "@server/supabase/server-client";
import { listCategories } from "@server/db/categories";
import { listRawMedia } from "@server/db/rawMedia";
import { getPublicUrl } from "@server/supabase/storage";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "Real furniture, interior, and electrical projects completed by Shenjar Crafts in Dhaka — straight from our workshop and job sites.",
};

export default async function OurWorkPage() {
  const supabase = await createClient();
  const [categories, rawMedia] = await Promise.all([
    listCategories(supabase),
    listRawMedia(supabase),
  ]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const items: OurWorkItem[] = rawMedia
    .map((m) => {
      const category = categoryById.get(m.category_id);
      if (!category) return null;
      const item: OurWorkItem = {
        id: m.id,
        categorySlug: category.slug,
        categoryName: category.name_en,
        categoryNameBn: category.name_bn,
        kind: m.kind,
        url: getPublicUrl(supabase, m.media_path),
        width: m.width,
        height: m.height,
        name: m.name_en,
        nameBn: m.name_bn,
        descriptionEn: m.description_en,
        descriptionBn: m.description_bn,
      };
      return item;
    })
    .filter((item): item is OurWorkItem => item !== null);

  const activeSlugs = new Set(items.map((i) => i.categorySlug));
  const gridCategories: OurWorkCategory[] = categories
    .filter((c) => activeSlugs.has(c.slug))
    .map((c) => ({ slug: c.slug, name: c.name_en, nameBn: c.name_bn }));

  return (
    <>
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Our Work"
            title="Real projects, real workmanship"
            description="A selection of furniture, interior, exterior, and electrical projects straight from our workshop and job sites."
            align="center"
          />
          <div className="mt-12">
            <Suspense fallback={null}>
              <OurWorkGrid items={items} categories={gridCategories} />
            </Suspense>
          </div>
        </Container>
      </section>

      <CTABand />
    </>
  );
}

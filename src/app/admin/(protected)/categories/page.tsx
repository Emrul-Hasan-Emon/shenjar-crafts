import Link from "next/link";
import Image from "next/image";
import { createClient } from "@server/supabase/server-client";
import { listCategories } from "@server/db/categories";
import { listPhotocards } from "@server/db/photocards";
import { listRawMedia } from "@server/db/rawMedia";
import { getPublicUrl } from "@server/supabase/storage";
import CreateCategoryForm from "./CreateCategoryForm";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const [categories, photocards, rawMedia] = await Promise.all([
    listCategories(supabase),
    listPhotocards(supabase),
    listRawMedia(supabase),
  ]);

  const photocardCount = new Map<string, number>();
  for (const p of photocards) photocardCount.set(p.category_id, (photocardCount.get(p.category_id) ?? 0) + 1);
  const rawMediaCount = new Map<string, number>();
  for (const m of rawMedia) rawMediaCount.set(m.category_id, (rawMediaCount.get(m.category_id) ?? 0) + 1);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Categories</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Create categories here, then attach photocards and raw media to them.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/admin/categories/${category.id}`}
            className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 transition-shadow hover:shadow-[0_20px_40px_-28px_rgba(22,41,74,0.3)]"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-dark/40">
              {category.banner_path ? (
                <Image src={getPublicUrl(supabase, category.banner_path)} alt="" fill sizes="64px" className="object-cover" />
              ) : null}
            </div>
            <div>
              <p className="font-semibold text-navy">{category.name_en}</p>
              {category.name_bn ? <p className="text-xs text-ink-soft">{category.name_bn}</p> : null}
              <p className="mt-1 text-xs text-ink-soft">
                {photocardCount.get(category.id) ?? 0} photocard(s) &middot;{" "}
                {rawMediaCount.get(category.id) ?? 0} raw media
              </p>
            </div>
          </Link>
        ))}
        {categories.length === 0 ? (
          <p className="text-sm text-ink-soft">No categories yet — create one below.</p>
        ) : null}
      </div>

      <div className="mt-10 max-w-xl rounded-2xl border border-border bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-navy">New category</h2>
        <div className="mt-4">
          <CreateCategoryForm />
        </div>
      </div>
    </div>
  );
}

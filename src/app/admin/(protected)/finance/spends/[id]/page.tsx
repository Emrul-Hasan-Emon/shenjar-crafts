import { notFound } from "next/navigation";
import { createClient } from "@server/supabase/server-client";
import { getFinanceRecordById } from "@server/db/finance";
import { listCategories } from "@server/db/categories";
import { listSpendImages } from "@server/db/spendImages";
import { getPublicUrl } from "@server/supabase/storage";
import FinanceRecordForm from "../../_components/FinanceRecordForm";
import SpendImagesManager from "../../_components/SpendImagesManager";

export default async function SpendDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [record, categories, spendImages] = await Promise.all([
    getFinanceRecordById(supabase, id),
    listCategories(supabase),
    listSpendImages(supabase, id),
  ]);
  if (!record || record.type !== "spend") notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">{record.name}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Created {new Date(record.created_at).toLocaleDateString()} · Last updated{" "}
        {new Date(record.updated_at).toLocaleDateString()}
      </p>
      <div className="mt-8 max-w-3xl space-y-8">
        <FinanceRecordForm
          type="spend"
          record={record}
          categories={categories.map((c) => ({ id: c.id, name: c.name_en }))}
        />
        <SpendImagesManager
          financeRecordId={record.id}
          images={spendImages.map((img) => ({ id: img.id, url: getPublicUrl(supabase, img.image_path) }))}
        />
      </div>
    </div>
  );
}

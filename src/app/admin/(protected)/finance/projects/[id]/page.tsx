import { notFound } from "next/navigation";
import { createClient } from "@server/supabase/server-client";
import { getFinanceRecordById } from "@server/db/finance";
import { listCategories } from "@server/db/categories";
import FinanceRecordForm from "../../_components/FinanceRecordForm";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [record, categories] = await Promise.all([
    getFinanceRecordById(supabase, id),
    listCategories(supabase),
  ]);
  if (!record || record.type !== "project") notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">{record.name}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Created {new Date(record.created_at).toLocaleDateString()} · Last updated{" "}
        {new Date(record.updated_at).toLocaleDateString()}
      </p>
      <div className="mt-8 max-w-3xl">
        <FinanceRecordForm
          type="project"
          record={record}
          categories={categories.map((c) => ({ id: c.id, name: c.name_en }))}
        />
      </div>
    </div>
  );
}

import { createClient } from "@server/supabase/server-client";
import { listCategories } from "@server/db/categories";
import FinanceRecordForm from "../../_components/FinanceRecordForm";

export default async function NewSpendPage() {
  const supabase = await createClient();
  const categories = await listCategories(supabase);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">New Spend</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Category, name, and cost are required. You can attach up to 3 images once it&apos;s saved.
      </p>
      <div className="mt-8 max-w-3xl">
        <FinanceRecordForm
          type="spend"
          categories={categories.map((c) => ({ id: c.id, name: c.name_en }))}
        />
      </div>
    </div>
  );
}

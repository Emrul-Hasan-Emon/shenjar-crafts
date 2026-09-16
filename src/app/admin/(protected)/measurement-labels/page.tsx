import Link from "next/link";
import { createClient } from "@server/supabase/server-client";
import { listMeasurementLabels } from "@server/craft-design/measurement-labels/measurementLabels";
import CreateMeasurementLabelForm from "./CreateMeasurementLabelForm";

export default async function MeasurementLabelsPage() {
  const supabase = await createClient();
  const labels = await listMeasurementLabels(supabase);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Measurement Labels</h1>
      <p className="mt-1 text-sm text-ink-soft">
        The kinds of parts a furniture piece can have (Side, Top, Bottom, Front, Back, or
        anything else) — each defines its own set of dimension fields.
      </p>

      <div className="mt-8 max-w-xl">
        <CreateMeasurementLabelForm />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {labels.map((label) => (
          <Link
            key={label.id}
            href={`/admin/measurement-labels/${label.id}`}
            className="rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-[0_20px_40px_-28px_rgba(22,41,74,0.3)]"
          >
            <p className="font-display text-lg font-semibold text-navy">{label.name_en}</p>
            <p className="mt-1 text-sm text-ink-soft">Default quantity: {label.default_quantity}</p>
            <p className="mt-3 text-sm font-semibold text-wood">Manage dimensions →</p>
          </Link>
        ))}
        {labels.length === 0 ? <p className="text-sm text-ink-soft">No measurement labels yet.</p> : null}
      </div>
    </div>
  );
}

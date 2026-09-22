import { createClient } from "@server/supabase/server-client";
import { listMeasurementLabels } from "@server/craft-design/measurement-labels/measurementLabels";
import CreateMeasurementLabelForm from "./CreateMeasurementLabelForm";
import MeasurementLabelCard from "./MeasurementLabelCard";

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

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {labels.map((label) => (
          <MeasurementLabelCard key={label.id} label={label} />
        ))}
        {labels.length === 0 ? <p className="text-sm text-ink-soft">No measurement labels yet.</p> : null}
      </div>
    </div>
  );
}

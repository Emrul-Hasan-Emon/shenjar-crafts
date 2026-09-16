import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@server/supabase/server-client";
import { getMeasurementLabelById } from "@server/craft-design/measurement-labels/measurementLabels";
import { listMeasurementLabelDimensions } from "@server/craft-design/measurement-labels/measurementLabelDimensions";
import MeasurementLabelDimensionsManager from "./MeasurementLabelDimensionsManager";

export default async function MeasurementLabelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [label, dimensions] = await Promise.all([
    getMeasurementLabelById(supabase, id),
    listMeasurementLabelDimensions(supabase, id),
  ]);
  if (!label) notFound();

  return (
    <div>
      <Link href="/admin/measurement-labels" className="text-sm font-semibold text-wood hover:underline">
        ← Back to Measurement Labels
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-navy">{label.name_en}</h1>
      <p className="mt-1 text-sm text-ink-soft">Default quantity: {label.default_quantity}</p>

      <div className="mt-8 max-w-2xl">
        <MeasurementLabelDimensionsManager measurementLabelId={label.id} dimensions={dimensions} />
      </div>
    </div>
  );
}

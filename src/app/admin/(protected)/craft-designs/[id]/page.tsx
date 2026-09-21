import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@server/supabase/server-client";
import { getCraftsDesignById } from "@server/craft-design/designs/craftsDesigns";
import { listCraftDesignParts } from "@server/craft-design/designs/craftDesignMeasurementLabel";
import { listCraftDesignMaterials } from "@server/craft-design/designs/craftDesignMaterials";
import { getCraftDesignCostBreakdown } from "@server/craft-design/designs/costBreakdown";
import { listMeasurementLabels } from "@server/craft-design/measurement-labels/measurementLabels";
import { listBoardColors } from "@server/boards/colors";
import { listBoardThicknesses } from "@server/boards/thicknesses";
import { listMaterials } from "@server/materials/materials";
import { listFinanceRecords } from "@server/db/finance";
import EditDesignForm from "./EditDesignForm";
import PartsManager from "./PartsManager";
import MaterialsSection from "./MaterialsSection";
import CostBreakdownPanel from "./CostBreakdownPanel";

export default async function CraftDesignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const design = await getCraftsDesignById(supabase, id);
  if (!design) notFound();

  const [parts, materials, breakdown, labels, colors, thicknesses, materialCatalog, projects] = await Promise.all([
    listCraftDesignParts(supabase, id),
    listCraftDesignMaterials(supabase, id),
    getCraftDesignCostBreakdown(supabase, id),
    listMeasurementLabels(supabase),
    listBoardColors(supabase),
    listBoardThicknesses(supabase),
    listMaterials(supabase),
    listFinanceRecords(supabase, { type: "project" }),
  ]);

  return (
    <div>
      <Link href="/admin/craft-designs" className="text-sm font-semibold text-wood hover:underline">
        ← Back to Craft Designs
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">{design.name_en}</h1>
          {design.project_name ? (
            <p className="mt-1 text-sm text-ink-soft">Project: {design.project_name}</p>
          ) : null}
        </div>
        <Link
          href={`/admin/craft-designs/${design.id}/invoice`}
          className="rounded-full border border-navy/15 px-5 py-2 text-sm font-semibold text-navy hover:bg-cream-dark"
        >
          View Invoice
        </Link>
      </div>

      <div className="mt-6">
        <EditDesignForm design={design} projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <PartsManager
            designId={design.id}
            parts={parts}
            availableLabels={labels}
            colors={colors}
            thicknesses={thicknesses}
          />
          <MaterialsSection designId={design.id} materials={materials} materialCatalog={materialCatalog} />
        </div>
        <div>
          <CostBreakdownPanel breakdown={breakdown} />
        </div>
      </div>
    </div>
  );
}

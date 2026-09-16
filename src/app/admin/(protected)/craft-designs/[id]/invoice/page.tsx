import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@server/supabase/server-client";
import { getCraftsDesignById } from "@server/craft-design/designs/craftsDesigns";
import { listCraftDesignParts } from "@server/craft-design/designs/craftDesignMeasurementLabel";
import { listCraftDesignMaterials } from "@server/craft-design/designs/craftDesignMaterials";
import { getCraftDesignCostBreakdown } from "@server/craft-design/designs/costBreakdown";
import { listBoardColors } from "@server/boards/colors";
import { listBoardThicknesses } from "@server/boards/thicknesses";
import { listBoards } from "@server/boards/boards";
import CraftDesignInvoiceView from "./CraftDesignInvoiceView";
import PrintButton from "@/components/PrintButton";

export default async function CraftDesignInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const design = await getCraftsDesignById(supabase, id);
  if (!design) notFound();

  const [parts, materials, breakdown, colors, thicknesses, boards] = await Promise.all([
    listCraftDesignParts(supabase, id),
    listCraftDesignMaterials(supabase, id),
    getCraftDesignCostBreakdown(supabase, id),
    listBoardColors(supabase),
    listBoardThicknesses(supabase),
    listBoards(supabase),
  ]);

  return (
    <div>
      <div className="print:hidden">
        <Link href={`/admin/craft-designs/${id}`} className="text-sm font-semibold text-wood hover:underline">
          ← Back to Craft Design
        </Link>
      </div>

      <div className="mt-6">
        <CraftDesignInvoiceView
          design={design}
          parts={parts}
          materials={materials}
          breakdown={breakdown}
          colors={colors}
          thicknesses={thicknesses}
          boards={boards}
        />
      </div>

      <div className="mt-6 flex justify-center print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}

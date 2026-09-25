"use client";

import { notifyPanel } from "@/components/panel/PanelFeedback";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@server/supabase/client";
import { addCraftDesignPart, type CraftDesignPartDetail } from "@server/craft-design/designs/craftDesignMeasurementLabel";
import type { MeasurementLabel } from "@server/craft-design/measurement-labels/types";
import type { BoardColor, BoardThickness } from "@server/boards/types";
import Spinner from "@/components/Spinner";
import PartCard from "./PartCard";

export default function PartsManager({
  designId,
  parts,
  availableLabels,
  colors,
  thicknesses,
}: {
  designId: string;
  parts: CraftDesignPartDetail[];
  availableLabels: MeasurementLabel[];
  colors: BoardColor[];
  thicknesses: BoardThickness[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState("");

  const usedLabelIds = new Set(parts.map((p) => p.measurement_label_id));
  const remainingLabels = availableLabels.filter((l) => !usedLabelIds.has(l.id));

  async function handleAddPart() {
    if (!selectedLabelId) return;
    setBusy(true);
    setError(null);
    try {
      await addCraftDesignPart(createClient(), designId, selectedLabelId);
      setSelectedLabelId("");
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add part");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-navy">Measurements</h2>

      {remainingLabels.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <select
            value={selectedLabelId}
            onChange={(e) => setSelectedLabelId(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            <option value="">Add a part...</option>
            {remainingLabels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name_en}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddPart}
            disabled={busy || !selectedLabelId}
            className="inline-flex items-center gap-2 rounded-full bg-wood px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? <Spinner className="h-3.5 w-3.5 border-2 text-white" /> : null}
            Add
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-soft">
          {availableLabels.length === 0
            ? "No Measurement Labels exist yet — create one under Measurement Labels first."
            : "Every available measurement label has been added to this design."}
        </p>
      )}
      {error ? <p role="alert" className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 space-y-4">
        {parts.map((part) => (
          <PartCard key={part.id} part={part} colors={colors} thicknesses={thicknesses} />
        ))}
        {parts.length === 0 ? <p className="text-sm text-ink-soft">No measurements added yet.</p> : null}
      </div>
    </section>
  );
}

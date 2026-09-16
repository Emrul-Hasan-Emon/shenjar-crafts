import type { CraftsDesignWithProject } from "@server/craft-design/designs/craftsDesigns";
import type { CraftDesignPartDetail } from "@server/craft-design/designs/craftDesignMeasurementLabel";
import type { CraftDesignMaterialDetail } from "@server/craft-design/designs/craftDesignMaterials";
import type { CraftDesignCostBreakdown } from "@server/craft-design/designs/costBreakdown";
import type { BoardColor, BoardThickness, Board } from "@server/boards/types";
import { site } from "@/data/site";

function resolveBoard(
  part: CraftDesignPartDetail,
  boards: Board[],
  defaultColor: BoardColor | undefined,
  defaultThickness: BoardThickness | undefined
) {
  const colorId = part.color_id ?? defaultColor?.id;
  const thicknessId = part.thickness_id ?? defaultThickness?.id;
  return boards.find((b) => b.color_id === colorId && b.thickness_id === thicknessId) ?? null;
}

export default function CraftDesignInvoiceView({
  design,
  parts,
  materials,
  breakdown,
  colors,
  thicknesses,
  boards,
}: {
  design: CraftsDesignWithProject;
  parts: CraftDesignPartDetail[];
  materials: CraftDesignMaterialDetail[];
  breakdown: CraftDesignCostBreakdown;
  colors: BoardColor[];
  thicknesses: BoardThickness[];
  boards: Board[];
}) {
  const colorById = new Map(colors.map((c) => [c.id, c]));
  const thicknessById = new Map(thicknesses.map((t) => [t.id, t]));
  const defaultColor = colors.find((c) => c.is_default);
  const defaultThickness = thicknesses.find((t) => t.is_default);

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-10 print:rounded-none print:border-none print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="font-display text-xl font-bold text-navy">{site.name}</p>
          <p className="mt-1 text-sm text-ink-soft">Craft Design — Measurement &amp; Cost Breakdown</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tracking-[0.2em] text-wood uppercase">Internal Only</p>
          <p className="mt-1 text-xs text-ink-soft">#{design.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-xs text-ink-soft">{new Date(design.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Design</p>
          <p className="mt-1 font-semibold text-navy">{design.name_en}</p>
          {design.project_name ? <p className="text-ink-soft">Project: {design.project_name}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Quantity</p>
          <p className="mt-1 font-semibold text-navy">{design.quantity} unit(s)</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Measurements</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="border-b border-border text-xs font-semibold tracking-wide text-ink-soft uppercase">
            <tr>
              <th className="py-2">Part</th>
              <th className="py-2">Dimensions</th>
              <th className="py-2">Board</th>
              <th className="py-2">Qty</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part) => {
              const board = resolveBoard(part, boards, defaultColor, defaultThickness);
              const resolvedColorId = part.color_id ?? defaultColor?.id;
              const resolvedThicknessId = part.thickness_id ?? defaultThickness?.id;
              return (
                <tr key={part.id} className="border-b border-border align-top">
                  <td className="py-3 font-semibold text-navy">{part.measurement_label.name_en}</td>
                  <td className="py-3">
                    {part.dimensions.map((d) => (
                      <p key={d.id} className={d.counts_toward_area ? "" : "text-ink-soft"}>
                        {d.measurement_label_dimensions.label_en}: {d.value_inches}in {d.value_shuta}sh
                        {!d.counts_toward_area ? " (reference only)" : ""}
                      </p>
                    ))}
                  </td>
                  <td className="py-3">
                    {resolvedColorId ? colorById.get(resolvedColorId)?.name_en ?? "—" : "—"} ·{" "}
                    {resolvedThicknessId ? thicknessById.get(resolvedThicknessId)?.value_mm ?? "—" : "—"}mm
                    {board?.name_en ? <span className="block text-xs text-ink-soft">{board.name_en}</span> : null}
                  </td>
                  <td className="py-3">{part.quantity}</td>
                </tr>
              );
            })}
            {parts.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-ink-soft">
                  No measurements recorded.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h2 className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Boards Needed</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="border-b border-border text-xs font-semibold tracking-wide text-ink-soft uppercase">
            <tr>
              <th className="py-2">Board</th>
              <th className="py-2">Sheets Needed</th>
              <th className="py-2 text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.boardLines.map((line) => (
              <tr key={line.board_id} className="border-b border-border">
                <td className="py-2">
                  {line.board.color.name_en} · {line.board.thickness.value_mm}mm
                </td>
                <td className="py-2">{line.sheets_needed}</td>
                <td className="py-2 text-right">৳{line.board_cost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h2 className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Materials</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="border-b border-border text-xs font-semibold tracking-wide text-ink-soft uppercase">
            <tr>
              <th className="py-2">Material</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Unit Price</th>
              <th className="py-2 text-right">Line Cost</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id} className="border-b border-border">
                <td className="py-2">{m.material.name_en}</td>
                <td className="py-2">{m.quantity}</td>
                <td className="py-2">৳{m.material.unit_price.toFixed(2)}</td>
                <td className="py-2 text-right">৳{(m.quantity * m.material.unit_price).toFixed(2)}</td>
              </tr>
            ))}
            {materials.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-ink-soft">
                  No materials recorded.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-end">
        <div className="w-full max-w-[16rem] space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-soft">Board Cost</span>
            <span className="font-semibold text-navy">৳{breakdown.boardCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">Material Cost</span>
            <span className="font-semibold text-navy">৳{breakdown.materialCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-navy">
            <span>Grand Total</span>
            <span>৳{breakdown.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-ink-soft">
        Internal cost breakdown — not for customer distribution.
      </p>
    </div>
  );
}

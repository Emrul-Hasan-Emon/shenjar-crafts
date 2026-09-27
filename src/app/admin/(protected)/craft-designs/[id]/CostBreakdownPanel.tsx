import type { CraftDesignCostBreakdown } from "@server/craft-design/designs/costBreakdown";

export default function CostBreakdownPanel({ breakdown }: { breakdown: CraftDesignCostBreakdown }) {
  return (
    <section className="sticky top-24 rounded-2xl border border-border bg-white p-5">
      <h2 className="font-display text-lg font-semibold text-navy">Cost Breakdown</h2>
      <p className="mt-1 text-xs text-ink-soft">
        Calculated from the raw measurements — never a typed-in figure.
      </p>

      <div className="mt-4 space-y-3">
        {breakdown.boardLines.map((line) => (
          <div key={line.board_id} className="rounded-lg border border-border p-3 text-sm">
            <p className="font-semibold text-navy">
              {line.board.color.name_en} · {line.board.thickness.value_mm}mm
              {line.board.name_en ? ` (${line.board.name_en})` : ""}
            </p>
            <p className="mt-1 text-ink-soft">Sheets needed: {line.sheets_needed}</p>
            <p className="text-ink-soft">Cost: ৳{line.board_cost.toFixed(2)}</p>
          </div>
        ))}
        {breakdown.boardLines.length === 0 ? (
          <p className="text-sm text-ink-soft">No measurements yet.</p>
        ) : null}
      </div>

      <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
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
    </section>
  );
}

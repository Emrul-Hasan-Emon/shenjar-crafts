/**
 * Craft Design cost calculation.
 *
 * WHAT THIS FILE DOES
 * --------------------
 * Given the raw measurements an admin has entered for a furniture design (its "parts",
 * like Side/Top/Bottom, each with a Depth/Length/Width in inches+shuta), this file works
 * out:
 *   1. Which physical board (color + thickness) each part actually uses.
 *   2. How much board *area* each part needs.
 *   3. How many whole board *sheets* the design needs (parts sharing a board are pooled
 *      together first, so leftover sheet space isn't wasted).
 *   4. The total board cost and the total material (hardware) cost.
 *
 * WHY IT LIVES HERE AND NOT IN THE DATABASE
 * ------------------------------------------
 * This used to be three chained Postgres views. It moved into plain TypeScript because
 * nothing downstream ever *trusts* this number the way, say, an invoice total is trusted —
 * a Craft Design's cost is never written back into another table and never gates anything
 * (see docs/craft-design.md, "Not connected to Finance"). It's pure display for the one
 * admin user, who already has full database access either way. Since there's no real
 * "browser could cheat" risk here, computing it in the app instead of the database makes it
 * far easier to read, test, and change.
 *
 * HOW TO READ THIS FILE
 * ----------------------
 * Every exported function does ONE small, clearly-named step. `getCostBreakdown` in
 * `./costBreakdown.ts` is the only place that chains them together against real database
 * rows — this file has no Supabase calls at all, so every function here can be tested with
 * plain JavaScript objects, no database required.
 *
 * See docs/craft-design.md for a full walkthrough with a worked example.
 */

// ---------------------------------------------------------------------------
// Step 1: unit conversion (inches + shuta -> a single "shuta" number)
// ---------------------------------------------------------------------------

/**
 * A measured length in this module is always stored as two numbers — a whole number of
 * inches, plus a finer subdivision called "shuta" (a traditional Bangladeshi carpentry
 * unit). There are exactly 8 shuta in 1 inch.
 *
 * Example: 2 inches and 3 shuta = (2 * 8) + 3 = 19 shuta total.
 *
 * All the math in this file works in "total shuta" so that every length is a single plain
 * number, never a pair of numbers that would otherwise need to be added/multiplied together
 * carefully by hand everywhere.
 */
const SHUTA_PER_INCH = 8;

export type ShutaLength = { value_inches: number; value_shuta: number };

/** Converts one (inches, shuta) pair into a single total-shuta number. */
export function toTotalShuta(length: ShutaLength): number {
  return length.value_inches * SHUTA_PER_INCH + length.value_shuta;
}

// ---------------------------------------------------------------------------
// Step 2: resolving one design part to its board and its area
// ---------------------------------------------------------------------------

export type PartDimension = ShutaLength & {
  /** True when this particular measured dimension should count toward the part's area
   *  (e.g. "Length" and "Depth" count, but a label's third field "Notes on grain" might not).
   *  Exactly 2 dimensions must be flagged true for the area math to make sense — that rule
   *  is enforced where the data is written, in `craftDesignMeasurementLabel.ts`, not here. */
  counts_toward_area: boolean;
};

/** One "part" of a design — e.g. one "Side" or one "Top" — as it's stored in
 *  `craft_design_measurement_label`, with its measured dimensions attached. */
export type PartForCalculation = {
  /** Row id of this part, carried through only so a result can be traced back to it. */
  craft_design_measurement_label_id: string;
  /** How many of this part one unit of the design needs (e.g. a "Side" needs 2: left + right). */
  quantity: number;
  /** An explicit board-color override for this part, or null to use the catalog default. */
  color_id: string | null;
  /** An explicit board-thickness override for this part, or null to use the catalog default. */
  thickness_id: string | null;
  dimensions: PartDimension[];
};

/** A physical, priced sheet of board material — one row from the `boards` catalog. */
export type BoardForCalculation = {
  id: string;
  color_id: string;
  thickness_id: string;
  sheet_length_inches: number;
  sheet_length_shuta: number;
  sheet_width_inches: number;
  sheet_width_shuta: number;
  price_per_sheet: number;
  /** Extra percentage of area to buy on top of the exact math, to cover cutting waste. */
  wastage_percent: number;
};

/** A design part after it's been matched to a real board and its area has been worked out. */
export type ResolvedPart = {
  craft_design_measurement_label_id: string;
  board_id: string;
  quantity: number;
  /** This part's board area, for ONE unit of it, in square shuta. */
  unit_area_shuta2: number;
};

/**
 * Step 2a: works out which board a part actually uses.
 *
 * A part can explicitly pick its own color/thickness (an "override"). If it doesn't, it
 * falls back to whichever catalog row is currently marked as the default color/thickness.
 * Either way, the final answer is: find the one `boards` row with that exact
 * color+thickness combination.
 */
function findBoardForPart(
  part: Pick<PartForCalculation, "color_id" | "thickness_id">,
  boards: BoardForCalculation[],
  defaultColorId: string | undefined,
  defaultThicknessId: string | undefined
): BoardForCalculation | undefined {
  const colorId = part.color_id ?? defaultColorId;
  const thicknessId = part.thickness_id ?? defaultThicknessId;
  return boards.find((board) => board.color_id === colorId && board.thickness_id === thicknessId);
}

/**
 * Step 2b: works out one part's area, for a single unit of it.
 *
 * Area is just "multiply the dimensions together" (e.g. Length x Depth). Only the
 * dimensions flagged `counts_toward_area` take part in that multiplication — a label can
 * have 3+ dimensions recorded (for reference), but only 2 of them describe a flat sheet
 * area, so only those 2 should be multiplied.
 *
 * Returns null when there's nothing to multiply (no dimension is flagged yet) — this
 * happens for a split second right after a part is added, before its measurements have
 * been entered and flagged. Returning null (instead of 0, or crashing) lets the caller
 * simply skip this part rather than showing a broken cost line for a design that's still
 * being measured.
 */
function computeUnitArea(dimensions: PartDimension[]): number | null {
  const countedDimensions = dimensions.filter((dimension) => dimension.counts_toward_area);
  if (countedDimensions.length === 0) return null;

  // Multiply every counted dimension together, converting each to shuta first so the
  // result is in square shuta throughout.
  return countedDimensions.reduce((area, dimension) => area * toTotalShuta(dimension), 1);
}

/**
 * Resolves one design part: finds its board (step 2a) and its per-unit area (step 2b).
 * Returns null — meaning "skip this part" — when either step comes up empty, exactly like
 * the SQL views this replaced: a part with no matching board, or nothing yet measured,
 * contributes nothing to the cost rather than producing broken numbers.
 */
export function resolvePart(
  part: PartForCalculation,
  boards: BoardForCalculation[],
  defaultColorId: string | undefined,
  defaultThicknessId: string | undefined
): ResolvedPart | null {
  const board = findBoardForPart(part, boards, defaultColorId, defaultThicknessId);
  if (!board) return null;

  const unitArea = computeUnitArea(part.dimensions);
  if (unitArea === null) return null;

  return {
    craft_design_measurement_label_id: part.craft_design_measurement_label_id,
    board_id: board.id,
    quantity: part.quantity,
    unit_area_shuta2: unitArea,
  };
}

// ---------------------------------------------------------------------------
// Step 3: pooling parts by board, and turning area into sheets + cost
// ---------------------------------------------------------------------------

export type BoardCostLine = {
  crafts_design_id: string;
  board_id: string;
  /** Total area needed for this board across the whole design, in square shuta. */
  total_area_shuta2: number;
  sheets_needed: number;
  board_cost: number;
};

/**
 * Step 3a: adds up every resolved part's area, grouped by which board it uses.
 *
 * This is the "pooling" step: two parts that each need a bit of the same board are summed
 * together *before* anyone rounds up to a whole sheet — that way they can share the
 * leftover space on one sheet instead of each independently rounding up to their own sheet.
 *
 * Returns a Map from board id -> total area for ONE unit of the design (the design's own
 * `quantity`, e.g. "building 4 of these", is applied later in step 3c — see the note there
 * on why that order matters).
 */
function sumUnitAreaByBoard(resolvedParts: ResolvedPart[]): Map<string, number> {
  const unitAreaByBoard = new Map<string, number>();
  for (const part of resolvedParts) {
    const areaSoFar = unitAreaByBoard.get(part.board_id) ?? 0;
    // A part's own quantity (e.g. "Side" needs 2, left + right) multiplies in here.
    unitAreaByBoard.set(part.board_id, areaSoFar + part.unit_area_shuta2 * part.quantity);
  }
  return unitAreaByBoard;
}

/** Step 3b: the area of one full sheet of a given board, in square shuta (length x width). */
function computeSheetArea(board: BoardForCalculation): number {
  const length = toTotalShuta({ value_inches: board.sheet_length_inches, value_shuta: board.sheet_length_shuta });
  const width = toTotalShuta({ value_inches: board.sheet_width_inches, value_shuta: board.sheet_width_shuta });
  return length * width;
}

/**
 * Step 3c: turns a total area into a whole number of sheets to buy.
 *
 * Two adjustments happen before rounding up:
 *   - `wastagePercent` adds a safety margin for cutting waste (e.g. 10% means "buy 10% more
 *     material than the exact math says").
 *   - The design's own `quantity` (how many complete units of the whole piece are being
 *     built) is applied here too, BEFORE the rounding — building 4 units' worth of area and
 *     rounding up once uses sheets far more efficiently than rounding up for 1 unit and then
 *     multiplying the sheet count by 4.
 *
 * You can never need a fractional sheet, so the result is always rounded UP.
 */
function computeSheetsNeeded(unitTotalArea: number, designQuantity: number, wastagePercent: number, sheetArea: number): {
  totalArea: number;
  sheetsNeeded: number;
} {
  const totalArea = unitTotalArea * designQuantity;
  const areaWithWastage = totalArea * (1 + wastagePercent / 100);
  const sheetsNeeded = Math.ceil(areaWithWastage / sheetArea);
  return { totalArea, sheetsNeeded };
}

/**
 * Builds one cost line per board used by this design: pools every part on that board
 * (step 3a), then converts the pooled area into a sheet count and a cost (steps 3b/3c).
 *
 * Throws if a board's own sheet dimensions haven't been set up (0 area) — dividing by zero
 * there can't produce a meaningful sheet count, so it's better to fail loudly with a clear
 * message than to silently show `Infinity` sheets.
 */
export function computeBoardCosts(
  craftsDesignId: string,
  resolvedParts: ResolvedPart[],
  boards: BoardForCalculation[],
  designQuantity: number
): BoardCostLine[] {
  const boardById = new Map(boards.map((board) => [board.id, board]));
  const unitAreaByBoard = sumUnitAreaByBoard(resolvedParts);

  const lines: BoardCostLine[] = [];
  for (const [boardId, unitTotalArea] of unitAreaByBoard) {
    const board = boardById.get(boardId);
    if (!board) continue; // Shouldn't happen — resolvePart only returns board ids from `boards`.

    const sheetArea = computeSheetArea(board);
    if (!(sheetArea > 0)) {
      throw new Error(
        `Board ${boardId} has no sheet size configured — set its sheet length/width before using it in a design.`
      );
    }

    const { totalArea, sheetsNeeded } = computeSheetsNeeded(unitTotalArea, designQuantity, board.wastage_percent, sheetArea);

    lines.push({
      crafts_design_id: craftsDesignId,
      board_id: boardId,
      total_area_shuta2: totalArea,
      sheets_needed: sheetsNeeded,
      board_cost: sheetsNeeded * board.price_per_sheet,
    });
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Step 4: materials (hardware) — no board-packing math, just a straight sum
// ---------------------------------------------------------------------------

export type MaterialLine = { quantity: number; unit_price: number };

/** The cost of one material line: how many units used, times the catalog's unit price. */
function computeMaterialLineCost(material: MaterialLine): number {
  return material.quantity * material.unit_price;
}

/**
 * Total material cost for the whole design: sum every material line, then scale by the
 * design's own `quantity` — same "how many complete units are being built" figure used in
 * the board calculation above.
 */
export function computeMaterialCost(materials: MaterialLine[], designQuantity: number): number {
  const totalForOneUnit = materials.reduce((sum, material) => sum + computeMaterialLineCost(material), 0);
  return totalForOneUnit * designQuantity;
}

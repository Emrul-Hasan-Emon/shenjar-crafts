/**
 * Unit tests for the Craft Design cost calculation (`./calculation.ts`).
 *
 * These are pure-function tests — no Supabase, no network, no test database. Run them with:
 *
 *   npm test
 *
 * Kept here as a living regression suite: if a future change to the board-packing math,
 * wastage handling, or default/override resolution breaks one of these, it should fail here
 * before it ever reaches the admin UI. The "documented demo walkthrough" test at the bottom
 * specifically guards docs/craft-design.md section 7 — if that test ever needs to change,
 * the docs' worked example needs updating to match.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  toTotalShuta,
  resolvePart,
  computeBoardCosts,
  computeMaterialCost,
  type BoardForCalculation,
  type PartForCalculation,
} from "./calculation";

// ---------------------------------------------------------------------------
// Test fixtures — small helpers to build valid inputs without repeating boilerplate
// ---------------------------------------------------------------------------

function makeBoard(overrides: Partial<BoardForCalculation> = {}): BoardForCalculation {
  return {
    id: "board-1",
    color_id: "walnut",
    thickness_id: "18mm",
    sheet_length_inches: 100,
    sheet_length_shuta: 0,
    sheet_width_inches: 80,
    sheet_width_shuta: 0,
    price_per_sheet: 5000,
    wastage_percent: 10,
    ...overrides,
  };
}

/** A part with exactly 2 dimensions (both counting toward area) — the common case. */
function makePart(overrides: Partial<PartForCalculation> = {}): PartForCalculation {
  return {
    craft_design_measurement_label_id: "part-1",
    quantity: 1,
    color_id: null,
    thickness_id: null,
    dimensions: [
      { value_inches: 20, value_shuta: 0, counts_toward_area: true },
      { value_inches: 12, value_shuta: 0, counts_toward_area: true },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// toTotalShuta — the inches+shuta -> single-number conversion
// ---------------------------------------------------------------------------

describe("toTotalShuta", () => {
  test("converts inches and shuta into one total-shuta number (1 inch = 8 shuta)", () => {
    assert.equal(toTotalShuta({ value_inches: 2, value_shuta: 3 }), 19);
  });

  test("handles zero shuta", () => {
    assert.equal(toTotalShuta({ value_inches: 5, value_shuta: 0 }), 40);
  });

  test("handles zero inches", () => {
    assert.equal(toTotalShuta({ value_inches: 0, value_shuta: 5 }), 5);
  });

  test("1.5 inches worth of shuta equals 12 (since 8 shuta = 1 inch)", () => {
    assert.equal(toTotalShuta({ value_inches: 1, value_shuta: 4 }), 12);
  });
});

// ---------------------------------------------------------------------------
// resolvePart — matching a part to its board, and computing its per-unit area
// ---------------------------------------------------------------------------

describe("resolvePart", () => {
  test("falls back to the default color/thickness when the part has no override", () => {
    const board = makeBoard();
    const part = makePart({ color_id: null, thickness_id: null });
    const resolved = resolvePart(part, [board], "walnut", "18mm");
    assert.ok(resolved);
    assert.equal(resolved!.board_id, "board-1");
  });

  test("uses the part's own override instead of the default when one is set", () => {
    const defaultBoard = makeBoard({ id: "default-board", color_id: "walnut", thickness_id: "18mm" });
    const overrideBoard = makeBoard({ id: "override-board", color_id: "oak", thickness_id: "12mm" });
    const part = makePart({ color_id: "oak", thickness_id: "12mm" });
    const resolved = resolvePart(part, [defaultBoard, overrideBoard], "walnut", "18mm");
    assert.equal(resolved!.board_id, "override-board");
  });

  test("an overridden part still resolves even when NO catalog default exists at all", () => {
    // Regression test: the old SQL view did an unconditional inner join to "whichever
    // catalog row is is_default", so if zero colors/thicknesses were marked default, EVERY
    // part disappeared from the cost breakdown — even ones with an explicit override that
    // never needed a default in the first place. The TS version should only need the
    // default when a part actually lacks its own override.
    const board = makeBoard({ color_id: "oak", thickness_id: "12mm" });
    const part = makePart({ color_id: "oak", thickness_id: "12mm" });
    const resolved = resolvePart(part, [board], undefined, undefined);
    assert.ok(resolved, "an overridden part should resolve even with no catalog default");
  });

  test("returns null (drops the part) when no board matches its color/thickness", () => {
    const board = makeBoard({ color_id: "walnut", thickness_id: "18mm" });
    const part = makePart({ color_id: "oak", thickness_id: "12mm" });
    assert.equal(resolvePart(part, [board], "walnut", "18mm"), null);
  });

  test("returns null when there is no default and the part has no override either", () => {
    const board = makeBoard();
    const part = makePart({ color_id: null, thickness_id: null });
    assert.equal(resolvePart(part, [board], undefined, undefined), null);
  });

  test("returns null when zero dimensions are flagged counts_toward_area (not yet measured)", () => {
    const board = makeBoard();
    const part = makePart({
      dimensions: [
        { value_inches: 1, value_shuta: 0, counts_toward_area: false },
        { value_inches: 1, value_shuta: 0, counts_toward_area: false },
        { value_inches: 1, value_shuta: 0, counts_toward_area: false },
      ],
    });
    assert.equal(resolvePart(part, [board], "walnut", "18mm"), null);
  });

  test("only multiplies the dimensions flagged counts_toward_area, ignoring the rest", () => {
    const board = makeBoard();
    const part = makePart({
      dimensions: [
        { value_inches: 20, value_shuta: 0, counts_toward_area: true }, // 160 shuta
        { value_inches: 12, value_shuta: 0, counts_toward_area: true }, // 96 shuta
        { value_inches: 999, value_shuta: 0, counts_toward_area: false }, // ignored
      ],
    });
    const resolved = resolvePart(part, [board], "walnut", "18mm");
    assert.equal(resolved!.unit_area_shuta2, 160 * 96);
  });

  test("computes the per-unit area as a product of the counted dimensions, in shuta", () => {
    const board = makeBoard();
    const part = makePart({
      dimensions: [
        { value_inches: 2, value_shuta: 3, counts_toward_area: true }, // 19 shuta
        { value_inches: 1, value_shuta: 0, counts_toward_area: true }, // 8 shuta
      ],
    });
    const resolved = resolvePart(part, [board], "walnut", "18mm");
    assert.equal(resolved!.unit_area_shuta2, 19 * 8);
  });
});

// ---------------------------------------------------------------------------
// computeBoardCosts — pooling by board, sheet rounding, wastage, design quantity
// ---------------------------------------------------------------------------

describe("computeBoardCosts", () => {
  test("pools two parts sharing a board before rounding up to a whole sheet", () => {
    // Each part alone would round up to its own sheet; pooled, they share one.
    const board = makeBoard({ wastage_percent: 0, price_per_sheet: 5000 });
    const side = resolvePart(makePart({ craft_design_measurement_label_id: "side" }), [board], "walnut", "18mm")!;
    const top = resolvePart(makePart({ craft_design_measurement_label_id: "top" }), [board], "walnut", "18mm")!;

    const lines = computeBoardCosts("design-1", [side, top], [board], 1);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].sheets_needed, 1);
    assert.equal(lines[0].board_cost, 5000);
  });

  test("applies wastage_percent and the design's own quantity before rounding up", () => {
    // Two parts of 50in x 80in (4000 in^2 each) on a 100in x 80in (8000 in^2) sheet = exactly
    // 1 sheet's worth combined, with 0 wastage and quantity 1. With 10% wastage and a design
    // quantity of 2: (8000*2)*1.10 = 17600, / 8000 = 2.2 -> ceil = 3 sheets.
    const board = makeBoard({ wastage_percent: 10, price_per_sheet: 1000 });
    const dims = (a: number, b: number) => [
      { value_inches: a, value_shuta: 0, counts_toward_area: true },
      { value_inches: b, value_shuta: 0, counts_toward_area: true },
    ];
    const p1 = resolvePart(makePart({ craft_design_measurement_label_id: "p1", dimensions: dims(50, 80) }), [board], "walnut", "18mm")!;
    const p2 = resolvePart(makePart({ craft_design_measurement_label_id: "p2", dimensions: dims(50, 80) }), [board], "walnut", "18mm")!;

    const lines = computeBoardCosts("design-2", [p1, p2], [board], 2);
    assert.equal(lines[0].sheets_needed, 3);
    assert.equal(lines[0].board_cost, 3000);
  });

  test("a part's own quantity (e.g. Side needs 2: left + right) multiplies into the pooled area", () => {
    const board = makeBoard({ wastage_percent: 0 });
    const part = resolvePart(makePart({ quantity: 2 }), [board], "walnut", "18mm")!;
    const lines = computeBoardCosts("design-3", [part], [board], 1);
    // unit area = 160 * 96 = 15360; part quantity 2 -> 30720 total, well under one 800*640=512000 sheet.
    assert.equal(lines[0].total_area_shuta2, 15360 * 2);
    assert.equal(lines[0].sheets_needed, 1);
  });

  test("keeps separate boards in separate cost lines (no cross-pooling)", () => {
    const boardA = makeBoard({ id: "board-a", color_id: "walnut", thickness_id: "18mm" });
    const boardB = makeBoard({ id: "board-b", color_id: "oak", thickness_id: "12mm" });
    const partA = resolvePart(makePart({ color_id: "walnut", thickness_id: "18mm" }), [boardA, boardB], "walnut", "18mm")!;
    const partB = resolvePart(makePart({ color_id: "oak", thickness_id: "12mm" }), [boardA, boardB], "walnut", "18mm")!;

    const lines = computeBoardCosts("design-4", [partA, partB], [boardA, boardB], 1);
    assert.equal(lines.length, 2);
    assert.deepEqual(
      lines.map((l) => l.board_id).sort(),
      ["board-a", "board-b"]
    );
  });

  test("rounds up even when only slightly over a whole number of sheets", () => {
    const board = makeBoard({ wastage_percent: 0, price_per_sheet: 100 });
    // Sheet area = 800*640 = 512000. Ask for exactly one sheet's worth plus 1 extra shuta^2.
    const part: PartForCalculation = {
      craft_design_measurement_label_id: "p",
      quantity: 1,
      color_id: null,
      thickness_id: null,
      dimensions: [
        { value_inches: 0, value_shuta: 512001, counts_toward_area: true },
        { value_inches: 0, value_shuta: 1, counts_toward_area: true },
      ],
    };
    const resolved = resolvePart(part, [board], "walnut", "18mm")!;
    const lines = computeBoardCosts("design-5", [resolved], [board], 1);
    assert.equal(lines[0].sheets_needed, 2, "512001 shuta^2 needed on a 512000 sheet must round up to 2");
  });

  test("throws a clear error instead of dividing by zero when a board has no sheet size set", () => {
    const board = makeBoard({ sheet_length_inches: 0, sheet_length_shuta: 0 });
    const part = resolvePart(makePart(), [board], "walnut", "18mm")!;
    assert.throws(() => computeBoardCosts("design-6", [part], [board], 1), /no sheet size configured/);
  });

  test("returns no lines when there are no resolved parts", () => {
    const board = makeBoard();
    assert.deepEqual(computeBoardCosts("design-7", [], [board], 1), []);
  });
});

// ---------------------------------------------------------------------------
// computeMaterialCost — flat quantity x unit_price, scaled by design quantity
// ---------------------------------------------------------------------------

describe("computeMaterialCost", () => {
  test("sums multiple material lines and scales by the design's own quantity", () => {
    const total = computeMaterialCost(
      [
        { quantity: 40, unit_price: 2 },
        { quantity: 5, unit_price: 10 },
      ],
      2
    );
    // (40*2 + 5*10) * 2 = (80 + 50) * 2 = 260
    assert.equal(total, 260);
  });

  test("returns 0 for an empty material list", () => {
    assert.equal(computeMaterialCost([], 3), 0);
  });
});

// ---------------------------------------------------------------------------
// End-to-end regression test: the exact worked example documented in
// docs/craft-design.md, section 7 ("Demo walkthrough"). If this ever fails, the
// documentation's numbers need to be updated to match, not just this test.
// ---------------------------------------------------------------------------

describe("docs/craft-design.md section 7 demo walkthrough", () => {
  test("Wardrobe #1: 2x Side + 1x Top pooled on one board, plus screws, quantity 2", () => {
    const board = makeBoard({
      id: "board-1",
      color_id: "walnut",
      thickness_id: "18mm",
      sheet_length_inches: 100,
      sheet_width_inches: 80,
      price_per_sheet: 5000,
      wastage_percent: 10,
    });

    const side: PartForCalculation = {
      craft_design_measurement_label_id: "side",
      quantity: 2,
      color_id: null,
      thickness_id: null,
      dimensions: [
        { value_inches: 20, value_shuta: 0, counts_toward_area: true },
        { value_inches: 12, value_shuta: 0, counts_toward_area: true },
      ],
    };
    const top: PartForCalculation = {
      craft_design_measurement_label_id: "top",
      quantity: 1,
      color_id: null,
      thickness_id: null,
      dimensions: [
        { value_inches: 20, value_shuta: 0, counts_toward_area: true },
        { value_inches: 12, value_shuta: 0, counts_toward_area: true },
      ],
    };

    const resolvedSide = resolvePart(side, [board], "walnut", "18mm")!;
    const resolvedTop = resolvePart(top, [board], "walnut", "18mm")!;
    assert.equal(resolvedSide.unit_area_shuta2, 15360);
    assert.equal(resolvedTop.unit_area_shuta2, 15360);

    const designQuantity = 2;
    const lines = computeBoardCosts("wardrobe-1", [resolvedSide, resolvedTop], [board], designQuantity);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].total_area_shuta2, 92160);
    assert.equal(lines[0].sheets_needed, 1);
    assert.equal(lines[0].board_cost, 5000);

    const materialCost = computeMaterialCost([{ quantity: 40, unit_price: 2 }], designQuantity);
    assert.equal(materialCost, 160);

    const boardCost = lines.reduce((sum, line) => sum + line.board_cost, 0);
    assert.equal(boardCost + materialCost, 5160);
  });
});

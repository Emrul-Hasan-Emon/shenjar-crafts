/**
 * End-to-end integration test for Craft Design: exercises the real server functions
 * (server/craft-design/**, server/boards/**, server/materials/**) against a real Supabase
 * project, reproducing the exact "Wardrobe #1" scenario documented in
 * docs/craft-design.md §7 (Demo walkthrough) and asserting the returned numbers match —
 * this is what the pure unit tests in calculation.test.ts can't cover: the real Supabase
 * query shapes, joins, and the list page's embedded-count query.
 *
 * Run locally (never in CI/Vercel): npx tsx server/scripts/smoke-test-craft-design.ts
 * Only ever runs against the "development" Supabase project — refuses to run at all if
 * NODE_ENV=production (see README.md, "Two Supabase environments").
 *
 * Catalog rows this script creates (color/thickness/board/material/labels) are all named
 * with a "Smoke Test" prefix and found-or-created, so re-running the script never piles up
 * duplicates. The design itself IS re-created fresh each run (any previous smoke-test design
 * is deleted first) but the final one is left in the database on purpose, so it's visible at
 * /admin/craft-designs afterwards — same philosophy as smoke-test-partners.ts.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "../supabase/env";
import { loadSupabaseEnv, assertNotProduction } from "./loadSupabaseEnv";
import { createBoardColor } from "../boards/colors";
import { createBoardThickness } from "../boards/thicknesses";
import { createBoard, listBoards } from "../boards/boards";
import { createMaterial } from "../materials/materials";
import { createMeasurementLabel } from "../craft-design/measurement-labels/measurementLabels";
import { createMeasurementLabelDimension } from "../craft-design/measurement-labels/measurementLabelDimensions";
import { createCraftsDesign, deleteCraftsDesign, listCraftsDesigns } from "../craft-design/designs/craftsDesigns";
import { addCraftDesignPart, updateCraftDesignPartOverrides, updateCraftDesignPartDimensions } from "../craft-design/designs/craftDesignMeasurementLabel";
import { addCraftDesignMaterial } from "../craft-design/designs/craftDesignMaterials";
import { getCraftDesignCostBreakdown } from "../craft-design/designs/costBreakdown";

loadSupabaseEnv();
assertNotProduction("smoke-test-craft-design.ts");

const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

const MARKER = "Smoke Test";

let passed = 0;
let failed = 0;
function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`, detail ?? "");
  }
}

// ---------------------------------------------------------------------------
// Find-or-create helpers for catalog rows, so re-running never creates duplicates.
// ---------------------------------------------------------------------------

async function findOrCreateBoardColor(supabase: SupabaseClient, nameEn: string) {
  const { data: existing } = await supabase.from("board_colors").select("*").eq("name_en", nameEn).maybeSingle();
  if (existing) return existing;
  return createBoardColor(supabase, { name_en: nameEn });
}

async function findOrCreateBoardThickness(supabase: SupabaseClient, valueMm: number) {
  const { data: existing } = await supabase.from("board_thicknesses").select("*").eq("value_mm", valueMm).maybeSingle();
  if (existing) return existing;
  return createBoardThickness(supabase, { value_mm: valueMm });
}

async function findOrCreateMaterial(supabase: SupabaseClient, nameEn: string, unitPrice: number) {
  const { data: existing } = await supabase.from("materials").select("*").eq("name_en", nameEn).maybeSingle();
  if (existing) return existing;
  return createMaterial(supabase, { name_en: nameEn, unit: "piece", unit_price: unitPrice });
}

async function findOrCreateMeasurementLabel(
  supabase: SupabaseClient,
  nameEn: string,
  dimensionLabels: [string, string]
) {
  const { data: existing } = await supabase.from("measurement_label").select("*").eq("name_en", nameEn).maybeSingle();
  const label = existing ?? (await createMeasurementLabel(supabase, { name_en: nameEn, default_quantity: 1 }));

  for (const dimensionLabel of dimensionLabels) {
    const { data: existingDimension } = await supabase
      .from("measurement_label_dimensions")
      .select("id")
      .eq("measurement_label_id", label.id)
      .eq("label_en", dimensionLabel)
      .maybeSingle();
    if (!existingDimension) {
      await createMeasurementLabelDimension(supabase, { measurement_label_id: label.id, label_en: dimensionLabel });
    }
  }
  return label;
}

async function main() {
  console.log("Setting up catalog fixtures (found-or-created, safe to re-run)...\n");

  const color = await findOrCreateBoardColor(supabase, `${MARKER} Walnut`);
  const thickness = await findOrCreateBoardThickness(supabase, 18);

  const existingBoards = await listBoards(supabase);
  const board =
    existingBoards.find((b) => b.color_id === color.id && b.thickness_id === thickness.id) ??
    (await createBoard(supabase, {
      color_id: color.id,
      thickness_id: thickness.id,
      sheet_length_inches: 100,
      sheet_length_shuta: 0,
      sheet_width_inches: 80,
      sheet_width_shuta: 0,
      price_per_sheet: 5000,
      wastage_percent: 10,
    }));

  const material = await findOrCreateMaterial(supabase, `${MARKER} Screw`, 2);
  const sideLabel = await findOrCreateMeasurementLabel(supabase, `${MARKER} Side`, ["Depth", "Length"]);
  const topLabel = await findOrCreateMeasurementLabel(supabase, `${MARKER} Top`, ["Width", "Depth"]);

  console.log("Fixtures ready:", {
    color: color.name_en,
    thickness_mm: thickness.value_mm,
    board_id: board.id,
    material: material.name_en,
    sideLabel: sideLabel.name_en,
    topLabel: topLabel.name_en,
  });

  // Clean up any design left over from a previous run, so re-running this script doesn't
  // accumulate duplicate "Wardrobe" designs in the admin panel's list.
  const existingDesigns = await listCraftsDesigns(supabase);
  for (const design of existingDesigns) {
    if (design.name_en.startsWith(`${MARKER} Wardrobe`)) {
      await deleteCraftsDesign(supabase, design.id);
    }
  }

  console.log(`\nCreating "${MARKER} Wardrobe #1", quantity 2 — the docs' worked example...`);
  const design = await createCraftsDesign(supabase, {
    name_en: `${MARKER} Wardrobe #1`,
    quantity: 2,
  });

  // Side: quantity 2 (left + right), explicit override to the test board (not relying on
  // whatever the dev project's current catalog default happens to be — keeps this test
  // deterministic regardless of other data in the project).
  const sidePart = await addCraftDesignPart(supabase, design.id, sideLabel.id);
  await updateCraftDesignPartOverrides(supabase, sidePart.id, {
    color_id: color.id,
    thickness_id: thickness.id,
    quantity: 2,
  });
  await updateCraftDesignPartDimensions(
    supabase,
    sidePart.dimensions.map((d) => ({
      id: d.id,
      value_inches: d.measurement_label_dimensions.label_en === "Depth" ? 20 : 12,
      value_shuta: 0,
      counts_toward_area: true,
    }))
  );

  // Top: quantity 1.
  const topPart = await addCraftDesignPart(supabase, design.id, topLabel.id);
  await updateCraftDesignPartOverrides(supabase, topPart.id, {
    color_id: color.id,
    thickness_id: thickness.id,
    quantity: 1,
  });
  await updateCraftDesignPartDimensions(
    supabase,
    topPart.dimensions.map((d) => ({
      id: d.id,
      value_inches: d.measurement_label_dimensions.label_en === "Width" ? 20 : 12,
      value_shuta: 0,
      counts_toward_area: true,
    }))
  );

  await addCraftDesignMaterial(supabase, design.id, material.id, 40);

  console.log("\nReading the cost breakdown through the real getCraftDesignCostBreakdown()...");
  const breakdown = await getCraftDesignCostBreakdown(supabase, design.id);
  console.log(breakdown);

  console.log("\nChecks against docs/craft-design.md §7's worked example:");
  check("exactly one board line (Side + Top pooled onto one board)", breakdown.boardLines.length === 1, breakdown.boardLines.length);
  check("sheets_needed = 1", breakdown.boardLines[0]?.sheets_needed === 1, breakdown.boardLines[0]?.sheets_needed);
  check("board_cost = 5000", breakdown.boardLines[0]?.board_cost === 5000, breakdown.boardLines[0]?.board_cost);
  check(
    "the board line's display join resolved the right color",
    breakdown.boardLines[0]?.board.color.name_en === `${MARKER} Walnut`,
    breakdown.boardLines[0]?.board.color.name_en
  );
  check("materialCost = 160", breakdown.materialCost === 160, breakdown.materialCost);
  check("grandTotal = 5160", breakdown.grandTotal === 5160, breakdown.grandTotal);

  console.log("\nChecking the list page's part/material count query (listCraftsDesigns)...");
  const designs = await listCraftsDesigns(supabase);
  const listed = designs.find((d) => d.id === design.id);
  check("design appears in listCraftsDesigns", !!listed);
  check("partCount = 2", listed?.partCount === 2, listed?.partCount);
  check("materialCount = 1", listed?.materialCount === 1, listed?.materialCount);

  console.log(`\n${passed} passed, ${failed} failed.`);
  console.log(`\nLeft "${design.name_en}" (${design.id}) in the database — visible at /admin/craft-designs/${design.id}.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

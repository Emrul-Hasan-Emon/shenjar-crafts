# Craft Design — Test Plan

Three layers of tests cover this module. Keep all three up to date as the module changes.

1. **Automated unit tests** — `server/craft-design/designs/calculation.test.ts`, run with `npm test`. Pure-function
   tests of the calculation logic (`calculation.ts`) — no database needed, safe to run anywhere, anytime.
2. **Automated integration test** — `server/scripts/smoke-test-craft-design.ts`, run with `npm run test:craft-design`.
   Exercises the real server functions (`server/craft-design/**`, `server/boards/**`, `server/materials/**`)
   against the real **development** Supabase project (see README.md, "Two Supabase environments") —
   reproduces the docs' Wardrobe #1 example end-to-end (catalog creation → design → parts → materials →
   `getCraftDesignCostBreakdown`) and checks the returned numbers, plus the list page's part/material count
   query. This is what the pure unit tests can't cover: real Supabase query shapes, joins, and RLS/service-role
   interaction. Refuses to run at all if resolved to the production environment.
3. **Manual QA checklist** — below. Exercises the real admin UI itself (clicking through Create, List, Detail,
   Invoice) against a real Supabase project. Needs a working `.env.development.local` and an authenticated
   admin session, so it can't be automated from a sandboxed session with no database access — run it by hand
   after any change that touches the Craft Design UI.

---

## 1. Automated unit tests (`npm test`)

Run:

```bash
npm test
```

All 22 cases should pass. What's covered, by suite:

| Suite | What it checks |
|---|---|
| `toTotalShuta` | The inches+shuta → single-number conversion (`value_inches * 8 + value_shuta`), including zero-inch and zero-shuta edge cases. |
| `resolvePart` | Default vs. per-part override resolution; **an overridden part still resolves even when no catalog default exists at all** (a real fix — the old SQL view broke *every* part, override or not, whenever no default color/thickness was set); dropping a part with no matching board; dropping a part with zero `counts_toward_area` dimensions (freshly added, not yet measured); only multiplying the *counted* dimensions, ignoring extras. |
| `computeBoardCosts` | Pooling two parts sharing a board before rounding to a whole sheet; wastage % and design quantity applied before `ceil()`, not after; a part's own quantity multiplying into pooled area; two different boards staying in separate cost lines (no cross-pooling); rounding up even 1 shuta² over a sheet boundary; throwing a clear error instead of `Infinity` when a board has no sheet size configured; an empty input producing no lines. |
| `computeMaterialCost` | Summing multiple material lines and scaling by design quantity; empty list → 0. |
| Docs demo walkthrough | Reproduces the exact worked example in `docs/craft-design.md` §7 (Wardrobe #1: 2× Side + 1× Top, quantity 2, +screws) and asserts the documented numbers (`15360`, `92160`, `5000`, `160`, `5160`). **If this test ever needs to change, update the doc's numbers to match.** |

When adding a new calculation rule (a new wastage model, a different rounding rule, etc.), add a case here
first — these tests double as the executable spec for `calculation.ts`.

---

## 2. Automated integration test (`npm run test:craft-design`)

Run:

```bash
npm run test:craft-design
```

Requires `.env.development.local` filled in with real development-project keys (see README.md, "Two
Supabase environments"). What it does, end to end, against the real database:

1. Finds-or-creates catalog fixtures (a "Smoke Test Walnut" color, an 18mm thickness, a matching board sized
   100in × 80in @ ৳5,000/sheet with 10% wastage, a "Smoke Test Screw" material, and "Smoke Test Side"/"Smoke
   Test Top" measurement labels with their dimensions) — safe to re-run, never creates duplicates.
2. Deletes any Craft Design left over from a previous run, then creates a fresh "Smoke Test Wardrobe #1"
   (quantity 2) — the exact scenario in `docs/craft-design.md` §7.
3. Adds the Side (quantity 2, 20in×12in) and Top (quantity 1, 20in×12in) parts with an explicit board
   override, and a 40-unit material line, using the real `addCraftDesignPart` / `updateCraftDesignPartOverrides`
   / `updateCraftDesignPartDimensions` / `addCraftDesignMaterial` functions.
4. Calls the real `getCraftDesignCostBreakdown` and asserts: one pooled board line, `sheets_needed = 1`,
   `board_cost = 5000`, `materialCost = 160`, `grandTotal = 5160` — and that the board line's color/thickness
   display join resolved correctly.
5. Calls the real `listCraftsDesigns` and asserts the new part/material count embed returns `partCount = 2`,
   `materialCount = 1` for the design just created.
6. Leaves the created design in the database on purpose (visible at `/admin/craft-designs/<id>` afterward),
   same philosophy as `smoke-test-partners.ts`.

Refuses to run at all if `NODE_ENV=production` (see `server/scripts/loadSupabaseEnv.ts`) — it can only ever
target the development project.

## 3. Manual QA checklist (needs a live Supabase project + admin login)

Prerequisites: `.env.development.local` with real `DEV_SUPABASE_URL`/`DEV_SUPABASE_ANON_KEY`, `npm run dev`,
logged in at `/admin/login`. At least one `board_colors` row and one `board_thicknesses` row marked
`is_default`, one `boards` row for that combination, at least one `measurement_label` with 2 dimensions, and
at least one `materials` row — or create them as part of TC-1 (or just run `npm run test:craft-design` first,
which creates a usable set of fixtures for you).

### TC-1 — Catalogs are usable

1. `/admin/measurement-labels` → create a label (e.g. "Side") with `default_quantity = 2`, then open it and
   add two dimensions (e.g. "Depth", "Length").
2. `/admin/materials` → create a material (e.g. "Screw", `unit_price = 2`).
3. `/admin/boards` → confirm a color and thickness are marked default, and a board exists for that pair with
   non-zero sheet dimensions and a `price_per_sheet`.

**Expected:** all three catalog screens show the new rows immediately after creating them (no missing
fields, no console errors).

### TC-2 — Create form: pick parts/materials before saving

1. `/admin/craft-designs` → fill in Name + Quantity.
2. Under "Measurement Labels", pick the "Side" label created in TC-1 → click Add → it appears as a
   removable chip.
3. Under "Materials", pick "Screw", set quantity to `40` → click Add → it appears in the pending list.
4. Click "Create design".

**Expected:**
- You land on `/admin/craft-designs/<new id>` immediately (not back on the list).
- The "Measurements" section already shows a "Side" part card (with blank dimension inputs) — you did
  **not** have to re-add it.
- The "Materials" section already shows "Screw × 40" — you did **not** have to re-add it.

### TC-3 — List page shows part/material counts

1. Go back to `/admin/craft-designs`.

**Expected:** the card for the design just created shows **"1 part · 1 material"** (or the correct counts
for whatever was picked in TC-2), without opening the design.

### TC-4 — Entering measurements updates the cost live

1. Open the design from TC-2. On the "Side" part card, enter Depth = `20` in, `0` sh and Length = `12` in,
   `0` sh.
2. Click "Save part".

**Expected:** `CostBreakdownPanel` updates immediately (no separate "calculate" step) to show 1 board line,
sheets needed ≥ 1, and a board cost matching `sheets_needed × price_per_sheet` for the board in use.

### TC-5 — Pooling: two parts sharing a board

1. Add a second part (e.g. "Top", if you created a matching label) with the same or a different board
   override, using small enough dimensions that both parts together still fit on one sheet.

**Expected:** exactly **one** board cost line covering both parts (not two separate lines each rounded up to
1 sheet) — confirms pooling is working, not just per-part rounding.

### TC-6 — Per-part board override

1. On a part, set Color/Thickness to something other than "Use default" (requires a second `boards` row for
   that combination).
2. Save.

**Expected:** a second board cost line appears for that specific board, separate from the default-board
line; the overridden part's area is no longer pooled with parts on the default board.

### TC-7 — Design quantity scales the sheet count correctly

1. Edit the design's own Quantity field (top of the detail page) from 1 to a larger number (e.g. 4).

**Expected:** `sheets_needed` increases in a way consistent with `ceil(total_area_for_1_unit × quantity × (1
+ wastage%) / sheet_area)` — i.e., rounding happens **once**, against the scaled-up total, not once per
unit. (Cross-check against `npm test`'s `computeBoardCosts` suite if the number looks surprising.)

### TC-8 — Materials cost

1. Add a second material line, or change the Screw quantity.

**Expected:** `materialCost` in the panel updates to `Σ(quantity × unit_price) × design.quantity`.

### TC-9 — Invoice page matches the detail page

1. Open `/admin/craft-designs/<id>/invoice`.

**Expected:** every measurement, board line (with sheets needed), material line, and the grand total exactly
match what the detail page's `CostBreakdownPanel` showed.

### TC-10 — Edge case: no catalog default set

1. Temporarily unset `is_default` on every `board_colors` row (or every `board_thicknesses` row) — e.g. via
   `/admin/boards`, if that's exposed, or by editing the row directly.
2. Reload a design that has at least one part with an **explicit** color/thickness override, and one part
   that relies on the default.

**Expected:** the overridden part still shows a valid cost line. The part relying on the (now-missing)
default is dropped from the cost breakdown rather than crashing the page (matches the
`resolvePart` unit tests). Restore the default afterward.

### TC-11 — Deleting a design cleans up its parts/materials

1. Delete the test design from `/admin/craft-designs`.

**Expected:** no orphaned rows left behind (cascading deletes on `craft_design_measurement_label` /
`craft_design_materials` — this is enforced by the database schema, not app code, but worth a spot-check).

---

## Known gaps / not covered by any layer

- `npm run test:craft-design` (layer 2) now exercises `costBreakdown.ts`'s real fetch queries and the
  `craftsDesigns.ts` count embed against a real database, so those are no longer unverified — but it only
  covers the one scenario above (default-board resolution via an explicit override, one board, one
  material). It doesn't cover per-part color/thickness overrides sharing a design with default-board parts,
  multiple boards in one design, or the "no catalog default at all" edge case (TC-6, TC-10) — those still
  need the manual checklist.
- Nothing automated clicks through the actual admin UI (React components, forms, live `router.refresh()`
  updates) — TC-1 through TC-11 in section 3 are the only coverage for that.

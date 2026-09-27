# Craft Design Costing Module

## 1. What this module is, in one paragraph

The shop builds custom furniture — cabinets, tables, racks, interior fittings — from flat sheets of board
material (like plywood) cut to size, plus small hardware (hinges, screws, glue). Before this module
existed, "how much will this cost to build?" was answered by manual estimation. Craft Design replaces that
guess with a real calculation: an admin measures every part of the piece, picks which board and materials
each part uses, and the app works out **exactly how many physical board sheets are needed** and **the total
cost** — automatically, from the raw measurements.

It is a completely standalone module. A Craft Design may optionally link to a Project (from the Finance
module) purely so the two show up together in navigation — nothing else connects them. See
[section 9](#9-not-connected-to-finance) for why that separation is deliberate.

---

## 2. The problem, and the plan for solving it

### 2.1 The core problem

Furniture parts are cut from big flat sheets of board. A "Side" panel and a "Top" panel might each only
need half a sheet — if you calculate their sheet requirement separately, you round up twice and waste a
whole sheet's worth of material and money. The right answer is to add up *everything that shares the same
board* first, and only then round up to a whole number of sheets.

That one requirement — "pool before you round" — is the reason this module isn't just a simple
price-per-item calculator. It shapes almost every design decision below.

### 2.2 Planning decisions and why they were made

These are the choices that came out of planning this module, and the reasoning behind each one:

- **A "board" is simply a color + a thickness.** There's no separate "board type" concept — a real,
  priced sheet of material is fully identified by its color and its thickness, so `boards` has a
  `unique(color_id, thickness_id)` constraint and nothing more.
- **Colors and thicknesses are catalogs the admin manages**, not a fixed list in code — because the shop's
  materials change over time. Each catalog has an `is_default` flag (at most one row can be the default at
  a time) so a part can simply *not specify* a color/thickness and automatically use whatever's currently
  the default.
- **A part can override the default, or inherit it.** Most parts in a design use the same board; one
  accent panel might use a different one. Storing the override as nullable columns (`color_id`,
  `thickness_id`, both optional) captures exactly that: null means "use the default," a value means "use
  this specific board instead."
- **The list of part names, and what you measure for each, are catalogs too** — not hardcoded — because
  different furniture pieces need different parts, and different parts need different measurements. A
  "Side" might only need Depth + Length; another part might need three or four different values.
- **Which measured values count toward area is chosen per part, not per catalog entry.** When a part only
  has 2 measurements, both are obviously the ones that make up its area. When it has 3 or more (e.g. one
  extra reference measurement that isn't a flat dimension), the admin picks exactly 2 — enforced by the
  server, not just the UI, so it can never silently drift.
- **The design's own quantity is kept separate from a part's own quantity.** "Build 4 of this whole
  cabinet" and "this cabinet needs 2 Side panels" are two different multipliers, and both matter to the
  final board count — see [section 5](#5-the-calculation-logic-step-by-step) for exactly how they combine.
- **Materials (hardware) are priced completely separately from boards.** Screws and glue don't need
  sheet-packing math — they're just `quantity × unit price` — so they get their own simple table and their
  own simple calculation, with zero shared logic with the board side.

---

## 3. The database schema

Every table below lives in [`server/supabase/schema.sql`](../server/supabase/schema.sql) (the single
source of truth — this section explains it in plain language; see [`schema.md`](./schema.md) for the
complete column-by-column reference across the whole app). All of it is authenticated-admin-only — never
public.

### 3.1 Catalogs — shared across every design

These are managed once, under their own admin screens, and reused by every Craft Design.

| Table | What it holds | Key columns |
|---|---|---|
| `board_colors` | The colors of board material the shop stocks. | `name_en`/`name_bn`, `is_default` (at most one true at a time) |
| `board_thicknesses` | The thicknesses of board material the shop stocks. | `value_mm`, `is_default` (same one-default rule) |
| `boards` | One priced, real sheet of material — a specific color + thickness combination. | `color_id`, `thickness_id` (unique together), `sheet_length_inches`/`sheet_length_shuta`, `sheet_width_inches`/`sheet_width_shuta`, `price_per_sheet`, `wastage_percent` (default 10%) |
| `materials` | Hardware/supplies catalog — screws, hinges, glue, anything priced per unit. | `unit` (default `"piece"`), `unit_price` |
| `measurement_label` | The catalog of part names a design can use — Side, Top, Bottom, Front, Back, and anything added later. | `name_en`/`name_bn`, `default_quantity` |
| `measurement_label_dimensions` | The list of measurement fields one label needs (2 for Depth+Length, 3+ for more complex parts). | `measurement_label_id` (which label this belongs to), `label_en`/`label_bn` |

### 3.2 Per-design data — one design's own parts and materials

| Table | What it holds | Key columns |
|---|---|---|
| `crafts_designs` | One furniture design/order. The root of everything else in this section. | `name_en`/`name_bn`, `quantity` (how many complete units are being built), `finance_record_id` (optional Project link, nullable, never affects cost) |
| `craft_design_measurement_label` | One "part" included in a design — e.g. this design has a Side, a Top, and a Bottom. | `crafts_design_id`, `measurement_label_id`, `color_id`/`thickness_id` (nullable overrides), `quantity` (how many of this part one unit needs) |
| `craft_design_measurement_label_dimensions` | The actual measured value for one dimension field of one part. | `craft_design_measurement_label_id`, `measurement_label_dimension_id`, `value_inches`, `value_shuta`, `counts_toward_area` |
| `craft_design_materials` | One material used by a design, and how many. | `crafts_design_id`, `material_id`, `quantity` |

### 3.3 How the tables connect

```
board_colors ──┐                    measurement_label ──┐
               ├──> boards           (Side, Top, ...)    ├──> measurement_label_dimensions
board_thicknesses ┘                                      ┘     (Depth, Length, ...)

crafts_designs ("Wardrobe #1", quantity 2)
   │
   ├──> craft_design_measurement_label   (one row per part: "this design has a Side")
   │        │                              picks a board via color_id/thickness_id
   │        └──> craft_design_measurement_label_dimensions
   │                 (one row per measured value: "Depth = 20in 4sh, counts toward area")
   │
   └──> craft_design_materials  (one row per material used: "40 screws")
```

Nothing in this whole tree ever writes into `finance_records` (the Finance module's table) — see
[section 9](#9-not-connected-to-finance).

---

## 4. Measurement units: inches + shuta

Every length in this module (a part's measurements, and a board sheet's own dimensions) is stored as two
plain numbers instead of one:

```ts
{ value_inches: number, value_shuta: number }
```

**Shuta** is a traditional Bangladeshi carpentry subdivision, finer than a whole inch — there are exactly
**8 shuta in 1 inch**. The shop's own tape measures actually use this unit, so the app stores it directly
instead of forcing a decimal-inch conversion on every measurement.

Before any calculation happens, a length is converted into one plain number — "total shuta":

```
total_shuta = value_inches × 8 + value_shuta
```

Example: `2 inches, 3 shuta` → `2 × 8 + 3 = 19` total shuta. This conversion (`toTotalShuta` in
`calculation.ts`) is the very first thing that happens to every length figure the calculation touches.

---

## 5. The calculation logic, step by step

### 5.1 Where the code lives, and why it isn't in the database

This calculation used to be three chained Postgres views. It moved into plain TypeScript
(`server/craft-design/designs/calculation.ts`) because of one specific fact: **nothing downstream ever
trusts this number**. A Craft Design's cost is never written into another table and never blocks or
approves anything (unlike, say, an invoice total) — it's just a number shown to the one admin user, who
already has full database access regardless of where the math runs. Since there's no real "the browser
could cheat" risk to defend against here, doing the math in the app instead of the database makes it far
easier to read, change, and test — see `architecture.md` for the general principle this is the one
deliberate exception to.

`calculation.ts` has **no database calls at all** — every function takes plain JavaScript objects and
returns plain JavaScript objects. `costBreakdown.ts` is the only file that talks to Supabase; it fetches the
raw rows and hands them to `calculation.ts`.

### 5.2 The four steps

**Step 1 — Resolve each part to its board** (`resolvePart`, made of two smaller helpers)

For one part (e.g. "Side"): work out which board it uses (`findBoardForPart` — its own color/thickness
override, or whichever catalog row is currently the default), then work out its area *for one unit of it*
(`computeUnitArea` — multiply together every measured value flagged `counts_toward_area`, after converting
each to shuta). If no board matches, or nothing is flagged yet (e.g. the part was just added and hasn't
been measured), the part is skipped rather than producing a broken number.

**Step 2 — Pool every part by board** (`sumUnitAreaByBoard`, inside `computeBoardCosts`)

Every part that resolved to the *same* board has its area added together, because that's the whole point
of this module: two parts that together need less than one sheet should share it, instead of each
independently rounding up to their own sheet.

**Step 3 — Turn pooled area into whole sheets and a cost** (`computeSheetArea` + `computeSheetsNeeded`)

```
sheet_area     = board's own length × width (in shuta²)
total_area     = pooled_area_for_one_unit × design.quantity
area_to_buy    = total_area × (1 + wastage_percent / 100)
sheets_needed  = ceil( area_to_buy / sheet_area )        ← always rounds UP — you can't buy half a sheet
board_cost     = sheets_needed × price_per_sheet
```

The design's own `quantity` (how many complete units are being built) is multiplied in **before** the
rounding-up step. That order matters: rounding up once after scaling to 4 units uses sheets far more
efficiently than rounding up for 1 unit and then multiplying the sheet count by 4.

**Step 4 — Add up materials** (`computeMaterialCost`)

```
material_cost = Σ(material.quantity × material.unit_price) × design.quantity
```

No board-packing math here — just a straight sum, scaled by the same design quantity.

### 5.3 Putting it together

`getCraftDesignCostBreakdown` in `costBreakdown.ts` runs all four steps for one design and returns:

```ts
{ boardLines, materialCost, boardCost, grandTotal }
```

`boardLines` is one entry per board actually used (with sheets-needed and cost); `boardCost` and
`materialCost` are their totals; `grandTotal` is the two added together. This is the one and only place
cost numbers come from — every screen that shows a price reads this return value, never computes its own.

---

## 6. Step-by-step execution flow (what happens when an admin uses the app)

1. **Admin opens `/admin/craft-designs`.** The page loads the list of existing designs (each showing a
   quick "N parts · M materials" summary) plus the Create form.
2. **Admin fills in the Create form** — name, quantity, optionally a Project, and (new) can also pick
   which Measurement Labels and Materials this design will use, right there on the same form.
3. **On submit:** the design row is created first (parts/materials need an existing design id to attach
   to — a database foreign-key requirement), then every picked label becomes a part row and every picked
   material becomes a material-usage row, all attached to that new design.
4. **The admin lands on the design's own detail page** (`/admin/craft-designs/[id]`), where each part now
   needs its actual measurements typed in (a per-dimension task, done here rather than on the Create form).
5. **Every time a measurement, override, or material changes**, the page calls `router.refresh()`, which
   re-runs `getCraftDesignCostBreakdown` on the server and re-renders `CostBreakdownPanel` with the new
   numbers — there is no separate "calculate" button; the cost is always live.
6. **The invoice page** (`/admin/craft-designs/[id]/invoice`) reads the exact same cost breakdown function
   and renders a printable version — measurements, board lines, material lines, and the grand total.

---

## 7. Demo walkthrough: tracing one sample design through the whole pipeline

This section works a single, concrete example all the way from raw database rows to the number shown on
screen — the same way you'd trace a bug or verify a change.

### 7.1 The sample data

A design called **"Wardrobe #1"**, `quantity = 2` (building two of them), using the shop's **default**
board (no per-part overrides), with:

**Catalog:**

```
board_colors:      { id: "walnut",  is_default: true }
board_thicknesses: { id: "18mm",    is_default: true }
boards: {
  id: "board-1", color_id: "walnut", thickness_id: "18mm",
  sheet_length_inches: 100, sheet_length_shuta: 0,
  sheet_width_inches: 80,   sheet_width_shuta: 0,
  price_per_sheet: 5000, wastage_percent: 10
}
materials: { id: "screw", unit_price: 2 }
```

**This design's parts** (both use the default board, so `color_id`/`thickness_id` are `null`):

```
Part "Side"  — quantity: 2 (needs a left AND a right)
  dimensions: Depth = 20in 0sh (counts), Length = 12in 0sh (counts)

Part "Top"   — quantity: 1
  dimensions: Width = 20in 0sh (counts), Depth = 12in 0sh (counts)
```

**This design's materials:**

```
craft_design_materials: { material_id: "screw", quantity: 40 }
```

### 7.2 Step 1 — fetch (`costBreakdown.ts`)

The app fetches, all at once: the design's `quantity` (**2**), the two part rows above with their
dimensions, the material usage row, the full `boards` catalog, and the current default color/thickness ids
(`"walnut"` / `"18mm"`).

### 7.3 Step 2 — resolve each part (`resolvePart`)

**Side:**
- Color/thickness: neither overridden → falls back to the defaults → matches `board-1`.
- Counted dimensions: Depth and Length, both flagged `counts_toward_area`.
- Convert to shuta: `20in 0sh → 160 shuta`, `12in 0sh → 96 shuta`.
- Unit area: `160 × 96 = 15,360 shuta²`.
- Result: `{ board_id: "board-1", quantity: 2, unit_area_shuta2: 15360 }`

**Top:**
- Same board (`board-1`), same conversion: `20in → 160 shuta`, `12in → 96 shuta`.
- Unit area: `160 × 96 = 15,360 shuta²` (same numbers, coincidentally, since both parts happen to be
  20in × 12in).
- Result: `{ board_id: "board-1", quantity: 1, unit_area_shuta2: 15360 }`

### 7.4 Step 3 — pool by board and convert to sheets (`computeBoardCosts`)

Both parts resolved to `board-1`, so they pool together:

```
pooled_area_for_one_unit = (Side: 15,360 × 2) + (Top: 15,360 × 1)
                         = 30,720 + 15,360
                         = 46,080 shuta²

sheet_area   = (100in × 8) × (80in × 8) = 800 × 640 = 512,000 shuta²

total_area   = 46,080 × design.quantity(2) = 92,160 shuta²
area_to_buy  = 92,160 × (1 + 10/100) = 101,376 shuta²
sheets_needed = ceil(101,376 / 512,000) = ceil(0.198) = 1
board_cost    = 1 × 5000 = ৳5,000
```

One sheet comfortably covers 2 full wardrobes' worth of Side and Top panels — this is exactly the pooling
behavior the module exists for: computed separately, Side alone would round up to 1 sheet and Top alone
would round up to another, wasting a whole sheet for nothing.

### 7.5 Step 4 — materials (`computeMaterialCost`)

```
material_cost = (40 × ৳2) × design.quantity(2) = 80 × 2 = ৳160
```

### 7.6 The final result

```ts
{
  boardLines: [{ board_id: "board-1", total_area_shuta2: 92160, sheets_needed: 1, board_cost: 5000, board: {...} }],
  boardCost: 5000,
  materialCost: 160,
  grandTotal: 5160
}
```

This is exactly what `CostBreakdownPanel.tsx` and the invoice page render: **1 sheet of Walnut · 18mm
(৳5,000)**, **Material Cost ৳160**, **Grand Total ৳5,160**.

---

## 8. Server and UI code layout

### 8.1 Server (`server/`)

A deliberate, scoped exception to the app's usual flat `server/db/*.ts` convention (see
[`architecture.md`](./architecture.md#server-code-layout)) — Craft Design's larger surface area is split
into sub-domain folders:

```
server/
  boards/
    types.ts
    colors.ts        createBoardColor, updateBoardColor, deleteBoardColor, setDefaultBoardColor
    thicknesses.ts   same shape, for board_thicknesses
    boards.ts        createBoard, updateBoard, deleteBoard
  materials/
    types.ts
    materials.ts     full CRUD
  craft-design/
    measurement-labels/
      types.ts
      measurementLabels.ts            full CRUD for measurement_label
      measurementLabelDimensions.ts   full CRUD for measurement_label_dimensions
    designs/
      types.ts
      craftsDesigns.ts                 list/get/create/update/delete; list also returns each design's
                                        part/material counts for the list-page badges
      craftDesignMeasurementLabel.ts   addCraftDesignPart, updateCraftDesignPartOverrides,
                                        updateCraftDesignPartDimensions (server-enforces exactly 2
                                        counts_toward_area flags), removeCraftDesignPart
      craftDesignMaterials.ts          full CRUD for craft_design_materials
      calculation.ts                   the pure calculation logic — see section 5
      costBreakdown.ts                 fetches raw rows and calls calculation.ts — see section 5
```

### 8.2 Admin UI (`src/app/admin/(protected)/`)

| Route | What it manages |
|---|---|
| `/admin/boards` | Colors, thicknesses (chip lists with "Set default"), and boards (a table: color × thickness × sheet size × price × wastage). |
| `/admin/materials` | Flat catalog table, create/edit/delete. |
| `/admin/measurement-labels` | The catalog of part names; each links to its own dimensions sub-page. |
| `/admin/measurement-labels/[id]` | Manages the dimension fields (Depth, Length, ...) for one label. |
| `/admin/craft-designs` | The design list. Each card shows quantity and a **"N parts · M materials"** summary. The Create form here now lets you pick Measurement Labels and Materials for the new design directly, in addition to the basic fields — see section 6. |
| `/admin/craft-designs/[id]` | The design workspace: edit basic fields, add/remove parts and materials, enter each part's actual measurements, and see the live cost breakdown. |
| `/admin/craft-designs/[id]/invoice` | A printable bill-of-materials for the design — internal only, never a customer-facing invoice. |

---

## 9. Not connected to Finance

This is intentional and worth restating: `crafts_designs.finance_record_id` is a plain nullable foreign key
with `on delete set null` — losing the linked project just clears the reference, it never cascades or
affects cost figures. No code path writes a Craft Design's cost into a `finance_records` row, and no code
path reads a `finance_records` cost into a Craft Design. If the two ever need to be reconciled (e.g.
copying a design's grand total into a project's `material_cost`), that would be a deliberate, manual admin
action — not an automatic sync — to avoid Craft Design becoming a hidden write path into Finance's numbers.

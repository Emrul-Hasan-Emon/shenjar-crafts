# Craft Design Costing Module

Given a custom furniture piece's measurements, this module works out **how many board sheets are needed
and the total material + board cost** — entirely computed by Postgres, never by the browser. It is
completely separate from the Finance module: a Craft Design may optionally reference a Project purely for
"which order is this for" navigation, but no cost figure it produces is ever written back into
`finance_records`.

## Why it exists

The shop builds custom furniture (cabinets, tables, racks, interior fittings) from board material cut to
size, plus miscellaneous hardware/materials (hinges, screws, glue). Before this module, there was no way to
answer "how much will this cost to build" other than manual estimation. The ask was: let admin measure each
part of a piece, pick which board (color + thickness) and materials it uses, and get an accurate cost
breakdown — including the non-obvious part, figuring out **how many physical board sheets** a design needs,
since one sheet can usually cover more than one part.

## Data model, and why it's shaped this way

The full column-by-column reference is in [`schema.md`](./schema.md#craft-design). The reasoning behind the
key decisions:

- **Board = color + thickness, no separate "type" table.** Early designs of this schema had a `board_type`
  concept; it was dropped because color+thickness uniquely identifies a real, priced sheet of material —
  adding a type layer on top was structure without a purpose. `boards.unique(color_id, thickness_id)`
  enforces this directly.
- **Colors and thicknesses are admin-managed catalogs, not hardcoded.** Both have an `is_default` flag
  (partial-unique-indexed to at most one row each) so a part can simply *not specify* a color/thickness and
  fall back to whatever the admin currently marks as default.
- **A design part can override color/thickness, or inherit the default.** `craft_design_measurement_label`
  stores nullable `color_id`/`thickness_id` — null means "use the current default," set means "this specific
  part uses this specific board," e.g. a design where most parts are the default color but one accent panel
  is a different one.
- **Measurement labels (part names) and their dimension fields are both admin-managed catalogs**, not fixed
  lists, because the set of parts and how many dimensions each needs genuinely varies: "Side" might need
  just Depth+Length, while another part needs Length+Width+Depth. `measurement_label_dimensions` is a
  variable-length child list per label for exactly this reason.
- **Which dimensions count toward area is chosen per design-part *instance*, not on the catalog.** When a
  label has exactly 2 dimensions, both always count (you can't compute an area from fewer than 2). When it
  has 3+, the admin picks exactly 2 to flag `counts_toward_area = true` for that specific part in that
  specific design — enforced server-side in `updateCraftDesignPartDimensions`
  (`server/craft-design/designs/craftDesignMeasurementLabel.ts`).
- **Design-level `quantity` is separate from a part's own `quantity`.** `crafts_designs.quantity` is "how
  many complete units of this whole piece are being built" (e.g. 4 identical chairs); a part's own
  `quantity` on `craft_design_measurement_label` is how many of that part one unit needs (e.g. Side = 2,
  left and right). Both multiply into the final board area — see the calculation below.
- **Materials are billed separately from boards**, with no shared logic — `craft_design_materials` is a
  flat `quantity × unit_price` list, since hardware doesn't need the sheet-packing math boards do.

## Measurement units: inches + shuta

Every length in this module is a compound value: `{value_inches, value_shuta}`. **1 inch = 8 shuta** — a
traditional Bangladeshi carpentry subdivision the shop actually measures in, finer than a whole inch. All
calculation converts a compound value to a single "total shuta" figure before doing any math:

```
total_shuta = value_inches * 8 + value_shuta
```

This conversion is applied to every length figure a view touches — board sheet dimensions, and every
measured dimension on a design part.

## Calculation pipeline

Board cost calculation aggregates *across* design parts (multiple parts can share one board, and the
number of sheets needed depends on the *sum* of their areas, not each part in isolation) — a single-row
`GENERATED ALWAYS` column can't express that, so this is a chain of three Postgres views instead (see
[`architecture.md`](./architecture.md#postgres-enforced-money-math) for why views, and why
`security_invoker = true` matters). Full SQL is in
[`server/supabase/schema.sql`](../server/supabase/schema.sql); the pipeline, conceptually:

**1. Resolve each part to its board and per-unit area** (`craft_design_part_resolved`)

For every `craft_design_measurement_label` row: join to whichever `boards` row matches its
color/thickness override (or the catalog defaults, if not overridden), and compute that one part's area
*per unit* by multiplying together every dimension flagged `counts_toward_area`. Postgres has no
`product()` aggregate, so this uses the standard `exp(sum(ln(x)))` trick — valid here because every
measured length is positive, so `ln()` is always defined.

**2. Pool by board, convert area to sheets, apply cost** (`craft_design_board_costs`)

Groups by `(crafts_design_id, board_id)` — every part using the *same* board gets summed together *before*
figuring out sheet count, because that's the whole point of pooling: two parts that each need half a sheet
can share one real sheet, rather than each independently rounding up to a full one.

```
total_area   = Σ(part.unit_area × part.quantity) × design.quantity
sheets_needed = ceil( total_area × (1 + wastage_percent/100) / sheet_area )
board_cost    = sheets_needed × price_per_sheet
```

The design's own `quantity` multiplies in **before** the `ceil()` rounding — building 4 units' worth of
area and rounding once uses sheets far more efficiently than computing 1 unit's sheets and multiplying the
result by 4.

**3. Sum materials** (`craft_design_material_costs`)

```
material_cost = Σ(material.quantity × material.unit_price) × design.quantity
```

`server/craft-design/designs/costBreakdown.ts` (`getCraftDesignCostBreakdown`) reads views 2 and 3 for one
design and returns `{ boardLines, materialCost, boardCost, grandTotal }`, rendered by
`CostBreakdownPanel.tsx`.

### Worked example

A design needs a Side (Depth 20in, Length 12in) and a Top (Width 20in, Depth 12in), both the default color
and a board sized 100in × 80in per sheet:

- Side area = 20 × 12 = 240 in² (converted to shuta² internally, but shown here in inches for clarity)
- Top area = 20 × 12 = 240 in²
- Combined = 480 in², well under one 100×80 = 8000 in² sheet → `sheets_needed = 1`
- `board_cost = 1 × price_per_sheet`

Both parts share the single sheet because they pool into the same `board_id` group *before* the
sheets-needed calculation runs — this is the exact scenario that motivated pooling by board instead of
computing sheets per part.

## Server layout

A deliberate, scoped exception to the app's usual flat `server/db/*.ts` convention (see
[`architecture.md`](./architecture.md#server-code-layout)) — Craft Design's larger surface area is split
into sub-domain folders:

```
server/
  boards/
    types.ts
    colors.ts        createBoardColor, updateBoardColor, deleteBoardColor, setDefaultBoardColor
    thicknesses.ts    same shape, for board_thicknesses
    boards.ts         createBoard, updateBoard, deleteBoard — unique_violation (Postgres 23505) rethrown
                       as "A board with this color and thickness already exists."
  materials/
    types.ts
    materials.ts       full CRUD
  craft-design/
    measurement-labels/
      types.ts
      measurementLabels.ts            full CRUD for measurement_label
      measurementLabelDimensions.ts   full CRUD for measurement_label_dimensions
    designs/
      types.ts
      craftsDesigns.ts                 list/get/create/update/delete; CraftsDesignWithProject joins
                                        finance_records(name) for the optional project reference
      craftDesignMeasurementLabel.ts   addCraftDesignPart (creates the part + blank dimension rows),
                                        updateCraftDesignPartDimensions (validates exactly 2
                                        counts_toward_area flags server-side)
      craftDesignMaterials.ts          full CRUD for craft_design_materials
      costBreakdown.ts                 getCraftDesignCostBreakdown — reads the two cost views
```

## Admin UI

| Route | What it manages |
|---|---|
| `/admin/boards` | Three managers on one page: `BoardColorsManager`, `BoardThicknessesManager`, `BoardsManager` — colors/thicknesses as chip lists with a "Set default" action, boards as a table (color × thickness × sheet size × price × wastage). All three support inline create/edit/delete. |
| `/admin/materials` | `MaterialsManager` — flat catalog table, create/edit/delete. |
| `/admin/measurement-labels` | List of part-name labels (`MeasurementLabelCard`), each linking into its own dimensions sub-page; create/edit/delete on the label itself here. |
| `/admin/measurement-labels/[id]` | `MeasurementLabelDimensionsManager` — manages the variable-length list of dimension fields (Depth, Length, Width, ...) for one label. |
| `/admin/craft-designs` | List of designs (`CraftDesignCard`) with a create form up top; each card links into its detail page. |
| `/admin/craft-designs/[id]` | The design workspace: `EditDesignForm` (name/quantity/project link/description, plus delete), `PartsManager` (add parts from the measurement-label catalog, set per-part color/thickness override and quantity, enter dimension values and pick which 2 count toward area), `MaterialsSection` (add materials + quantities), and `CostBreakdownPanel` (live board/material/grand-total figures, read straight from the calculation views). |
| `/admin/craft-designs/[id]/invoice` | A detailed, printable breakdown of the whole design — every part's measurements, every board line with sheets-needed, every material line, and the grand total. Distinct from a Finance project invoice; this is purely a Craft Design's own bill of materials, never shown to a customer by default. |

## Not connected to Finance

This is intentional and worth restating: `crafts_designs.finance_record_id` is a plain nullable foreign key
with `on delete set null` — losing the linked project just clears the reference, it never cascades or
affects cost figures. No code path writes a Craft Design's cost into a `finance_records` row, and no code
path reads a `finance_records` cost into a Craft Design. If the two ever need to be reconciled (e.g.
copying a design's grand total into a project's `material_cost`), that would be a deliberate, manual admin
action — not an automatic sync — to avoid Craft Design becoming a hidden write path into Finance's numbers.

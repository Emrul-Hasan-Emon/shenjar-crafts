# Database Schema Reference

Source of truth is always [`server/supabase/schema.sql`](../server/supabase/schema.sql) — it is written to
be safely re-run (every statement is `if not exists` / `or replace`), and is the actual script to paste
into the Supabase SQL Editor. This document explains that file in prose, organized by module, so a change
can be planned without re-deriving the whole file from scratch.

All tables use `id uuid primary key default gen_random_uuid()` unless noted, and RLS is enabled on every
table (see [`architecture.md`](./architecture.md#row-level-security-rls-is-the-only-access-control) for the
two policy shapes used).

## Site content

Public-read, authenticated-write.

| Table | Key columns | Notes |
|---|---|---|
| `categories` | `slug` (unique), `name_en`/`name_bn`, `banner_path`, `description_en`/`description_bn`, `sort_order` | Free-form — admin creates whatever categories fit; no fixed list in code. |
| `banners` | `image_path`, `sort_order` | Homepage hero slider, capped at 5 in application code. |
| `photocards` | `category_id` → `categories`, `image_path`, `width`/`height`, `name_en`/`name_bn`, `description_en`/`description_bn` | One promotional image per row, shown on `/products`. |
| `raw_media` | `category_id` → `categories`, `kind` (`image`\|`video`), `media_path`, `width`/`height`, `name_en`/`name_bn`, `description_en`/`description_bn` | One real work photo or video per row, shown on `/our-work`. |
| `about_us` | `id` fixed to `'default'` (singleton row), `content_en`/`content_bn` | One row only, upserted via `on conflict (id) do nothing` at schema-run time. |

## Finance

Authenticated-only for both read and write (real business/customer data, not site content) — except the
narrow public invoice exception below.

**`finance_records`** — one table, two kinds of row via `type` (`'project'` | `'spend'`):

| Column | Notes |
|---|---|
| `type` | `'project'` or `'spend'`, `not null`. |
| `category`, `name`, `price` | The only `not null` columns besides `type`/`id`. `price` = per-quantity price for a project, or the cost amount for a spend. |
| `quantity`, `estimated_start_time`, `estimated_delivery_time`, `material_cost`, `making_cost`, `customer_name`, `customer_gender`, `customer_mobile`, `customer_email`, `customer_address`, `status` | All nullable; project-only in practice (spends don't use most of these). `status` is one of `pending`/`started`/`finished`/`delivered`. |
| `total_price` | `generated always as (price * coalesce(quantity, 1)) stored` — missing quantity treated as 1 unit. |
| `total_cost_per_quantity` | `generated always as (...)` — `null` when both `material_cost` and `making_cost` are unset (distinguishes "no cost data yet" from "costs nothing"), else `coalesce(material_cost,0) + coalesce(making_cost,0)`. |
| `total_cost_all` | `generated always as (...)` — `coalesce(quantity,1) * total_cost_per_quantity`, with the same null handling. |
| `updated_at` | Kept current by the `set_updated_at()` trigger (shared, reused by `crafts_designs` too). |

`get_public_invoice(p_id uuid)` — a `security definer` SQL function granted to `anon` and `authenticated`,
returning a fixed column list (no cost fields) for one project id where `type = 'project'`. This is what
powers the public `/invoice/[id]` page without relaxing `finance_records`' RLS.

**`spend_images`** — up to 3 photos per spend (capped in application code, `MAX_SPEND_IMAGES`), `finance_record_id` → `finance_records` (`on delete cascade`), `image_path`, `sort_order`.

## Craft Design

Authenticated-only for both read and write (internal costing data, never public). Entirely separate from
Finance — a Craft Design may *optionally* reference a Project (`finance_record_id`) purely for navigation
context; nothing here ever writes back into `finance_records`. See [`craft-design.md`](./craft-design.md)
for the full rationale and calculation pipeline; this section is the column-by-column reference.

### Catalogs (admin-managed, shared across all designs)

| Table | Key columns | Notes |
|---|---|---|
| `board_colors` | `name_en`/`name_bn`, `description_en`/`description_bn`, `is_default`, `sort_order` | Partial unique index `where is_default` — at most one default color at a time. |
| `board_thicknesses` | `value_mm`, `is_default`, `sort_order` | Same one-default constraint as colors. |
| `boards` | `color_id` → `board_colors`, `thickness_id` → `board_thicknesses` (`unique(color_id, thickness_id)`), `name_en`/`name_bn`, `description_en`/`description_bn`, `sheet_length_inches`/`sheet_length_shuta`, `sheet_width_inches`/`sheet_width_shuta`, `price_per_sheet`, `wastage_percent` (default `10`) | One board = one specific color+thickness combination — no separate "board type" table; the color+thickness pair alone identifies which priced sheet applies. |
| `materials` | `name_en`/`name_bn`, `description_en`/`description_bn`, `unit` (default `'piece'`), `unit_price` | Flat catalog — screws, hinges, glue, anything priced per unit rather than by board area. |
| `measurement_label` | `name_en`/`name_bn`, `description_en`/`description_bn`, `default_quantity`, `sort_order` | The catalog of part names (Side, Top, Bottom, Front, Back, ...) — a real admin-managed table, not a hardcoded list, since the set of parts a design needs varies. |
| `measurement_label_dimensions` | `measurement_label_id` → `measurement_label` (`on delete cascade`), `label_en`/`label_bn`, `description_en`/`description_bn`, `sort_order` | The variable-length list of dimension fields a label needs — 2 for Depth+Length, 3 for Length+Width+Depth, etc. |

### Per-design data

| Table | Key columns | Notes |
|---|---|---|
| `crafts_designs` | `finance_record_id` → `finance_records` (`on delete set null`, nullable), `name_en`/`name_bn`, `description_en`/`description_bn`, `quantity` (default `1`) | Standalone module root. `quantity` = how many complete units of the whole design are being built — distinct from any one part's own `quantity` (e.g. Side needing a left *and* right). Has its own `updated_at` trigger. |
| `craft_design_measurement_label` | `crafts_design_id` → `crafts_designs` (`on delete cascade`), `measurement_label_id` → `measurement_label`, `color_id`/`thickness_id` → `board_colors`/`board_thicknesses` (both nullable), `quantity` (default `1`) | One row per part included in a design. `unique(crafts_design_id, measurement_label_id)` — a label can only be added once per design. `color_id`/`thickness_id` are **overrides**; `null` means "use whichever catalog row is `is_default`". |
| `craft_design_measurement_label_dimensions` | `craft_design_measurement_label_id` → `craft_design_measurement_label` (`on delete cascade`), `measurement_label_dimension_id` → `measurement_label_dimensions`, `value_inches`, `value_shuta`, `counts_toward_area` (default `true`) | The actual measured values — one row per dimension field the label defines. `counts_toward_area` is set **per instance**, not on the catalog: when a label has exactly 2 dimensions both count; when it has 3+, admin picks exactly 2 to flag (server-validated in `updateCraftDesignPartDimensions`). |
| `craft_design_materials` | `crafts_design_id` → `crafts_designs` (`on delete cascade`), `material_id` → `materials`, `quantity` | Simple per-design material usage, no board logic involved. |

### Calculation

Board/material cost is **not** computed in the database for this module — see
[`craft-design.md`](./craft-design.md#calculation-pipeline) for why (nothing here is ever trusted
downstream the way `finance_records`' generated columns are) and for the full worked explanation. It used
to be three chained `security_invoker` views; that logic now lives in
`server/craft-design/designs/calculation.ts` (`resolvePart`, `computeBoardCosts`, `computeMaterialCost`),
called by `server/craft-design/designs/costBreakdown.ts` (`getCraftDesignCostBreakdown`), which fetches the
raw rows and returns `{ boardLines, materialCost, boardCost, grandTotal }` for the UI.

## Storage

One public Supabase Storage bucket, `media` (`public: true`). Public read for everyone; authenticated-only
insert/update/delete. Every image/video field across every module (banners, photocards, raw media,
category banners, spend images) uploads into this single bucket — the access boundary for internal-only
files (like spend images) is the owning **table** row (never queryable by anon), not a storage-level path
policy, since `getPublicUrl()` on a public bucket bypasses `storage.objects` RLS entirely regardless.

## Migrations / idempotency

The whole file is safe to paste and re-run: every `create table` uses `if not exists`, every trigger/view
uses `drop ... if exists` + `create` or `create or replace`, and the two `photocards`/`raw_media` column
renames (`description_en/bn` → `name_en/bn`, from before those tables had a separate description field) are
guarded to only fire once, on an install still in the pre-rename state. New columns added after a table
already existed in production (`finance_records.customer_email`) use `alter table ... add column if not
exists` rather than being folded into the original `create table` statement.

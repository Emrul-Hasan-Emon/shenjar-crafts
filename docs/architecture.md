# Architecture & Conventions

Patterns that repeat across every module in this codebase. Understanding these explains *why* the code is
structured the way it is, so new features can follow the same shape instead of inventing a new one.

## No server API layer

There is no Express/tRPC/Next.js Route Handler layer sitting between the browser and the database for
mutations. Admin pages call `server/*` functions directly from client components, and those functions call
the Supabase JS client — the *authenticated browser's* Supabase client, via
`createClient()` from `server/supabase/client.ts`. The mutation pattern everywhere is:

```
client component → server/<module>/<file>.ts function → supabase-js call → router.refresh()
```

Reads on server-rendered pages use `server/supabase/server-client.ts` instead (a cookie-aware client for
Next.js Server Components), but it's the same underlying pattern — no bespoke API routes per table.

**Consequence: the browser is never trusted with money math.** Because there's no server layer to
intercept a write and recompute a total safely, any calculation that lives in a `server/*.ts` function is
still just JavaScript executing in the *client's* browser — a user could bypass it entirely with a direct
Supabase call. Anywhere a number must be trustworthy (an invoice total, a board-cost calculation), it is
computed by Postgres itself — a `GENERATED ALWAYS` column, or a view — never by TypeScript. See
[`schema.md`](./schema.md) for both mechanisms in detail.

## Row Level Security (RLS) is the only access control

There is no session/permission check in application code. Every table has RLS enabled, and the two
policies used throughout the app are:

- **Public content** (categories, banners, photocards, raw media, about us): `select` allowed for anyone
  (`using (true)`), `insert`/`update`/`delete` require `auth.role() = 'authenticated'`.
- **Internal/sensitive data** (finance records, spend images, everything in the Craft Design module):
  *both* read and write require `auth.role() = 'authenticated'`. There is exactly one narrow, deliberate
  exception — a `SECURITY DEFINER` function, `get_public_invoice(p_id)`, granted to the `anon` role, that
  returns a fixed, customer-safe column list for one project id at a time. It's how the public
  `/invoice/[id]` page works without a login, without relaxing RLS on `finance_records` itself.

There is exactly one Supabase Auth user for the whole app (the shop owner/admin) — no self-service signup,
no role hierarchy. `middleware.ts` + `server/auth.ts` gate every `/admin/(protected)/*` route; RLS is the
backstop that makes that gate not just a UI convenience.

## Postgres-enforced money math

Two mechanisms, chosen based on whether the calculation needs data from *one* row or *many rows*:

1. **`GENERATED ALWAYS` columns** — for a value derivable entirely from other columns on the same row.
   `finance_records.total_price`, `total_cost_per_quantity`, and `total_cost_all` are all generated this
   way. Postgres computes these on every insert/update; no client, however it connects, can supply or
   override them.
2. **Views with `security_invoker = true`** — for a value that must aggregate *across* rows (e.g. "pool
   every furniture part that uses the same board, then figure out how many whole sheets that needs" — a
   single row's data isn't enough). Craft Design's cost calculation is a chain of three views for exactly
   this reason. `security_invoker = true` is essential here and easy to forget: views default to running
   with the *view owner's* privileges, which would silently bypass RLS on the underlying tables. Setting
   `security_invoker = true` makes the view honor the querying user's own RLS instead.

Both approaches share the same guarantee: the browser can read the result, but cannot write it or
influence it beyond supplying the raw inputs.

**The one deliberate exception is Craft Design's cost calculation**, which lives in
`server/craft-design/designs/calculation.ts` — plain TypeScript, not a view — because nothing ever
writes its output back into another table or trusts it for enforcement (see
[`craft-design.md`](./craft-design.md#not-connected-to-finance)). It's pure display for the one
authenticated admin, who already has full database access, so there's no browser-trust boundary to
defend by keeping that math in Postgres. When a calculation's result *does* get trusted downstream
(an invoice total, anything Finance-connected), it stays in Postgres per the two mechanisms above.

## Bilingual content convention

Every admin-managed, user-facing entity has `name_en` (required) + `name_bn` (optional), and often
`description_en`/`description_bn` (both optional) — established by `categories`/`photocards`/`raw_media`
early on, and reused verbatim by every table added since, including every Craft Design catalog table. This
holds even for Craft Design, which is never shown to the public — the bilingual fields exist purely for the
admin's own comfort entering/reading data in their preferred language, not for a customer-facing toggle.

On the public site, the EN/BN switch itself lives in `src/lib/i18n.tsx` (a `useSyncExternalStore`-backed
context persisted to `localStorage`) and `pickLocalized(en, bn, lang)` / `<Localized>` picks the right
string per field. Craft Design's admin screens don't use this toggle — they're internal tools, always
shown in whichever language was entered.

## Admin CRUD UI pattern

Every admin list-with-inline-editing screen (Board Colors, Board Thicknesses, Materials, Measurement
Labels, Measurement Label Dimensions, Boards, Craft Designs, plus the original Categories/Photocards/Raw
Media) follows the same shape:

- A single form component serves both **Create** and **Edit**, switched by an `editing<Entity>: T | null`
  piece of state.
- `key={editing?.id ?? "new"}` on the form element — this forces React to remount the form (and therefore
  reset every `defaultValue`) whenever the edit target changes, instead of stale values lingering from the
  previous edit.
- A **Cancel** button appears only while `editing` is non-null, returning the form to create-mode.
- `handleSubmit` branches on whether `editing` is set: calls the `update*` function when editing, the
  `create*` function otherwise, then `router.refresh()`.
- Delete is a plain button next to each row/card, guarded by the shared `confirmPanel(...)` dialog from
  `src/components/panel/PanelFeedback.tsx`, calling the matching `delete*` server function directly (no
  separate confirmation page).

One layout pitfall worth naming: when a list card needs both a `<Link>` (to navigate into detail) and
`<button>`s (Edit/Delete) sitting inside the same card, the buttons must **not** be nested inside the
`<Link>` — nested interactive elements are invalid HTML and unreliable to click. The fix used throughout
(`CraftDesignCard.tsx`, `MeasurementLabelCard.tsx`) is to extract the whole card into its own small client
component and lay the `<Link>` and the button row out as *siblings*, not parent/child.

## Server code layout

Table-per-file, grouped by module, under `server/`:

- `server/db/*.ts` — the original convention: one flat file per table (`categories.ts`, `finance.ts`,
  `spendImages.ts`, etc.), used by the site CMS and Finance modules.
- `server/boards/`, `server/materials/`, `server/craft-design/{measurement-labels,designs}/` — a
  **deliberate, scoped exception** to the flat-file convention, requested specifically for the Craft
  Design module so its considerably larger set of tables/functions stays organized by sub-domain instead
  of all landing in `server/db/`. See [`craft-design.md`](./craft-design.md) for the full folder layout.

Every module's server functions are the *only* place Supabase queries are written — pages and components
never construct ad-hoc queries. Adding a new field or table always means adding/extending a function in
the relevant `server/` file first.

# Partner Management

Partner accounts with their own login and dashboard, a unique 6-character partner code, configurable
commission/discount, and partner-linked Projects with commission settlement on delivery.
Status: fully implemented and tested end-to-end against the live database — schema/RLS/triggers, admin UI
(`/admin/partners`), the partner panel (`/partner/login`, dashboard, orders), and auth provisioning.

## Why it exists

Partners (referral agents, affiliated organizations/institutions) bring in customers on the shop's behalf.
Each partner has their own commission rate and gives their referred customers a discount. A project created
through a partner needs to track both figures, and the partner needs their own panel to see their referrals
and what they've earned — without being able to see anyone else's data, or the shop's own finance/craft-design
data.

## Authentication: a second class of Supabase Auth user

Before this feature, there was exactly one Supabase Auth user (the admin) and every RLS policy in
`schema.sql` was a blanket `using (auth.role() = 'authenticated')` — any authenticated session got full
read/write on `finance_records`, `spend_images`, and every Craft Design table. Partner login is a second
class of authenticated user, so that blanket policy is replaced everywhere, not just extended.

- Every partner gets their own real Supabase Auth user, linked via `partners.user_id -> auth.users.id`.
- `app_admins(user_id)` distinguishes "admin" from "partner," since Supabase doesn't expose a clean role
  flag here. It's auto-seeded with every `auth.users` row that exists when the migration runs — today that's
  exactly the one admin account — so running the migration never locks the admin out of their own data. Any
  user created after that point (every partner) is deliberately left out.
- `is_admin()` — a `stable` SQL function checking `app_admins` for `auth.uid()` — replaces
  `auth.role() = 'authenticated'` in every RLS policy on sensitive tables.
- Partners can't self-register. Admin provisions them via the Auth Admin API
  (`supabase.auth.admin.createUser`), which needs the service role key and must run server-side only — a
  `"use server"` Server Action (`server/partners/auth.ts`), the one legitimate new server-API-layer exception
  in this codebase, mirroring how `get_public_invoice` is the one exception to "authenticated-only."
- `/partner/login` is a fully separate page from `/admin/login` — its own form, its own
  `supabase.auth.signInWithPassword` call, its own session. No shared login component, no shared session
  between the two panels.
- **Partners log in by mobile, not email** — email is optional contact info only. Supabase Auth's
  password sign-in still needs an email or phone identifier under the hood, and real phone-based Supabase
  Auth would need an SMS provider configured (not set up here), so `server/partners/authEmail.ts` maps a
  mobile number to a deterministic, never-shown internal auth email (`partner.<digits>@partners.shenjarcrafts.internal`).
  It's a pure function, safe to import from both the login page and the auth-provisioning Server Action.
  `partners.mobile` has a unique index for this reason.

## Data model

Two new tables, deliberately kept to two: `partners` holds profile information only; everything
financial — the partner code, the commission/discount configuration, and cached stats — lives in
`partner_configs`. There is no separate "commission log" table: a Project already has a 1:1 relationship
with its own commission/discount outcome, so that data lives directly on `finance_records` instead of a
third table.

```
partners
  id, user_id (-> auth.users, unique)
  name, mobile, email, organization_name, institution,
  facebook_link, linkedin_link, profile_picture_path,
  is_active (default true), is_default (default true)
  created_by, creator_name, updated_by, updater_name, created_at, updated_at
  check (organization_name is not null or institution is not null)

partner_configs
  id, partner_id (-> partners, unique)
  code (unique)                        -- the 6-character partner code
  commission, commission_type ('fixed' | 'percentage')
  discount, discount_type ('fixed' | 'percentage')
  total_orders, total_delivered_orders, total_commission, total_discount   -- cached counters
  updated_by, updater_name, created_at, updated_at
```

Commission/discount configuration and the cached counters live separate from `partners` so that editing a
partner's profile never touches their financial configuration, and so that changing a partner's rate only
affects *future* orders — `finance_records` keeps its own snapshot of whatever rate applied when each order
was created (below), unaffected by later config changes.

Indexes are deferred for v1 (single shop, small tables) — add them on `partner_configs.code`,
`partners.mobile/email`, and `finance_records.partner_id` if the data grows enough for it to matter.

## Partner code

6-character alphanumeric (uppercase letters + digits, excluding visually ambiguous `0`/`O`/`1`/`I`),
generated in `server/partners/code.ts`, retried against a `select` for uniqueness before insert, backstopped
by `partner_configs.code`'s database `unique` constraint — the same pattern `boards` uses for its own
`unique(color_id, thickness_id)` plus a friendly re-thrown error in `server/boards/boards.ts`.

## Partner fields on `finance_records` (Projects)

`total_price` already exists and is unchanged — it's the order's value *before* any partner discount. Six
new columns capture the partner side, and — other than the two snapshot-only text/id fields — all of it is
Postgres-computed, not client-supplied:

```
partner_id, partner_code           -- who this order is for
commission_rate, commission_type   -- snapshot of partner_configs at creation time
discount_rate, discount_type       -- snapshot of partner_configs at creation time
commission_amount                  -- generated: the money value of commission_rate/commission_type
discount_amount                    -- generated: the money value of discount_rate/discount_type
total_amount                       -- generated: total_price - discount_amount (the final, post-discount value)
commission_status                  -- 'pending' | 'earned' | 'unearned', kept in sync with status
```

`commission_amount`, `discount_amount`, and `total_amount` are `generated always` columns — same principle
as `total_price` itself: no client, however it connects, can supply or override them. (Postgres doesn't
allow a generated column to reference another generated column, so their expressions re-state
`price * coalesce(quantity, 1)` inline instead of referencing `total_price` — same value, just spelled out
because the shortcut isn't legal.)

`commission_rate`/`commission_type`/`discount_rate`/`discount_type`/`partner_code` are a point-in-time
snapshot, but not client-supplied either: a `before insert` trigger
(`finance_records_apply_partner_snapshot`) copies them from `partner_configs` based on `partner_id` alone,
overwriting whatever the client sent. A partner (or a bug) can never write in a more favorable rate than
what's actually configured for them.

## Commission settlement (delivery gate)

A partner only earns commission once their project is delivered. A `before insert or update of status`
trigger (`finance_records_set_commission_status`) derives `commission_status` purely from `status`:

```
status = 'delivered'                          -> commission_status = 'earned'
status is null / pending / started / finished -> commission_status = 'pending'
anything else                                 -> commission_status = 'unearned'
```

(`unearned` is reserved for a future cancelled-type status — `finance_records.status` has no such value
today, so that branch is currently unreachable in practice.) The existing `ProjectsTable` inline status
dropdown (`updateFinanceRecord`) needs zero changes to keep commission status correct.

A second trigger (`finance_records_sync_partner_stats`, `after insert or update`) keeps `partner_configs`'
cached counters in sync: `total_orders` updates once, at creation, regardless of eventual delivery outcome
(it's a count of referrals, not earnings). `total_delivered_orders`/`total_commission`/`total_discount` all
move together, only when `commission_status` actually transitions into or out of `'earned'` — a partner's
commission is only earned, and a customer's discount only "counts," once the Project is delivered — including
reversing all three if a delivered order's status is later corrected away from `delivered`.

## Authorization model (RLS)

| Table(s) | Policy |
| --- | --- |
| `finance_records`, `spend_images`, all 10 Craft Design tables, site-content write policies, storage writes | `auth.role() = 'authenticated'` → `is_admin()` |
| `finance_records` | Partner-scoped `select` (own `partner_id` rows, `type = 'project'` only, via `partners.user_id = auth.uid()`) and partner-scoped `insert` (only when `partner_id` resolves to the caller's own, active partner row — never client-trusted). No partner `update`/`delete` — keeps status transitions, especially → `delivered`, admin-only. |
| `partners` | Admin full access; partner `select` own row only. No partner self-edit in v1. |
| `partner_configs` | Admin full access; partner `select` own row only. |

Partners could see `material_cost`/`making_cost`/`total_cost_*` on their own referred projects through
these policies alone — those columns exist on the same row a partner can otherwise `select`. Rather than a
separate view, `server/partners/orders.ts` uses an explicit column allowlist (excluding them) on every
partner-facing read/write of `finance_records`, the same exclusion `get_public_invoice` applies.

## Server layout

```
server/partners/
  types.ts             Partner, PartnerConfig, and input types
  code.ts               generateUniquePartnerCode
  partners.ts          create/update/list(paginated)/get/deactivate
  config.ts             commission/discount config CRUD
  orders.ts             partner-scoped finance_records reads/creates (explicit column allowlist)
  dashboard.ts          partner + admin aggregate stats
  auth.ts               "use server" — createPartnerAuthUser (service role); the only file in this
                         module allowed to import the service-role client
```

## Routes

```
/admin/partners                admin list (paginated, search/filter)
/admin/partners/new             create (provisions the Auth user server-side)
/admin/partners/[id]            details: profile, config, stats, order/commission history, edit, deactivate
/partner/login                  its own page, own Supabase Auth session
/partner/(protected)/layout.tsx mirrors admin's protected layout + nav shell, own component tree
/partner/(protected)             dashboard, profile (read-only), orders list, new order
```

`middleware.ts` gains a second gate: `/partner/*` requires a logged-in user whose `auth.uid()` has a
`partners` row — not just "any user," otherwise the admin's own session would pass through. A symmetric
check on `/admin/*` keeps partners out of the admin panel with a clean redirect.

Existing Project UI (`ProjectsTable`, `FinanceRecordForm`, `finance/projects/new/page.tsx`) gets a partner
selector (search by name/code) on the admin create form, a Partner column + filter in `ProjectsTable`, and
read-only commission/discount display on the project detail page.

## Designing for easy extraction later

If `/partner` ever needs to become its own deployed app, this keeps the split a copy-and-detach rather than
an untangling job:

- Partner server logic stays inside `server/partners/**`, never reaching into `server/db/**`,
  `server/boards/**`, `server/materials/**`, or `server/craft-design/**`. The only imports allowed from
  outside are the genuinely shared primitives: `server/supabase/client.ts`, `server/supabase/server-client.ts`,
  `server/supabase/storage.ts`, `server/lib/*`.
- Partner UI lives under `src/app/partner/**` with its own layout and nav shell, never importing a component
  from `src/app/admin/**`. Shared visual primitives (buttons, inputs, `Spinner`) stay in the already-neutral
  `src/components/*`.
- Partner reads/writes to `finance_records` always go through `server/partners/orders.ts`, never
  `server/db/finance.ts` directly.
- `/admin` and `/partner` sit behind two independent middleware gates, neither depending on the other.
- RLS is keyed by `auth.uid()`, not by which app is calling, so the database layer doesn't care which
  Next.js app makes the request. A future split is copying `src/app/partner/**` + `server/partners/**` +
  the shared primitives into a new project pointed at the same Supabase project, with no schema or RLS
  changes needed.

## Naming: Project vs. Order

Keep `finance_records` / "Project" as the underlying name — Craft Design already has a live foreign key
(`crafts_designs.finance_record_id`), and the invoice pages, filters, and docs all say "Project." "Order"
appears only as partner-facing UI copy (`/partner/(protected)/orders`), reading from the same
`finance_records` table.

## Pagination

No pagination convention exists yet anywhere in the app (every list function fetches all rows and filters
client-side). This introduces one minimal pattern — `.range(from, to)` + `{ count: 'exact' }` — used for the
admin Partner list and the partner/admin order lists. The existing unpaginated `ProjectsTable` /
`SpendsTable` are not retrofitted as part of this feature.

## Open decisions

- Cap commission/discount percentage at 100, or allow higher?
- Partner passwords: admin sets an initial password at creation, no partner-facing password reset in v1 —
  okay, or is self-service reset needed?
- Profile picture upload: reuse the existing public `media` bucket under a `partners/` path prefix?

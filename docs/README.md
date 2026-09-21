# Shenjar Crafts — Documentation Index

This `docs/` folder is the project history and reference: **what has been built, how it works, and why it
was built that way.** It's meant to be handed to a future Claude session (or any developer) with zero prior
context.

The root [`README.md`](../README.md) already covers the original site build in depth — the public
marketing site, the content CMS (Categories/Banners/Photocards/Raw Media/About Us), and the Finance
module (Projects/Spends/Invoices) — including local setup, project structure, and known limitations.
**Read that first.** This folder picks up from there and documents everything added since, plus a single
reference for the full database schema.

## What's in here

| Doc | Covers |
|---|---|
| [`architecture.md`](./architecture.md) | Cross-cutting patterns used everywhere in this codebase: no server API layer, Row Level Security, Postgres-enforced money math (generated columns + views), the bilingual content convention, and the admin CRUD UI pattern. Read this to understand *why* the code looks the way it does before changing any of it. |
| [`schema.md`](./schema.md) | The full Supabase/Postgres schema, one reference, organized by module — every table, its columns, relationships, RLS policy, and (for Craft Design) the calculation views. Source of truth is always [`server/supabase/schema.sql`](../server/supabase/schema.sql); this doc explains it in prose. |
| [`craft-design.md`](./craft-design.md) | The Craft Design costing module — Boards, Materials, Measurement Labels, and Craft Designs. The largest feature built after the initial site: given a furniture piece's measurements, it works out how many board sheets are needed and the total material + board cost, entirely server/database-computed. Includes the data model rationale, the calculation pipeline, and the admin UI. |
| [`design-studio.md`](./design-studio.md) | The public AI sketch-to-concept tool. Built, then intentionally hidden from navigation pending a decision on a paid AI image provider. Code is intact at `/design-studio`, just unlinked. |

## Timeline (chronological, oldest first)

1. **Initial site build** — Next.js portfolio site (home, about, services, products, our-work, contact),
   static content only. See root `README.md`.
2. **Supabase-backed admin panel, finance module, and invoicing** — content CMS + `/admin` panel backed by
   Supabase (Postgres + Storage + Auth), plus the Finance (Projects/Spends) bookkeeping module and
   customer-facing invoices. See root `README.md`.
3. **Mobile responsiveness + loading states** — UI polish pass across the public site and admin panel.
4. **Craft Design costing module + Design Studio sketch tool** — the two features documented in this
   folder. Design Studio was built first, then hidden from nav; Craft Design followed and is fully live in
   the admin panel.
5. **Admin panel UX**: left sidebar navigation on desktop (mobile keeps the hamburger menu), and
   Edit/Delete UI completed for every Craft Design catalog (Boards, Colors, Thicknesses, Materials,
   Measurement Labels, Measurement Label Dimensions, Craft Designs) to match the CRUD pattern already used
   elsewhere in the admin panel.

## Quick module map

| Module | Public-facing? | Admin route | Data lives in |
|---|---|---|---|
| Site content (categories, banners, photocards, raw media, about us) | Yes | `/admin/categories`, `/admin/banners`, `/admin/photocards`, `/admin/raw-media`, `/admin/about-us` | `categories`, `banners`, `photocards`, `raw_media`, `about_us` |
| Finance (projects, spends, invoices) | Invoices only, via unguessable link | `/admin/finance/*` | `finance_records`, `spend_images` |
| Craft Design (boards, materials, measurement labels, designs) | No — fully internal | `/admin/boards`, `/admin/materials`, `/admin/measurement-labels`, `/admin/craft-designs` | `board_colors`, `board_thicknesses`, `boards`, `materials`, `measurement_label`, `measurement_label_dimensions`, `crafts_designs`, `craft_design_measurement_label`, `craft_design_measurement_label_dimensions`, `craft_design_materials` |
| Design Studio (AI sketch tool) | Yes, but unlinked from nav | none (no admin management — it's a public tool) | none (stateless — calls an external free AI image API per request) |

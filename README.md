# Shenjar Crafts — Website

A Next.js (App Router) portfolio + admin site for Shenjar Crafts, a custom furniture / interior / electrical
studio in Uttara, Dhaka. Content — homepage banners, categories, promotional photocards, real project photos
and videos, and the About Us text — is managed entirely through a password-protected `/admin` panel backed by
Supabase. There is no e-commerce/checkout yet; that is a future phase.

This file is meant to be handed to a future Claude session (or any developer) with zero prior context, so it
explains **how the whole system fits together**, not just "how to run it."

**See also [`docs/`](./docs/README.md)** for the Craft Design costing module, Design Studio, cross-cutting
architecture patterns, and a full database schema reference — everything built after this file was last
substantially updated.

For the current public-site appearance and responsive behavior, see [UI Design & Responsive Changes](docs/ui-design.md).

## Stack

- Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4.
- Supabase: Postgres (data), Storage (images/videos), Auth (one admin user).
- Hosted on Vercel's free tier, connected via the native Vercel↔Supabase integration (env vars are injected
  automatically in production).

## How content actually gets on the site

**All new content goes through `/admin` — nothing is read from local files any more.** The
`src/data/real-images/` folder and `server/scripts/migrate-to-supabase.ts` were a **one-time historical
import** used to seed the database when this system was first built; they are not part of the ongoing
mechanism. Do not expect adding files there to do anything — it won't, unless someone deliberately re-runs
the migration script.

The admin panel (`src/app/admin/(protected)/*`, protected by `middleware.ts` + `server/auth.ts`) manages:

| Section | Table | What it's for |
|---|---|---|
| Banners | `banners` | Up to 5 images shown as the homepage hero slider, left to right. |
| Categories | `categories` | Name (English required, Bangla optional), optional banner image, optional description (EN/BN). Everything else attaches to a category. |
| Products | `photocards` | One product image per row: category, name (EN required, BN optional), optional longer description (EN/BN), optional price, and optional discounted price. Shown on `/products`; the database table remains `photocards`. |
| Raw Media | `raw_media` | One real photo *or* video per row: category, name (EN required, BN optional), optional description (EN/BN). Shown on `/our-work`. |
| About Us | `about_us` (singleton row) | Free-text content (EN/BN) shown on `/about`. |

Every product/raw-media card in `/admin` has both a **Delete** and an **Update** button — Update lets you
change the name, description, category, and optionally replace the image/video file itself, all inline.

### Clicking a product or raw-media item on the public site

`/products` and `/our-work` grid items are buttons, not links — clicking one opens `src/components/OrderModal.tsx`
showing the full image/video and description (if set), with an **Order Now** button. Clicking that reveals two
options, **WhatsApp** (deep-links to `site.whatsappHref` with the item's name pre-filled into the message) and
**Facebook** (links to `site.facebook`) — the customer picks how they want to continue the conversation. The name
shown as the modal title and the caption under each grid thumbnail are the same `name_en`/`name_bn` fields set
in `/admin`; the description only shows inside the modal, not on the grid card.

Every table's queries live in `server/db/*.ts` — that is the single source of truth for reading/writing this
data, used by both the public pages and the admin forms. Don't write ad-hoc Supabase calls elsewhere; add a
function there instead.

### Categories are fully free-form

There is **no fixed list of categories** anywhere in the code. An admin creates whatever categories make
sense (e.g. "Cabinet", "Table", "Rack", "Interior Design", "Vanity", "Storage", "Study & Office" exist today
purely because that's what was imported at launch — more can be added, and any of these can be renamed).
Category **names** (not ids/slugs) are used to link a Service to matching Our Work photos (see below), so
renaming a category can silently break that link — check `src/data/services.ts` after a rename.

### Bangla fields and the language toggle

`name_bn` / `description_bn` / `content_bn` exist on every relevant table and are optional — leave them blank
and English is always shown. The header has an **EN / বাং** toggle (`src/lib/i18n.tsx`, a small
`useSyncExternalStore`-backed context persisted to `localStorage` — deliberately not a `useEffect`+`useState`
pair, which would trip the `react-hooks/set-state-in-effect` lint rule and cause an extra render). Any
component that shows admin-managed bilingual text calls `pickLocalized(en, bn, lang)` from that file, or
drops in the `<Localized en={...} bn={...} />` component for a quick inline swap without converting the
whole parent to a client component. Static site copy (`src/data/site.ts`, `src/data/services.ts`) has no
Bangla variant and always renders in English — it isn't part of the admin CMS.

### Image compression and video size limits

Every image uploaded through `/admin` (banners, photocards, raw media, category banners) is compressed
client-side before upload via `src/lib/compressImage.ts` — canvas-based re-encode to JPEG, capped at ~1.5MB
and 2000px on the long edge, skipped entirely if the file is already small enough. This runs in the browser,
so it also works from a live Vercel deployment (no server-side image processing needed). Videos are **not**
compressed (that needs real transcoding, out of scope) but are capped at 15MB per file in the raw-media
upload form — reject/re-encode larger files before uploading.

### Public site vs. admin — no shared navigation

`src/app/(site)/` is a route group holding every public page (home, about, services, products, our-work,
contact) — its `layout.tsx` is what renders the public `<Header>`/`<Footer>`. `src/app/admin/` sits outside
that group, so admin pages only get the root layout (fonts, `<LanguageProvider>`) plus their own
`(protected)/layout.tsx` nav — the public site's header/footer never appear on `/admin/*`, and the admin nav
never appears on the public site. If you add a new public page, put it under `(site)/`; a new admin page goes
under `admin/(protected)/`.

### Finance Management (`/admin/finance`)

A separate module, not shown anywhere on the public site — it's the shop's internal bookkeeping. One table,
`finance_records`, holds two kinds of row via a `type` column:

- **`project`** — a customer order/job: category, name, price *per quantity*, optional quantity, optional
  material/making cost per quantity, optional customer info (name/gender/mobile/address), optional status
  (`pending`/`started`/`finished`/`delivered`), optional estimated start/delivery dates.
- **`spend`** — money going out: category, name, price (used as the cost amount), optional description. No
  quantity/customer/status fields apply.

`category`, `name`, and `price` are the only `not null` columns — every other field is nullable, exactly per
spec. `/admin/finance/projects` lists projects with filters (status, customer name, mobile, gender, category)
in the exact column layout requested (Customer / Category / Quantity & Cost / Total Price / Status /
Delivery); `/admin/finance/spends` lists spends (Name / Category / Description / Cost). Both have `new` and
`[id]` (details + update, no delete) routes, sharing one form component,
`src/app/admin/(protected)/finance/_components/FinanceRecordForm.tsx`, that shows/hides the project-only
sections based on `type`.

**The three calculated fields — `total_price`, `total_cost_per_quantity`, `total_cost_all` — are Postgres
`GENERATED ALWAYS` columns, not values computed in TypeScript.** This app has no server API layer in front of
Supabase (admin writes go straight from the authenticated browser client to Postgres via RLS), so a
"calculate it in `server/db/finance.ts`" approach would still just be JavaScript executing in the browser —
trusting it would make the frontend the real source of truth for money math, which the spec explicitly
prohibits. A generated column is computed by Postgres on every insert/update and simply cannot be set or
overridden by any client (confirmed: `POST .../finance_records` with an explicit `total_price` in the body
fails with `"cannot insert a non-DEFAULT value into column \"total_price\""`, whatever writes the row). The
formulas: `total_price = price * coalesce(quantity, 1)` (missing quantity is treated as a single unit, not
zero); `total_cost_per_quantity = material_cost + making_cost` (`null` — not `0` — when both are unset, so
"no cost data yet" reads differently from "this costs nothing"); `total_cost_all = coalesce(quantity, 1) *
total_cost_per_quantity`. `server/db/finance.ts` only ever reads these back, never writes them.

Finance data is real business/customer information, not site content — unlike every other table, its RLS
policy makes it **authenticated-only for both read and write**, not publicly readable. There's *one* narrow,
deliberate exception — see Invoices below.

The Category field is a required dropdown sourced from the same `categories` table used everywhere else
(photocards, raw media) — `listCategories()` from `server/db/categories.ts`, matching the exact picker pattern
used on the Product form. `finance_records.category` stores the category's `name_en` as plain text (there's
no foreign key — this mirrors how Services→Our Work already matches categories by name elsewhere in this
codebase), so renaming a category in `/admin/categories` won't retroactively update existing finance rows.
There's no "add new category" option on the finance forms; a new category is created once under
`/admin/categories` and then becomes available on Products, Raw Media, and Finance alike. Both Projects and
Spends can be deleted — from their detail page, or straight from the Actions column in their list
(`deleteFinanceRecord`, with a confirm prompt either way) — the only finance entity without a delete option is
a category itself (see the existing note on that above).

The Projects list has an inline status changer (a `<select>` right in the table row, saved immediately via
`updateFinanceRecord` + `router.refresh()` — no need to open the record) and an Actions column with direct
**Invoice** and **Delete** links per row, so neither needs opening the project first. Creating a new project
or spend redirects to that type's list page afterward; saving edits on an existing record stays on its detail
page.
The Finance dashboard (`/admin/finance`) also breaks projects down by status (count + total quantity per
status) and totals Material/Making/Total cost across all projects, on top of the income/spend totals.

#### Invoices

Each project has a customer-facing invoice, generated live from its current data — not a separately stored
document, and deliberately **excluding** `material_cost`, `making_cost`, `total_cost_per_quantity`, and
`total_cost_all` (internal-only figures). `src/components/InvoiceView.tsx` is the shared presentational
layout, used by two routes:

- `/admin/finance/projects/[id]/invoice` — the admin view, with **Print / Save as PDF** (`window.print()` —
  there's no PDF-generation library in this project; "download" means the browser's own print-to-PDF, which
  needs no dependency and works everywhere) and **Send via WhatsApp**, which opens a prefilled compose window
  pointing at the *public* invoice link below — it doesn't attach a file, since `wa.me` links don't support
  attaching a file from a web page; sharing a link the customer can open, view, and print themselves is the
  practical equivalent. (There used to also be a "Send via Gmail" button; it was removed by request — the shop
  doesn't want its own email surfaced yet, see below.)
- `/invoice/[id]` — a public page (outside both the `(site)` and `admin` route groups, no nav chrome, safe to
  print directly) that anyone with the link can open **without logging in**. This does *not* relax
  `finance_records`' RLS — it calls `get_public_invoice(p_id)`, a `SECURITY DEFINER` Postgres function granted
  to the `anon` role that returns only the fixed, customer-safe column list above for one project id. Verified
  directly: the anon key can call the RPC and get back exactly those columns, while a direct
  `select * from finance_records` with the same anon key still returns nothing.

`InvoiceView.tsx` renders the line item as a real `<table>` from `sm:` up and as a stacked label/value block
below it — a 5-column table doesn't fit a phone screen, and this is the one component in the app most likely
to actually be opened on a phone (a customer tapping a shared link), so it gets its own mobile layout rather
than just an `overflow-x-auto` scroll wrapper. The header shows the real logo (`public/images/logo.png`) next
to the business name/address/phone — no shop email is shown anywhere on the invoice (see below); the
customer's own `customer_email`, when set, still appears in the Billed To block, since that's the customer's
data, not the shop's.

#### Spend images

Each spend can have up to 3 supplementary photos (receipts, materials, whatever documents the spend) —
`spend_images` table, `MAX_SPEND_IMAGES` in `server/db/spendImages.ts` enforces the cap the same way
`banners` caps at 5. Managed from `/admin/finance/spends/[id]` via `SpendImagesManager.tsx`, reusing the same
`MediaPreviewInput` + `compressImageIfNeeded` + `uploadFile`/`safeFileName` upload path as every other admin
image field, stored under a `spend-images/` prefix in the shared `media` bucket. A spend must be saved once
before images can be attached (there's no record id yet on the `new` form).

`spend_images` is **authenticated-only for both read and write**, same posture as `finance_records` itself —
these are internal bookkeeping photos, never shown publicly. One subtlety: the `media` Storage bucket is
created `public: true` (needed for photocards/raw-media/banners to render on the public site), and Supabase's
`getPublicUrl()` read path **bypasses `storage.objects` RLS entirely** for a public bucket — so a
storage-level policy restricting the `spend-images/` prefix would be security theater, not real protection,
and was deliberately not added. The actual access boundary is the `spend_images` **table** row (never
queryable by anon) plus the unguessable random suffix `safeFileName()` puts on every filename — the URL is
simply never surfaced to anyone without an authenticated session in any code path this app has.

### No shop email shown yet

`site.email` (`src/data/site.ts`) still exists in code but is deliberately not rendered anywhere — not on
`/contact`, not in `Footer.tsx`, not on the invoice. The business doesn't have an email address ready yet and
asked for it to be hidden everywhere until they do; when one is set up, re-add the "Email" contact card in
`src/app/(site)/contact/page.tsx`'s `CONTACT_CARDS` and the corresponding `<li>` in `Footer.tsx`'s "Get in
Touch" list (both were removed, not commented out).

### Services → Our Work linking

`src/data/services.ts` services can have a `workCategories: string[]` field — a list of category **names**.
At render time (`src/app/services/page.tsx`), each name is matched case-insensitively against the live
`categories` table; a service only shows a "See Our Work" link when a match currently has at least one
`raw_media` row. This means the link appears/disappears automatically as content is added or removed via
`/admin` — no code change needed for that part. It also means the mapping itself (which categories a service
points at) is a manual, curated decision living in that file, updated by hand when it makes sense.

## Two Supabase environments

This app talks to **two separate Supabase projects** — production and development — both configured in one
`.env.local`, distinguished by variable name and chosen automatically by `NODE_ENV` (see
`server/supabase/env.ts`, the one place that branches on this):

| | `NODE_ENV=development` (`next dev` — this is the *only* trigger) | anything else, including unset (Vercel, `next build`/`next start`) |
|---|---|---|
| URL | `DEV_SUPABASE_URL` | `SUPABASE_URL` |
| Anon key | `DEV_SUPABASE_ANON_KEY` | `SUPABASE_ANON_KEY` |
| Service role key | `DEV_SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` |

**Production is the default.** The app only ever reads the `DEV_SUPABASE_*` keys when `NODE_ENV` is
*literally* `"development"` — everything else (unset, missing, some unexpected value) resolves to
production. This is deliberate: a deployed instance must never silently fall back to placeholder/dev
credentials just because `NODE_ENV` wasn't set the way we expected; it should instead loudly require real
production credentials. `next dev` sets `NODE_ENV=development` automatically and reliably, so local
development is unaffected by this.

Standalone scripts under `server/scripts/` (`migrate`, `seed-partners.ts`, `smoke-test-*.ts`, etc.) are the
one deliberate exception and go the **other** way — they default to *development* when `NODE_ENV` isn't
set, because for a script a human runs on their own machine, the risk is reversed: it should never
accidentally write to production just because someone forgot to set an env var. See
`server/scripts/loadSupabaseEnv.ts` for that separate (intentionally opposite) default.

`.env.local` is gitignored — never committed, and holds all six values side by side. The production
deployment on Vercel already has its three values configured via the Supabase integration, independent of
this file — `.env.local` only matters for running the app on your own machine (dev or production mode).

Next.js loads `.env.local` automatically in every environment; `next.config.ts` additionally bridges the
resolved URL/anon key into the browser bundle (the anon key is meant to be public — real access control is
Row Level Security, not secrecy of this key). The service role key is never exposed this way; it only
appears in server-only code (`server/scripts/*.ts`, via `getSupabaseServiceRoleKey()`).

**Local development setup:**

1. Copy both projects' keys into `.env.local` (not committed):
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=xxxx
   SUPABASE_SERVICE_ROLE_KEY=xxxx

   DEV_SUPABASE_URL=https://xxxx.supabase.co
   DEV_SUPABASE_ANON_KEY=xxxx
   DEV_SUPABASE_SERVICE_ROLE_KEY=xxxx   # only needed by scripts under server/scripts/, never shipped to the browser
   ```
2. In the development project's Supabase SQL Editor, run `server/supabase/schema.sql` once (safe to re-run —
   every statement is idempotent). This creates the tables, Row Level Security policies (public read,
   authenticated-only write), and the public `media` Storage bucket.
3. Create exactly one Supabase Auth user in that project (Authentication → Users → Add user) — its
   email/password is the `/admin` login. There's no self-service signup flow by design.
4. `npm install`
5. `npm run dev` (uses the `DEV_SUPABASE_*` keys automatically, since `NODE_ENV` is "development")

Scripts under `server/scripts/` (`migrate`, `import-raw-media.ts`, `seed-partners.ts`,
`smoke-test-partners.ts`, `test:craft-design`) also default to the development project — they only ever
touch production if you explicitly run them with `NODE_ENV=production`, and the two test/seed scripts
(`seed-partners.ts`, `smoke-test-craft-design.ts` / `smoke-test-partners.ts`) refuse to run at all against
production, on purpose (see `server/scripts/loadSupabaseEnv.ts`).

## One-time historical import

`npm run migrate` runs `server/scripts/migrate-to-supabase.ts`, which walked the original
`src/data/real-images/` folder tree and populated Supabase with:

- `Cabinet/`, `Interior Design/`, `Table/`, `Rack/` → one category per folder name, each file → one
  `raw_media` row.
- `Shop/` → category "Behind the Scenes", same treatment (this was the "random behind-the-scenes work
  videos" folder).
- `Photo Card/Rack/`, `Photo Card/Reading Table/` → categories "Rack"/"Table" (reusing the matching raw
  category), each file → one `photocards` row.
- Everything else loose directly under `Photo Card/` (including the pre-existing promotional images that were
  moved in from the old `src/data/images/`) and `Photo Card/Video/` → keyword-classified by filename (vanity/
  dressing→Vanity, study/office→Study & Office, kitchen/interior→Interior Design, rack→Rack, storage/cabinet/
  shelf→Storage, furniture→Furniture, else→Highlights) into `photocards` (images) or `raw_media` (videos —
  `photocards` is image-only, so a promotional video has nowhere else to go).
- Image dimensions were read with a small hand-rolled PNG/JPEG parser (`server/lib/imageSize.ts`) —
  deliberately **not** the `image-size` npm package, which has an open/unpatched DoS advisory in its
  ICNS/JXL/HEIF parsers we don't need.

The script is idempotent (categories are matched by name, storage uploads use upsert), so it's safe to
re-run if someone hands over another folder of raw photos to bulk-import the same way in the future — the
naming convention it expects is `<serial>_<Product_Name>_Type_<n>_<Image|Video>_<m>.<ext>` (see the script
for the exact fallback behavior when a filename doesn't match).

There's also `server/scripts/import-raw-media.ts` — a narrower one-off that only walks the raw work folders
(`Cabinet/`, `Interior Design/`, `Table/`, `Rack/`, `Shop/`), used once to reload `raw_media` after it was
intentionally cleared. Unlike the main migration script it leaves `name_en`/`name_bn`/description blank on
purpose (filled in later via `/admin`) and compresses images server-side with `sharp` (resize to at most
2000px, re-encode to JPEG, step quality down until under ~1.5MB) since there's no browser available in a
Node script; videos are uploaded as-is, capped at 15MB. Not wired into any npm script — run it manually
(`npx tsx server/scripts/import-raw-media.ts`) only if `raw_media` needs reloading from that source tree
again.

## Known limitations

- **No AI-generated placeholder images.** If a category has real work photos but no photocard yet, it falls
  back to a branded icon tile (`PlaceholderTile`), not a synthesized product photo — there's no image
  generation tool wired into this workflow.
- **No auto-generated video thumbnails.** Video tiles rely on the browser's native `preload="metadata"`
  first-frame behavior; there's no ffmpeg step producing a poster image.
- **Category deletion isn't exposed in `/admin`** — only create/rename/re-describe. This was a deliberate
  scope cut to avoid silently orphaning photocards/raw media; if a category truly needs removing, do it
  directly in the Supabase Table Editor after manually reassigning or deleting its media.
- **Very large source images can time out Next.js's image optimizer.** New uploads are compressed client-side
  (see above) so this shouldn't recur, but a couple of the originally-migrated PNGs predate that and were
  multi-megabyte screenshots; fetching+resizing them occasionally timed out in a slow/sandboxed dev network.
  This did not reproduce against normal networking and likely won't show up on Vercel, but if a particular
  legacy photocard loads slowly or errors in production, open it in `/admin` and re-upload it (Update →
  replace image) to pick up compression retroactively.
- **Videos aren't compressed**, only size-capped at 15MB (see above) — genuine video transcoding needs real
  encoding infrastructure (ffmpeg or similar), which is out of scope here.
- **`next.config.ts` sets `images.dangerouslyAllowLocalIP` in development only** (`NODE_ENV !== "production"`).
  Some local/sandboxed networks resolve the Supabase hostname to a NAT64-synthesized IPv6 address, which
  Next's SSRF protection mistakes for a private IP; this only relaxes that check in `next dev`, never in the
  production build.

## Project structure

```
server/                      backend code — nothing here is Next.js-route-specific
  supabase/
    schema.sql                the whole DB schema + RLS + storage bucket setup
    env.ts, client.ts, server-client.ts   Supabase client factories (browser vs. server/cookie-aware)
    storage.ts                 upload/remove/getPublicUrl helpers for the "media" bucket
  db/                         every Supabase query, one file per table (finance.ts, spendImages.ts included)
  auth.ts                     session refresh + /admin route protection, used by src/middleware.ts
  lib/{slug,imageSize}.ts     small dependency-free helpers
  scripts/
    migrate-to-supabase.ts     one-time historical import, everything (see above)
    import-raw-media.ts        one-off, raw folders only, blank name/description (see above)

src/
  middleware.ts                Next.js middleware entry point (delegates to server/auth.ts)
  app/
    (site)/                    route group for every public page — its layout.tsx renders Header/Footer
      page.tsx, about/, services/, products/, our-work/, contact/
    invoice/[id]/              public invoice view — outside every route group, no nav, no auth (see Invoices)
    admin/
      login/                   public login page
      (protected)/             everything else under /admin — layout.tsx enforces auth via middleware
        _components/           shared admin building blocks: MediaPreviewInput, PhotocardCard, RawMediaCard
                                (used by both the standalone Photocards/Raw Media pages and the per-category tabs)
        finance/                Projects/Spends bookkeeping — see "Finance Management" above
          projects/[id]/invoice/  admin invoice view + Print/WhatsApp actions
          _components/SpendImagesManager.tsx   up to 3 photos per spend, see "Spend images" above
  components/                  BannerSlider, ProductsGrid, OurWorkGrid, CategoryTiles, OrderModal, InvoiceView,
                                PrintButton, Localized, etc.
  data/
    site.ts, services.ts       static business copy/config that isn't admin-managed

public/
  images/logo.png              real Shenjar Crafts logo, shown in InvoiceView.tsx's header
  lib/
    measureImage.ts             client-side image dimension measurement used by admin upload forms
    compressImage.ts            client-side image compression (canvas re-encode) before upload
    i18n.tsx                    EN/BN language toggle context + pickLocalized helper
```

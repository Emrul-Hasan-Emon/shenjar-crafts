-- Shenjar Crafts admin panel schema
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- Safe to re-run: every statement is guarded with "if not exists" / "or replace".

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_bn text,
  banner_path text,
  description_en text,
  description_bn text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists photocards (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories (id) on delete cascade,
  image_path text not null,
  width integer,
  height integer,
  name_en text,
  name_bn text,
  description_en text,
  description_bn text,
  created_at timestamptz not null default now()
);

create table if not exists raw_media (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories (id) on delete cascade,
  kind text not null check (kind in ('image', 'video')),
  media_path text not null,
  width integer,
  height integer,
  name_en text,
  name_bn text,
  description_en text,
  description_bn text,
  created_at timestamptz not null default now()
);

-- Migration: the very first installs called the "name" columns
-- description_en/description_bn. Renaming (rather than adding new columns)
-- preserved existing photocard/raw_media data. Guarded with "not exists
-- name_en" so this never fires again once a project has already migrated —
-- otherwise it would collide with the description_en/description_bn columns
-- added further below, which are a distinct, later feature (an actual
-- description field, separate from the short name).
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'photocards' and column_name = 'description_en')
     and not exists (select 1 from information_schema.columns where table_name = 'photocards' and column_name = 'name_en') then
    alter table photocards rename column description_en to name_en;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'photocards' and column_name = 'description_bn')
     and not exists (select 1 from information_schema.columns where table_name = 'photocards' and column_name = 'name_bn') then
    alter table photocards rename column description_bn to name_bn;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'raw_media' and column_name = 'description_en')
     and not exists (select 1 from information_schema.columns where table_name = 'raw_media' and column_name = 'name_en') then
    alter table raw_media rename column description_en to name_en;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'raw_media' and column_name = 'description_bn')
     and not exists (select 1 from information_schema.columns where table_name = 'raw_media' and column_name = 'name_bn') then
    alter table raw_media rename column description_bn to name_bn;
  end if;
end $$;

-- Actual description fields (separate from the short name above) — added in
-- a later feature pass, safe to add after the rename migration regardless of
-- which state an existing install is in.
alter table photocards add column if not exists description_en text;
alter table photocards add column if not exists description_bn text;
alter table raw_media add column if not exists description_en text;
alter table raw_media add column if not exists description_bn text;

create table if not exists about_us (
  id text primary key default 'default',
  content_en text,
  content_bn text,
  updated_at timestamptz not null default now()
);

insert into about_us (id) values ('default')
  on conflict (id) do nothing;

create index if not exists photocards_category_id_idx on photocards (category_id);
create index if not exists raw_media_category_id_idx on raw_media (category_id);

-- ---------------------------------------------------------------------------
-- Finance Management
-- ---------------------------------------------------------------------------
-- Every field is nullable except category, name, and price (enforced with
-- "not null" below — this is a real database constraint, not just a UI rule).
-- For a 'project' record, price = price per quantity; for a 'spend' record,
-- price = the cost amount (spend has no quantity/customer/status concept).
--
-- total_price / total_cost_per_quantity / total_cost_all are Postgres
-- GENERATED ALWAYS columns, not application-computed values. This is
-- deliberate: this app's admin writes go straight from the browser to
-- Supabase (no server API layer in front), so any "calculate it in a
-- server/db/*.ts function" approach would still just be JavaScript running
-- in the client's browser — trusting it would make the frontend the de facto
-- source of truth for money math, which the requirement explicitly rules
-- out. A generated column is computed by Postgres itself on every
-- insert/update and cannot be supplied or overridden by any client, so it's
-- the one approach that's actually backend-enforced regardless of what
-- writes the row.
create table if not exists finance_records (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('project', 'spend')),
  category text not null,
  name text not null,
  price numeric not null,
  description text,
  quantity numeric,
  estimated_start_time date,
  estimated_delivery_time date,
  material_cost numeric,
  making_cost numeric,
  customer_name text,
  customer_gender text check (customer_gender is null or customer_gender in ('male', 'female', 'other')),
  customer_mobile text,
  customer_email text,
  customer_address text,
  status text check (status is null or status in ('pending', 'started', 'finished', 'delivered')),
  -- Missing quantity is treated as 1 unit (a single custom item, not a batch).
  total_price numeric generated always as (price * coalesce(quantity, 1)) stored,
  -- Null (not 0) when neither cost has been entered at all, so "no cost data
  -- yet" is visibly distinct from "this costs nothing to make".
  total_cost_per_quantity numeric generated always as (
    case when material_cost is null and making_cost is null then null
    else coalesce(material_cost, 0) + coalesce(making_cost, 0) end
  ) stored,
  total_cost_all numeric generated always as (
    case when material_cost is null and making_cost is null then null
    else coalesce(quantity, 1) * (coalesce(material_cost, 0) + coalesce(making_cost, 0)) end
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_records_type_idx on finance_records (type);
create index if not exists finance_records_category_idx on finance_records (category);
create index if not exists finance_records_status_idx on finance_records (status);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists finance_records_set_updated_at on finance_records;
create trigger finance_records_set_updated_at
  before update on finance_records
  for each row execute function set_updated_at();

-- Added after the initial finance_records rollout — installs that already
-- ran the block above need this added separately.
alter table finance_records add column if not exists customer_email text;

-- Narrow, secure public read for one project's customer-facing invoice
-- fields — deliberately excludes material_cost, making_cost,
-- total_cost_per_quantity, and total_cost_all. finance_records itself stays
-- authenticated-only (see RLS below); this SECURITY DEFINER function is the
-- one, tightly-scoped exception, returning only this fixed column list for a
-- single project id. Granted to anon so the public /invoice/[id] page can
-- call it without an admin login.
create or replace function get_public_invoice(p_id uuid)
returns table (
  id uuid,
  category text,
  name text,
  description text,
  quantity numeric,
  price numeric,
  total_price numeric,
  estimated_start_time date,
  estimated_delivery_time date,
  customer_name text,
  customer_gender text,
  customer_mobile text,
  customer_email text,
  customer_address text,
  status text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    id, category, name, description, quantity, price, total_price,
    estimated_start_time, estimated_delivery_time,
    customer_name, customer_gender, customer_mobile, customer_email, customer_address,
    status, created_at
  from finance_records
  where id = p_id and type = 'project';
$$;

grant execute on function get_public_invoice(uuid) to anon, authenticated;

-- Up to 3 supplementary photos per spend (receipts, materials, whatever
-- documents the spend) — enforced in server/db/spendImages.ts, not here, the
-- same way banners cap at 5. Spend images are never public — they're purely
-- internal bookkeeping detail, same access level as finance_records itself.
create table if not exists spend_images (
  id uuid primary key default gen_random_uuid(),
  finance_record_id uuid not null references finance_records (id) on delete cascade,
  image_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists spend_images_finance_record_id_idx on spend_images (finance_record_id);

-- ---------------------------------------------------------------------------
-- Craft Design: boards, materials, and a standalone bill-of-materials module
-- ---------------------------------------------------------------------------
-- Entirely separate from Finance — a Craft Design may optionally reference a
-- Project (finance_record_id) purely for "which order is this for" navigation,
-- but nothing here ever writes back into finance_records. See
-- server/craft-design/ and server/boards/ for the code that reads/writes these.
--
-- name_en/name_bn + description_en/description_bn follow the same bilingual
-- convention already used on categories/photocards/raw_media — for the
-- admin's own bilingual data entry, since this module is never public-facing.

-- Admin-managed catalogs. Exactly one row in each may be is_default = true
-- (enforced by the partial unique indexes below) — the fallback a part uses
-- when it doesn't override color/thickness itself.
create table if not exists board_colors (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_bn text,
  description_en text,
  description_bn text,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists board_thicknesses (
  id uuid primary key default gen_random_uuid(),
  value_mm numeric not null,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists board_colors_default_idx on board_colors (is_default) where is_default;
create unique index if not exists board_thicknesses_default_idx on board_thicknesses (is_default) where is_default;

-- A board = one specific color+thickness combination — by explicit design,
-- there is only ever one board per combo, so no separate board "type/name"
-- table is needed; color+thickness alone identify which priced board applies.
create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  name_en text,
  name_bn text,
  description_en text,
  description_bn text,
  color_id uuid not null references board_colors (id),
  thickness_id uuid not null references board_thicknesses (id),
  sheet_length_inches numeric not null default 0,
  sheet_length_shuta numeric not null default 0,
  sheet_width_inches numeric not null default 0,
  sheet_width_shuta numeric not null default 0,
  price_per_sheet numeric not null,
  wastage_percent numeric not null default 10,
  created_at timestamptz not null default now(),
  unique (color_id, thickness_id)
);

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_bn text,
  description_en text,
  description_bn text,
  unit text not null default 'piece',
  unit_price numeric not null,
  created_at timestamptz not null default now()
);

-- Admin-managed catalog of measurement labels (side, top, bottom, front, back,
-- and anything added later) — a real table with its own admin CRUD screen,
-- not a fixed list.
create table if not exists measurement_label (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_bn text,
  description_en text,
  description_bn text,
  default_quantity integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- The dimension fields a measurement label needs — a variable-length list per
-- label (2 for depth+length, 3 for length+width+depth, etc). Which of these
-- count toward the board-area calculation is chosen per part instance below,
-- not baked into the label itself.
create table if not exists measurement_label_dimensions (
  id uuid primary key default gen_random_uuid(),
  measurement_label_id uuid not null references measurement_label (id) on delete cascade,
  label_en text not null,
  label_bn text,
  description_en text,
  description_bn text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists measurement_label_dimensions_label_id_idx on measurement_label_dimensions (measurement_label_id);

-- Standalone module root. finance_record_id is a nullable *reference only* —
-- never involved in any cost sync. quantity = how many complete units of this
-- whole design are being built (distinct from a part's own quantity, e.g.
-- Side's left+right count).
create table if not exists crafts_designs (
  id uuid primary key default gen_random_uuid(),
  finance_record_id uuid references finance_records (id) on delete set null,
  name_en text not null,
  name_bn text,
  description_en text,
  description_bn text,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists crafts_designs_set_updated_at on crafts_designs;
create trigger crafts_designs_set_updated_at
  before update on crafts_designs
  for each row execute function set_updated_at();

-- One row per measurement label included in this design. color_id/thickness_id
-- are per-part *overrides*; null means "use whichever catalog row is marked
-- is_default".
create table if not exists craft_design_measurement_label (
  id uuid primary key default gen_random_uuid(),
  crafts_design_id uuid not null references crafts_designs (id) on delete cascade,
  measurement_label_id uuid not null references measurement_label (id),
  color_id uuid references board_colors (id),
  thickness_id uuid references board_thicknesses (id),
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  unique (crafts_design_id, measurement_label_id)
);

-- The actual measurement values — one row per dimension field the label
-- defines. counts_toward_area is set here, per instance: both true when there
-- are only 2 dimensions; admin picks exactly 2 to flag true when there are 3+.
create table if not exists craft_design_measurement_label_dimensions (
  id uuid primary key default gen_random_uuid(),
  craft_design_measurement_label_id uuid not null references craft_design_measurement_label (id) on delete cascade,
  measurement_label_dimension_id uuid not null references measurement_label_dimensions (id),
  value_inches numeric not null default 0,
  value_shuta numeric not null default 0,
  counts_toward_area boolean not null default true,
  created_at timestamptz not null default now(),
  unique (craft_design_measurement_label_id, measurement_label_dimension_id)
);

create table if not exists craft_design_materials (
  id uuid primary key default gen_random_uuid(),
  crafts_design_id uuid not null references crafts_designs (id) on delete cascade,
  material_id uuid not null references materials (id),
  quantity numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists craft_design_measurement_label_design_id_idx on craft_design_measurement_label (crafts_design_id);
create index if not exists craft_design_measurement_label_dimensions_part_id_idx on craft_design_measurement_label_dimensions (craft_design_measurement_label_id);
create index if not exists craft_design_materials_design_id_idx on craft_design_materials (crafts_design_id);

-- ---------------------------------------------------------------------------
-- Partner Management
-- ---------------------------------------------------------------------------
-- Partners are a second class of Supabase Auth user (alongside the single
-- admin account) with their own login and their own scoped view of Projects.
-- See docs/partner-management-plan.md for the full design rationale. This
-- block must run before the RLS section below, since several of those
-- policies call is_admin().

-- Distinguishes "the admin" from "a partner" — Supabase doesn't expose a
-- clean role flag on auth.users, so this is a small seed table instead.
-- Auto-seeded with every auth user that exists at migration time (today
-- that's exactly the one admin account), so running this migration never
-- locks the admin out of their own data. Any user created after this point
-- (i.e. every partner) is deliberately left out.
create table if not exists app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

insert into app_admins (user_id)
  select id from auth.users
  on conflict (user_id) do nothing;

-- security definer is required: is_admin() is the gate every other RLS
-- policy in this file calls, so it must be able to read app_admins
-- regardless of the caller's own privileges — otherwise a non-admin (or
-- app_admins having RLS enabled with no policy of its own, which silently
-- hides every row rather than erroring) makes is_admin() false for
-- everyone, including real admins. search_path is pinned for safety, same
-- as get_public_invoice.
create or replace function is_admin() returns boolean as $$
  select exists (select 1 from app_admins where user_id = auth.uid());
$$ language sql stable security definer set search_path = public;

-- Locked down now that is_admin() no longer depends on this being directly
-- readable — only admins can see or manage the admin list itself.
alter table app_admins enable row level security;
drop policy if exists "admin manage app_admins" on app_admins;
create policy "admin manage app_admins" on app_admins for all
  using (is_admin()) with check (is_admin());

-- Partner profile only. The partner code, commission/discount configuration,
-- and cached stats live in partner_configs below — kept separate so that
-- editing a partner's profile never touches their financial configuration.
create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  mobile text not null,
  email text,
  organization_name text,
  institution text,
  facebook_link text,
  linkedin_link text,
  profile_picture_path text,
  is_active boolean not null default true,
  is_default boolean not null default true,
  created_by uuid,
  creator_name text,
  updated_by uuid,
  updater_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partners_org_or_institution check (organization_name is not null or institution is not null)
);

drop trigger if exists partners_set_updated_at on partners;
create trigger partners_set_updated_at
  before update on partners
  for each row execute function set_updated_at();

-- Partners log in by mobile, not email (email is optional contact info only
-- — see server/partners/authEmail.ts for how a mobile number maps to the
-- Supabase Auth account behind it). Mobile must therefore be unique.
create unique index if not exists partners_mobile_idx on partners (mobile);

-- One row per partner: the unique partner code, the *current* commission/
-- discount configuration, and cached order/commission counters (kept in sync
-- by the finance_records triggers below, not computed live on every read).
-- Changing a partner's rate here only affects future orders — a Project
-- already created keeps whatever finance_records recorded for it at the time
-- (see the snapshot trigger below).
create table if not exists partner_configs (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null unique references partners (id) on delete cascade,
  code text not null unique,
  commission numeric not null default 0 check (commission >= 0),
  commission_type text not null default 'fixed' check (commission_type in ('fixed', 'percentage')),
  discount numeric not null default 0 check (discount >= 0),
  discount_type text not null default 'fixed' check (discount_type in ('fixed', 'percentage')),
  total_orders integer not null default 0,
  total_delivered_orders integer not null default 0,
  total_commission numeric not null default 0,
  total_discount numeric not null default 0,
  updated_by uuid,
  updater_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists partner_configs_set_updated_at on partner_configs;
create trigger partner_configs_set_updated_at
  before update on partner_configs
  for each row execute function set_updated_at();

-- Creates the partners row and its partner_configs row together, in one
-- transaction — a partner should never exist without its config (the code
-- and commission/discount rate), so this is the only way the app creates
-- one. security invoker (not definer): runs as the calling admin, so RLS on
-- both tables still applies — this only guarantees atomicity.
create or replace function create_partner(
  p_user_id uuid,
  p_code text,
  p_name text,
  p_mobile text,
  p_email text,
  p_organization_name text,
  p_institution text,
  p_facebook_link text,
  p_linkedin_link text,
  p_profile_picture_path text,
  p_is_active boolean,
  p_is_default boolean,
  p_commission numeric,
  p_commission_type text,
  p_discount numeric,
  p_discount_type text,
  p_created_by uuid,
  p_creator_name text
) returns partners
language plpgsql
security invoker
as $$
declare
  new_partner partners;
begin
  insert into partners (
    user_id, name, mobile, email, organization_name, institution,
    facebook_link, linkedin_link, profile_picture_path, is_active, is_default,
    created_by, creator_name, updated_by, updater_name
  ) values (
    p_user_id, p_name, p_mobile, p_email, p_organization_name, p_institution,
    p_facebook_link, p_linkedin_link, p_profile_picture_path, p_is_active, p_is_default,
    p_created_by, p_creator_name, p_created_by, p_creator_name
  )
  returning * into new_partner;

  insert into partner_configs (
    partner_id, code, commission, commission_type, discount, discount_type,
    updated_by, updater_name
  ) values (
    new_partner.id, p_code, p_commission, p_commission_type, p_discount, p_discount_type,
    p_created_by, p_creator_name
  );

  return new_partner;
end;
$$;

-- Partner fields on finance_records (Projects). There is no separate
-- "commission log" table — a Project has a 1:1 relationship with its own
-- commission/discount outcome, so that data lives directly on the row.
-- total_price already exists (= "total amount before discount"). The three
-- amount columns below are new and GENERATED ALWAYS — same principle as
-- total_price itself: no client, however it connects, can supply or
-- override them. commission_rate/commission_type/discount_rate/discount_type
-- are a point-in-time snapshot, populated by the trigger below from
-- partner_configs — never taken from client input — so nothing the browser
-- sends can fabricate a more favorable rate for itself.
alter table finance_records add column if not exists partner_id uuid references partners (id);
alter table finance_records add column if not exists partner_code text;
alter table finance_records add column if not exists commission_rate numeric;
alter table finance_records add column if not exists commission_type text check (commission_type is null or commission_type in ('fixed', 'percentage'));
alter table finance_records add column if not exists discount_rate numeric;
alter table finance_records add column if not exists discount_type text check (discount_type is null or discount_type in ('fixed', 'percentage'));

-- Postgres forbids a generated column's expression from referencing another
-- generated column (including total_price), so these re-state
-- "price * coalesce(quantity, 1)" inline rather than referencing total_price
-- — it's the same value, just written out because the shortcut isn't legal.
alter table finance_records add column if not exists discount_amount numeric generated always as (
  case
    when discount_type = 'fixed' then coalesce(discount_rate, 0)
    when discount_type = 'percentage' then (price * coalesce(quantity, 1)) * coalesce(discount_rate, 0) / 100
    else 0
  end
) stored;

alter table finance_records add column if not exists commission_amount numeric generated always as (
  case
    when commission_type = 'fixed' then coalesce(commission_rate, 0)
    when commission_type = 'percentage' then (price * coalesce(quantity, 1)) * coalesce(commission_rate, 0) / 100
    else 0
  end
) stored;

-- The customer-facing final amount, after the partner discount. total_price
-- itself stays exactly what it always was ("total amount before discount").
alter table finance_records add column if not exists total_amount numeric generated always as (
  (price * coalesce(quantity, 1)) - (
    case
      when discount_type = 'fixed' then coalesce(discount_rate, 0)
      when discount_type = 'percentage' then (price * coalesce(quantity, 1)) * coalesce(discount_rate, 0) / 100
      else 0
    end
  )
) stored;

-- 'pending' until the Project is delivered ('earned'); 'unearned' is
-- reserved for a future cancelled-type status — finance_records.status has
-- no such value today, so that branch is currently unreachable in practice.
alter table finance_records add column if not exists commission_status text not null default 'pending'
  check (commission_status in ('pending', 'earned', 'unearned'));

create index if not exists finance_records_partner_id_idx on finance_records (partner_id);

create or replace function finance_records_apply_partner_snapshot() returns trigger as $$
begin
  if new.partner_id is not null then
    select pc.code, pc.commission, pc.commission_type, pc.discount, pc.discount_type
      into new.partner_code, new.commission_rate, new.commission_type, new.discount_rate, new.discount_type
      from partner_configs pc
      where pc.partner_id = new.partner_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists finance_records_apply_partner_snapshot on finance_records;
create trigger finance_records_apply_partner_snapshot
  before insert on finance_records
  for each row execute function finance_records_apply_partner_snapshot();

-- Derives commission_status from the Project's own status, every time it's
-- set. Runs before finance_records_apply_partner_snapshot in trigger-name
-- order, but that's fine — this only reads new.status, not anything the
-- snapshot trigger sets.
create or replace function finance_records_set_commission_status() returns trigger as $$
begin
  new.commission_status := case
    when new.status = 'delivered' then 'earned'
    when new.status is null or new.status in ('pending', 'started', 'finished') then 'pending'
    else 'unearned'
  end;
  return new;
end;
$$ language plpgsql;

drop trigger if exists finance_records_set_commission_status on finance_records;
create trigger finance_records_set_commission_status
  before insert or update of status on finance_records
  for each row execute function finance_records_set_commission_status();

-- Keeps partner_configs' cached counters in sync so the partner/admin
-- dashboards read plain columns instead of re-aggregating finance_records on
-- every page load. total_orders updates once, at creation, regardless of
-- eventual delivery outcome — it's a count of referrals, not earnings.
-- total_delivered_orders/total_commission/total_discount all move together,
-- only when commission_status actually transitions into or out of 'earned':
-- a partner's commission is only earned, and the customer's discount only
-- "counts," once the Project is actually delivered.
--
-- security definer is required here, not optional: a partner has no update
-- policy on partner_configs (only admin does, and a partner may only select
-- their own row) — a trigger runs with the privileges of whoever performed
-- the triggering statement unless marked security definer, so without this,
-- a partner creating their own order would silently fail to update their
-- own counters (the UPDATE below would match zero rows under their RLS
-- context, no error, just a no-op). This is the same narrow, deliberate
-- exception as get_public_invoice — the target row is fully determined by
-- new.partner_id, which finance_records' own RLS already constrains, so
-- this doesn't open any new write path.
create or replace function finance_records_sync_partner_stats() returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if new.partner_id is not null then
      update partner_configs
        set total_orders = total_orders + 1,
            total_delivered_orders = total_delivered_orders + (case when new.commission_status = 'earned' then 1 else 0 end),
            total_commission = total_commission + (case when new.commission_status = 'earned' then coalesce(new.commission_amount, 0) else 0 end),
            total_discount = total_discount + (case when new.commission_status = 'earned' then coalesce(new.discount_amount, 0) else 0 end)
        where partner_id = new.partner_id;
    end if;
    return new;
  end if;

  if TG_OP = 'UPDATE' and new.partner_id is not null and new.commission_status is distinct from old.commission_status then
    if new.commission_status = 'earned' then
      update partner_configs
        set total_delivered_orders = total_delivered_orders + 1,
            total_commission = total_commission + coalesce(new.commission_amount, 0),
            total_discount = total_discount + coalesce(new.discount_amount, 0)
        where partner_id = new.partner_id;
    elsif old.commission_status = 'earned' then
      update partner_configs
        set total_delivered_orders = greatest(total_delivered_orders - 1, 0),
            total_commission = greatest(total_commission - coalesce(new.commission_amount, 0), 0),
            total_discount = greatest(total_discount - coalesce(new.discount_amount, 0), 0)
        where partner_id = new.partner_id;
    end if;
    return new;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists finance_records_sync_partner_stats on finance_records;
create trigger finance_records_sync_partner_stats
  after insert or update on finance_records
  for each row execute function finance_records_sync_partner_stats();

-- ---------------------------------------------------------------------------
-- Row Level Security: anyone can read, only an authenticated user can write
-- ---------------------------------------------------------------------------

alter table categories enable row level security;
alter table banners enable row level security;
alter table photocards enable row level security;
alter table raw_media enable row level security;
alter table about_us enable row level security;

drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories for select using (true);
drop policy if exists "authenticated write categories" on categories;
create policy "authenticated write categories" on categories for all
  using (is_admin()) with check (is_admin());

drop policy if exists "public read banners" on banners;
create policy "public read banners" on banners for select using (true);
drop policy if exists "authenticated write banners" on banners;
create policy "authenticated write banners" on banners for all
  using (is_admin()) with check (is_admin());

drop policy if exists "public read photocards" on photocards;
create policy "public read photocards" on photocards for select using (true);
drop policy if exists "authenticated write photocards" on photocards;
create policy "authenticated write photocards" on photocards for all
  using (is_admin()) with check (is_admin());

drop policy if exists "public read raw_media" on raw_media;
create policy "public read raw_media" on raw_media for select using (true);
drop policy if exists "authenticated write raw_media" on raw_media;
create policy "authenticated write raw_media" on raw_media for all
  using (is_admin()) with check (is_admin());

drop policy if exists "public read about_us" on about_us;
create policy "public read about_us" on about_us for select using (true);
drop policy if exists "authenticated write about_us" on about_us;
create policy "authenticated write about_us" on about_us for all
  using (is_admin()) with check (is_admin());

-- Finance data is sensitive business/customer data, not site content — unlike
-- every table above, it is NOT publicly readable. Only an authenticated
-- admin session can read or write it at all.
alter table finance_records enable row level security;
drop policy if exists "authenticated read finance_records" on finance_records;
drop policy if exists "admin read finance_records" on finance_records;
create policy "admin read finance_records" on finance_records for select
  using (is_admin());
drop policy if exists "authenticated write finance_records" on finance_records;
drop policy if exists "admin write finance_records" on finance_records;
create policy "admin write finance_records" on finance_records for all
  using (is_admin()) with check (is_admin());

-- A partner may read their own Projects (direct or created on their behalf
-- by admin — both cases set partner_id the same way) but never anyone
-- else's, and never a 'spend' row (spends aren't partner-visible at all).
drop policy if exists "partner read own finance_records" on finance_records;
create policy "partner read own finance_records" on finance_records for select
  using (
    type = 'project'
    and exists (select 1 from partners p where p.id = finance_records.partner_id and p.user_id = auth.uid())
  );

-- A partner may create a Project for themselves only — partner_id is
-- resolved from their own session, never trusted from the request payload
-- beyond this check. status must start null/unset: a partner declaring
-- their own order "delivered" at creation would instantly (and illegitimately)
-- credit themselves commission — that transition stays admin-only. No
-- partner update/delete at all beyond this insert.
drop policy if exists "partner insert own finance_records" on finance_records;
create policy "partner insert own finance_records" on finance_records for insert
  with check (
    type = 'project'
    and status is null
    and exists (select 1 from partners p where p.id = finance_records.partner_id and p.user_id = auth.uid() and p.is_active)
  );

alter table spend_images enable row level security;
drop policy if exists "authenticated read spend_images" on spend_images;
drop policy if exists "admin read spend_images" on spend_images;
create policy "admin read spend_images" on spend_images for select
  using (is_admin());
drop policy if exists "authenticated write spend_images" on spend_images;
drop policy if exists "admin write spend_images" on spend_images;
create policy "admin write spend_images" on spend_images for all
  using (is_admin()) with check (is_admin());

-- Craft Design module — internal cost/pricing data, never public, same
-- authenticated-only posture as finance_records/spend_images throughout.
do $$
declare
  t text;
begin
  foreach t in array array[
    'board_colors', 'board_thicknesses', 'boards', 'materials',
    'measurement_label', 'measurement_label_dimensions',
    'crafts_designs', 'craft_design_measurement_label',
    'craft_design_measurement_label_dimensions', 'craft_design_materials'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', 'authenticated read ' || t, t);
    execute format('drop policy if exists %I on %I', 'admin read ' || t, t);
    execute format(
      'create policy %I on %I for select using (is_admin())',
      'admin read ' || t, t
    );
    execute format('drop policy if exists %I on %I', 'authenticated write ' || t, t);
    execute format('drop policy if exists %I on %I', 'admin write ' || t, t);
    execute format(
      'create policy %I on %I for all using (is_admin()) with check (is_admin())',
      'admin write ' || t, t
    );
  end loop;
end $$;

-- Partner Management RLS: profile is admin-managed, but a partner may always
-- read their own row (never anyone else's, never write it in v1 — self-edit
-- isn't part of this feature yet).
alter table partners enable row level security;
drop policy if exists "admin all partners" on partners;
create policy "admin all partners" on partners for all
  using (is_admin()) with check (is_admin());
drop policy if exists "partner read own row" on partners;
create policy "partner read own row" on partners for select
  using (user_id = auth.uid());

alter table partner_configs enable row level security;
drop policy if exists "admin all partner_configs" on partner_configs;
create policy "admin all partner_configs" on partner_configs for all
  using (is_admin()) with check (is_admin());
drop policy if exists "partner read own config" on partner_configs;
create policy "partner read own config" on partner_configs for select
  using (exists (select 1 from partners p where p.id = partner_configs.partner_id and p.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage: one public bucket, same read/write split
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
  values ('media', 'media', true)
  on conflict (id) do nothing;

drop policy if exists "public read media bucket" on storage.objects;
create policy "public read media bucket" on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "authenticated write media bucket" on storage.objects;
drop policy if exists "admin write media bucket" on storage.objects;
create policy "admin write media bucket" on storage.objects for insert
  with check (bucket_id = 'media' and is_admin());

drop policy if exists "authenticated update media bucket" on storage.objects;
drop policy if exists "admin update media bucket" on storage.objects;
create policy "admin update media bucket" on storage.objects for update
  using (bucket_id = 'media' and is_admin());

drop policy if exists "authenticated delete media bucket" on storage.objects;
drop policy if exists "admin delete media bucket" on storage.objects;
create policy "admin delete media bucket" on storage.objects for delete
  using (bucket_id = 'media' and is_admin());

-- ---------------------------------------------------------------------------
-- Craft Design calculation views — the database, not the app, does this math
-- ---------------------------------------------------------------------------
-- Same principle as finance_records.total_price (a GENERATED ALWAYS column):
-- nothing here is computed by the browser. This needs a chain of views rather
-- than a single generated column because it aggregates *across* rows (pooling
-- every part that resolves to the same board before dividing into sheets).
--
-- security_invoker = true matters here: Postgres views default to running
-- with the *owner's* rights, which would silently bypass RLS on the base
-- tables — this makes the view respect the querying user's own permissions
-- instead. 1 inch = 8 shuta throughout.

-- Resolve each part to its board (color/thickness override, or whichever
-- catalog row is is_default) and its per-unit area in shuta². Postgres has no
-- PRODUCT() aggregate, so the area uses the standard exp(sum(ln(x))) trick to
-- fold however many dimensions are flagged counts_toward_area into one
-- product (all physical measurements are positive, so ln() is always
-- defined).
create or replace view craft_design_part_resolved with (security_invoker = true) as
select
  cdml.id as craft_design_measurement_label_id,
  cdml.crafts_design_id,
  cdml.quantity,
  b.id as board_id,
  b.wastage_percent,
  b.price_per_sheet,
  (b.sheet_length_inches * 8 + b.sheet_length_shuta) *
  (b.sheet_width_inches * 8 + b.sheet_width_shuta) as sheet_area_shuta2,
  (
    select exp(sum(ln(d.value_inches * 8 + d.value_shuta)))
    from craft_design_measurement_label_dimensions d
    where d.craft_design_measurement_label_id = cdml.id
      and d.counts_toward_area
  ) as unit_area_shuta2
from craft_design_measurement_label cdml
join board_colors dc on dc.is_default
join board_thicknesses dt on dt.is_default
join boards b
  on b.color_id = coalesce(cdml.color_id, dc.id)
 and b.thickness_id = coalesce(cdml.thickness_id, dt.id);

-- Pool every part resolving to the same board: total area (+ wastage) →
-- sheets → cost. The design's own quantity multiplies in *before* the ceil()
-- rounding — building N units' worth of area and rounding once uses sheets
-- far more efficiently than rounding per-unit and then multiplying by N.
create or replace view craft_design_board_costs with (security_invoker = true) as
select
  r.crafts_design_id,
  r.board_id,
  sum(r.unit_area_shuta2 * r.quantity) * cd.quantity as total_area_shuta2,
  ceil(
    sum(r.unit_area_shuta2 * r.quantity) * cd.quantity
    * (1 + r.wastage_percent / 100.0) / r.sheet_area_shuta2
  ) as sheets_needed,
  ceil(
    sum(r.unit_area_shuta2 * r.quantity) * cd.quantity
    * (1 + r.wastage_percent / 100.0) / r.sheet_area_shuta2
  ) * r.price_per_sheet as board_cost
from craft_design_part_resolved r
join crafts_designs cd on cd.id = r.crafts_design_id
group by r.crafts_design_id, cd.quantity, r.board_id, r.wastage_percent, r.price_per_sheet, r.sheet_area_shuta2;

-- Materials: a simple sum, scaled by the design's own quantity.
create or replace view craft_design_material_costs with (security_invoker = true) as
select
  cdm.crafts_design_id,
  sum(cdm.quantity * m.unit_price) * cd.quantity as material_cost
from craft_design_materials cdm
join materials m on m.id = cdm.material_id
join crafts_designs cd on cd.id = cdm.crafts_design_id
group by cdm.crafts_design_id, cd.quantity;

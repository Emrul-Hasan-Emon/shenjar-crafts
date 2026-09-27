-- Product pricing for the existing photocards table.
-- Run in Supabase SQL Editor when an environment needs product prices.
-- Safe to re-run.
--
-- Notes:
-- - The table intentionally remains named `photocards`.
-- - Existing rows keep NULL prices.
-- - `price` is optional in the Admin UI and existing rows can keep it NULL.
-- - `discounted_price` is optional, but cannot exceed `price` when both are set.
--
-- If this raises "public.photocards does not exist", run server/supabase/schema.sql
-- on that Supabase project first, or confirm you are in the correct Supabase project.

do $$
begin
  if to_regclass('public.photocards') is null then
    raise exception 'public.photocards does not exist. Run server/supabase/schema.sql first, or check that you are connected to the correct Supabase project.';
  end if;
end $$;

alter table public.photocards add column if not exists price numeric;
alter table public.photocards add column if not exists discounted_price numeric;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'photocards_discounted_price_lte_price'
      and conrelid = 'public.photocards'::regclass
  ) then
    alter table public.photocards
      add constraint photocards_discounted_price_lte_price
      check (discounted_price is null or price is null or discounted_price <= price);
  end if;
end $$;

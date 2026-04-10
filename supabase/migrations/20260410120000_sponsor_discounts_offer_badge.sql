-- App expects sponsor_discounts.offer_badge (parent discounts + admin UI).
-- Safe if column already exists (e.g. fresh schema.sql apply).
alter table public.sponsor_discounts
  add column if not exists offer_badge text;

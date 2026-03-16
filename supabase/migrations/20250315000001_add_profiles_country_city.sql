-- Add optional location columns to profiles for parent accounts (if missing).
-- Matches schema.sql: country_name, city_name on public.profiles.

alter table if exists public.profiles
  add column if not exists country_name text;

alter table if exists public.profiles
  add column if not exists city_name text;

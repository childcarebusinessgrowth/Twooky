# Apply provider_profiles location columns

The app expects `country_id` and `city_id` on `provider_profiles`. If you see:

**"Could not find the 'city_id' column of 'provider_profiles' in the schema cache"**

then this migration has not been applied to your Supabase database.

## Option 1: Supabase Dashboard (recommended if not using CLI)

1. Open your project in [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor**.
3. Paste and run this SQL:

```sql
-- Add location FKs to provider_profiles for provider signup (country/city from locations).
-- city text is kept for display; country_id and city_id link to locations directory.

alter table if exists public.provider_profiles
  add column if not exists country_id uuid references public.countries(id) on delete restrict;

alter table if exists public.provider_profiles
  add column if not exists city_id uuid references public.cities(id) on delete restrict;
```

4. Click **Run**. After it succeeds, provider signup with country/city will work.

## Option 2: Supabase CLI (if project is linked)

From the project root:

```bash
supabase link   # if not already linked
supabase db push
```

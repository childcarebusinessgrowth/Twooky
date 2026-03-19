# Apply Early Learning Excellence Badge Migration

The `early_learning_excellence_badge` column does not exist in your database yet. Apply it manually:

## Option 1: Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and open your project
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Paste and run this SQL:

```sql
-- Add early_learning_excellence_badge to provider_profiles for admin-assignable excellence recognition.
alter table if exists public.provider_profiles
  add column if not exists early_learning_excellence_badge boolean not null default false;

comment on column public.provider_profiles.early_learning_excellence_badge is
  'Admin-assigned badge indicating Early Learning Excellence. Displayed on provider cards and detail pages.';
```

5. Click **Run** (or press Ctrl+Enter)

## Option 2: Supabase CLI (if linked)

If your project is linked to Supabase CLI:

```bash
npx supabase db push
```

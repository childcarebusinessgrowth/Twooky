# Twooky — Early Learning Directory

Twooky is a **childcare / early-learning directory** built with Next.js. It helps **parents** search and compare providers (daycare, nursery, preschool, tutoring, camps, etc.), read reviews, and contact providers. It also provides **provider tools** (dashboard, inquiries, subscription billing) and **admin tooling** (directory management, listing imports, content management).

---

## What this app includes (high level)

- **Public directory**
  - Homepage with featured providers, popular locations, and blog highlights.
  - Search experience for providers and programs.
  - Location pages and program/category pages (e.g. nurseries, preschools, tutoring, holiday camps).
  - Provider profile pages (`/providers/[slug]`) with photos, reviews, and inquiry actions.
  - Public blog (`/blogs`) and provider microsite blog routes.
- **Parent experience**
  - Auth (signup/login, password reset).
  - Dashboard flows: saved providers, reviews, inquiries, comparisons, and “decision support” content.
- **Provider experience**
  - Provider signup + onboarding (creates `provider_profiles`).
  - Provider dashboard: manage listing, photos, inquiries, reviews, availability, analytics.
  - **Paid subscriptions** with Stripe (plans like `sprout`, `grow`, `thrive`) and access gating for features.
  - Provider site/microsite tooling (website builder pages under `/dashboard/provider/website/...`).
- **Admin experience**
  - Admin dashboard pages under `/admin/...` for managing listings, imports, reviews, content, features, and more.
  - Listing import endpoints (CSV/XLSX templates + import routes).
- **Operational endpoints**
  - Health/readiness endpoint (`GET /api/health`) that checks required environment variables.
  - Protected cron endpoint for Google Places refresh (`GET /api/cron/google-place-refresh`).
  - XML sitemaps (multiple sitemap routes under `/sitemap.xml` and `/sitemaps/...`).

---

## Tech stack

- **Framework**: Next.js `16.x` (App Router)
- **Language**: TypeScript
- **UI**:
  - React `19.x`
  - Tailwind CSS `4.x`
  - shadcn/ui + Radix UI primitives
  - `react-hook-form` + `zod` (validation)
  - `recharts` (charts/analytics UI)
  - TipTap (rich text editing where used)
- **Database / Auth**: Supabase (Postgres + Auth; typed DB via `lib/supabaseDatabase.ts`)
- **Payments**: Stripe (Checkout, Customer Portal, webhook-driven subscription sync)
- **Email**: Resend (transactional email, e.g. password reset + inquiry notifications)
- **Maps / Places**: Google Maps JavaScript API + Places/Geocoding (server + client keys)
- **Observability**: Vercel Analytics + Speed Insights (consent-gated)
- **Testing**: Vitest
- **Package manager**: `pnpm` (see `package.json`)
- **Runtime**: Node.js `20+`

---

## External API connections / integrations

This app talks to several external services:

- **Supabase**
  - Auth: user creation, login sessions, password recovery flows.
  - Postgres: all directory data, profiles, inquiries, reviews, billing state, etc.
  - Storage: provider photos and other assets (Next `remotePatterns` allow `*.supabase.co/storage/...`).
- **Stripe**
  - Checkout sessions for provider subscriptions (`POST /api/billing/checkout`).
  - Billing portal sessions (`POST /api/billing/portal`).
  - Webhook verification + event handling (`POST /api/billing/webhook`).
  - Subscription state is **synced from webhooks** (not from the success redirect).
- **Google Maps / Places / Geocoding**
  - Client-side map loading via `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
  - Server-side place enrichment + caching refresh (cron job).
- **Resend**
  - Password reset email delivery.
  - Provider inquiry notification emails and other transactional messages.
- **Vercel platform features**
  - Analytics + Speed Insights (enabled when deployed on Vercel; shown only after cookie consent).
  - Cron execution for the Google Places refresh endpoint (recommended in production).

---

## Internal API routes (selected)

The repo contains many API routes in `app/api/**`. A few notable ones:

- **Auth**
  - `POST /api/auth/signup` — creates Supabase auth user + initializes `profiles`, and role-specific tables (parent/provider).
  - `POST /api/auth/forgot-password` — generates recovery link + sends password reset email.
  - `POST /api/auth/signout` — signs out (client/server session handling).
  - `GET /api/auth/role` — role resolution for current user.
- **Billing (Stripe subscriptions)**
  - `POST /api/billing/checkout` — creates Stripe Checkout session for provider plan purchase.
  - `POST /api/billing/portal` — opens Stripe Customer Portal.
  - `POST /api/billing/webhook` — verifies signature, dedupes events, syncs subscription → DB via RPC.
- **Inquiries**
  - `POST /api/inquiries` — parent creates inquiry; triggers provider notifications + email.
  - `GET/POST /api/inquiries/[id]/messages` — inquiry messaging (see route tree).
  - Guest inquiry flows under `/api/guest-inquiries/...`.
- **Search / directory**
  - `GET /api/search/options` — search option payloads used by the UI.
  - Provider-facing global search under `GET /api/provider/search` (gated by plan).
- **Operational**
  - `GET /api/health` — readiness check for required env vars.
  - `GET /api/health/supabase` — deeper Supabase diagnostics route.
  - `GET /api/cron/google-place-refresh` — protected cron refresh for stale Google cache.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill values.

### Required (core)

- **Supabase**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (preferred) or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- **Site**
  - `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000` locally)
  - `NEXT_PUBLIC_SITE_ROOT_DOMAIN` (apex domain used for microsites/subdomain rewrites)
- **Email**
  - `RESEND_API_KEY`
- **Cron**
  - `CRON_SECRET` (Bearer secret for `/api/cron/google-place-refresh`)

### Recommended (features)

- **Google Maps**
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client)
  - `GOOGLE_MAPS_API_KEY` (server)
- **Stripe**
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_GROW_MONTHLY`
  - `STRIPE_PRICE_GROW_YEARLY`
  - `STRIPE_PRICE_THRIVE_MONTHLY`
  - `STRIPE_PRICE_THRIVE_YEARLY`
  - `STRIPE_PRICE_GROW_MONTHLY_GBP`
  - `STRIPE_PRICE_GROW_YEARLY_GBP`
  - `STRIPE_PRICE_THRIVE_MONTHLY_GBP`
  - `STRIPE_PRICE_THRIVE_YEARLY_GBP`
  - `STRIPE_BILLING_PORTAL_RETURN_URL` (optional)
- **Feature flags / diagnostics**
  - `NEXT_PUBLIC_PROVIDER_WEBSITE_BUILDER_ENABLED` (optional)
  - `APP_PERF_LOGS=1` (optional)
  - `ANALYZE=true` (optional bundle analyzer)

See `docs/vercel-go-live.md` for a production checklist and required envs.

---

## Local development

### Prerequisites

- Node `20+`
- `pnpm` (repo uses `pnpm@10.x`)
- A Supabase project (local or hosted)
- (Optional but recommended) Stripe CLI for local webhook testing

### Install

```bash
pnpm install
```

### Run dev server

```bash
pnpm dev
```

### Lint, typecheck, test, build

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

---

## Supabase setup notes

- The app uses both:
  - a **browser/server session client** (publishable key) for user-facing flows, and
  - a **server-only admin client** (service role key) for admin actions, background work, and webhook processing.
- Database schema is managed with SQL migrations in `supabase/migrations/`.

If you’re deploying, ensure migrations are applied to your production project before switching traffic.

---

## Stripe billing setup (provider subscriptions)

Stripe is already wired in; to enable end-to-end billing:

- Create Stripe products/prices for the paid plans and set the `STRIPE_PRICE_*` env vars.
- If you support the UK market, add matching GBP Stripe price IDs for Grow and Thrive.
- Add Stripe API keys and webhook secret to env.
- Configure a webhook endpoint at `POST /api/billing/webhook` and subscribe to the events listed in `docs/stripe-setup.md`.
- Enable Stripe Customer Portal.

Docs:
- `docs/stripe-setup.md`
- `docs/stripe-verification.md`

Important: subscription state (and provider plan assignment) is driven by **webhooks**.

---

## Cron (Google Places refresh)

- Endpoint: `GET /api/cron/google-place-refresh`
- Auth: requires `Authorization: Bearer <CRON_SECRET>`
- Purpose: refreshes stale cached Google reviews/place data for active providers (rate-limited by batch size).

In production, run it on a schedule via Vercel Cron (recommended).

---

## Security & platform notes

- **Content Security Policy** and other security headers are configured in `next.config.mjs`.
- Many server routes enforce:
  - **trusted origin** checks (including microsite root subdomains where applicable)
  - basic **rate limits** for abuse protection
- Health endpoint returns `503` until required env vars are configured.

---

## Repo landmarks

- `app/` — Next.js App Router pages + route handlers
- `app/api/` — server endpoints (auth, billing, directory operations)
- `lib/` — Supabase, Stripe, pricing/entitlements, emails, search, maps enrichment utilities
- `supabase/migrations/` — database schema migrations
- `docs/` — operational guides (Stripe setup, verification, Vercel go-live checklist)


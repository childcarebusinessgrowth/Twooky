# Vercel Go-Live Checklist

## Platform baseline

- Hosting: Vercel
- Framework preset: Next.js
- Package manager: `pnpm`
- Node version: `20+`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`

## Required environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL used by server and client clients. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Yes | Preferred public Supabase publishable key. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Fallback | Legacy fallback if the publishable default key is not used. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only admin access for auth, admin routes, and writes. |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site origin used for metadata, sitemaps, and email links. |
| `NEXT_PUBLIC_SITE_ROOT_DOMAIN` | Yes | Apex domain used for microsite subdomain rewrites. |
| `PASSWORD_RESET_REDIRECT_URL` | Optional | Legacy Supabase `redirect_to` value. Recovery links now use the server-side `/auth/confirm` route so this is only a fallback for older emails still in flight. |
| `GOOGLE_MAPS_API_KEY` | Recommended | Server-side geocoding, Places enrichment, and photo proxying. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes | Client-side Google Maps loading. |
| `CRON_SECRET` | Yes | Bearer secret required by `/api/cron/google-place-refresh`. |
| `RESEND_API_KEY` | Yes | Transactional email delivery for password reset and inquiry notifications. |
| `RESEND_FROM` | Recommended | Verified sender identity for Resend. |
| `NEXT_PUBLIC_PROVIDER_WEBSITE_BUILDER_ENABLED` | Optional | Feature flag for the provider website builder. |
| `APP_PERF_LOGS` | Optional | Enables structured server performance logs when set to `1`. |
| `ANALYZE` | Optional | Enables bundle analyzer for local profiling. |

## Vercel project setup

1. Set the Production, Preview, and Development environment variables in Vercel.
2. Confirm the project is using the repository root as the working directory.
3. Keep `pnpm-lock.yaml` as the single lockfile source of truth.
4. Verify the cron job is enabled for `/api/cron/google-place-refresh`.
5. Confirm Vercel Analytics and Speed Insights are enabled in production and preview deployments.

## Domain setup

1. Add the apex domain and `www` domain to the Vercel project.
2. Add a wildcard domain for microsites, for example `*.earlylearningdirectory.com`.
3. Point DNS so wildcard subdomains resolve to Vercel.
4. Set `NEXT_PUBLIC_SITE_ROOT_DOMAIN` to the apex domain only, without protocol.

## Supabase setup

1. Add the production site origin to Supabase Authentication Site URL.
2. Add these entries to Supabase Authentication → URL Configuration → Redirect URLs:
   - `https://<production-origin>/auth/confirm`
   - `https://<production-origin>/update-password`
   - `https://<production-origin>/update-password?error=invalid`
3. Confirm production migrations are applied before switching traffic.
4. Verify service-role access is only used in server-only code paths.

## Email setup

1. Verify the sending domain in Resend.
2. Set `RESEND_FROM` to a verified sender address.
3. Send a real password reset email from production before launch.

## Google Maps and Places

1. Restrict the browser key to the production domains used by the app and microsites.
2. Restrict the server key by API scope where possible.
3. Confirm quotas are sufficient for geocoding, place details, and photo proxy traffic.

## Launch-day validation

1. Run `pnpm lint`.
2. Run `pnpm typecheck`.
3. Run `pnpm test`.
4. Run `pnpm build`.
5. Verify `GET /api/health` returns `200` and reports all checks as `pass`.
6. Verify `GET /api/cron/google-place-refresh` returns `401` without auth and succeeds with `Authorization: Bearer <CRON_SECRET>`.
7. Confirm `/`, `/search`, `/providers/[slug]`, `/login`, `/signup`, and `/contact` render correctly.
8. Confirm a provider microsite resolves on its subdomain.
9. Confirm password reset email delivery works end to end.
10. Confirm inquiry submission works for both signed-in and guest flows.

## Monitoring and CI

1. Keep `.github/workflows/vercel-readiness.yml` active so every push and pull request runs lint, typecheck, test, and build.
2. Use Vercel Analytics and Speed Insights for production traffic and performance visibility.
3. Use `GET /api/health` as the public readiness probe and keep `/api/health/supabase` for authenticated admin diagnostics.
4. Enable `APP_PERF_LOGS=1` temporarily during incident investigation if deeper server timing logs are needed.

## Post-launch verification

1. Watch the first production deployment for server errors, function duration spikes, and failed cron runs.
2. Check Resend delivery for password reset and inquiry notifications.
3. Verify Google Maps and Places quota usage after real traffic arrives.
4. Confirm analytics traffic appears in Vercel after consent is granted.

## Rollback checklist

1. Keep the previous successful Vercel deployment ready for instant rollback.
2. Do not run destructive schema changes without a tested rollback plan.
3. If production issues appear, roll back the Vercel deployment first, then disable cron if needed.

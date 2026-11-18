# Spendly deployment guide

Spendly is a Vite single-page application hosted on Vercel. Supabase provides authentication and PostgreSQL-backed finance snapshot persistence. There is no separate Express/Node API server in the current architecture.

## Prerequisites

- A Supabase project.
- A Vercel project connected to this GitHub repository.
- Node.js 22 or later for local builds.
- The migration in `supabase/migrations/` applied to the target Supabase project.

## Environment variables

The frontend reads these exact variables in `src/core/supabase/client.ts`:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |

Copy `.env.example` to `.env.local` and fill in the values:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Never commit `.env.local`. Vite embeds `VITE_*` values into the browser bundle, so they must be considered public. Never use a Supabase secret key, `service_role` key, or database password in a frontend variable.

## Vercel build settings

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Install command | `npm install` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Root directory | Repository root |

Add both environment variables in Vercel Project Settings for every environment that needs to run the app. Trigger a new deployment after changing them. The repository's `vercel.json` provides the SPA rewrite for client-side routes.

## Database migration

Apply the SQL file under `supabase/migrations/` to the intended Supabase project using the SQL Editor or Supabase CLI. It creates `public.user_finance_snapshots`, enables Row Level Security, and defines authenticated-user policies scoped to `auth.uid()`.

After applying it, verify that RLS is enabled, authenticated users can access only their own row, anonymous users have no table privileges, and no additional permissive policies grant broader access. A migration committed to Git is not automatically applied to the hosted database.

## Supabase Auth URLs

In Supabase Authentication > URL Configuration:

1. Set Site URL to the production origin.
2. Add the production auth redirect URL(s) used by the app.
3. Add Vercel preview URL patterns only if preview deployments should support authentication.
4. Add the local development URL, such as `http://localhost:5173/**`, for local testing.

Use the exact origins and redirect paths configured for the deployed app.

## Production verification

- [ ] App loads and refreshes correctly on nested routes.
- [ ] New users can register and complete configured email verification.
- [ ] Sign-in, sign-out, and password reset work.
- [ ] Finance changes persist after refresh.
- [ ] The same account retrieves its data from another browser/device.
- [ ] A second account cannot read or overwrite the first account's snapshot.
- [ ] Signed-out clients cannot read or write finance snapshots.
- [ ] Browser console and network requests show no unexpected errors.
- [ ] No secret key or database credential appears in the built frontend bundle.

## Known persistence limitation

The current implementation stores a complete JSONB finance snapshot per user. It is not realtime collaborative synchronization. Overlapping changes from two devices can race, and the latest snapshot write can overwrite an earlier one. See [ACCOUNT_DATA_PERSISTENCE.md](docs/ACCOUNT_DATA_PERSISTENCE.md).

## Rollback

For a frontend rollback, use Vercel deployment history to promote a previously verified deployment. Do not roll back database migrations automatically without reviewing schema compatibility and whether user data has already been written using the new schema.
# Account-based finance persistence

Spendly currently persists the complete finance backup as one JSONB snapshot per Supabase Auth user. The browser repository remains the domain adapter, but it is hydrated from the signed-in user's snapshot before the finance UI is loaded and writes are persisted to that same user's row.

## Expected behaviour

- A first-time account starts with zero transactions and the app's default zero-balance wallets.
- Every successful finance write saves a fresh snapshot under the current Supabase Auth user ID.
- On a later login or another device, the user's snapshot is loaded before finance data is shown.
- The browser's previous local finance data is replaced during account hydration; it is never automatically imported into a new account.
- Row Level Security restricts SELECT, INSERT, and UPDATE to rows where `user_id = auth.uid()`.

## Supabase setup

Migration applied to project `huqnvvjumnkcrnjcvdou`:

- Creates `public.user_finance_snapshots(user_id, data, updated_at)`.
- Enables RLS.
- Grants authenticated users SELECT/INSERT/UPDATE only.
- Adds owner-only policies for all three operations.
- Anonymous users receive no table privileges.

The migration source is `supabase/migrations/20261113000000_user_finance_snapshots.sql`.

## Environment

The frontend needs the existing Vite variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Never put a Supabase service-role key in frontend environment variables.

## Local verification

1. Pull the branch and install dependencies.
2. Sign in with a newly registered account. It should show no transactions.
3. Add a uniquely named transaction and wait for the save operation to finish.
4. Sign out and sign in with a second account. It should not show the first account's transaction.
5. Sign back into the first account in a private window or another device. Its transaction should be present.
6. Refresh and repeat the checks.

## Current implementation note

This first cloud-persistence phase uses a complete JSONB snapshot per user rather than one SQL row per finance entity. It is suitable for the current single-user finance workspace and keeps the existing calculation/business logic intact. It is not realtime multi-device collaboration: simultaneous edits from two devices can race, with the most recently saved snapshot winning. A normalized, revision-aware sync layer can replace this adapter later.

## Existing local test data

The first successful account hydration replaces the browser's local finance cache with that account's cloud snapshot. Keep the downloaded backup file separately; it is not automatically uploaded or merged.

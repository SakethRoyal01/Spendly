# Account-based finance persistence

## Current design

Spendly stores each authenticated user's finance workspace as one JSONB snapshot in `public.user_finance_snapshots`.

| Column | Purpose |
|---|---|
| `user_id` | Primary key referencing `auth.users(id)`; identifies the owner |
| `backup` | JSONB export of that user's finance workspace |
| `updated_at` | Timestamp of the latest snapshot write |

The frontend authenticates with Supabase Auth. The authenticated finance repository verifies the current user, loads that user's snapshot, and persists successful finance writes to the same user-owned row.

## Expected behaviour

- A first-time account starts with an empty finance workspace and default zero-balance wallets.
- On account initialization, Spendly loads the snapshot belonging to the current Supabase Auth user.
- The browser's previous local finance cache is cleared before the cloud snapshot is loaded; local data is not automatically merged into a new account.
- Successful finance writes are saved under the current user's ID.
- Signing in on another device loads the same account snapshot, subject to the current snapshot-based sync limitation.

## Database access controls

The migration at `supabase/migrations/20261113000000_user_finance_snapshots.sql`:

- References `auth.users(id)` with cascade deletion.
- Enables Row Level Security on the snapshot table.
- Adds owner-scoped SELECT, INSERT, and UPDATE policies using `auth.uid() = user_id`.
- Grants the required operations to the `authenticated` role.
- Revokes table privileges from `anon`.

The migration file describes the intended database controls. Confirm that it has been applied to the correct hosted Supabase project and verify the effective policies in the Supabase dashboard.

## Environment

The browser application uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. A publishable key is expected to be visible in the browser. RLS is the security boundary for database rows. Never expose a Supabase secret/service-role key or database password in frontend code, `VITE_*` variables, or Git.

## Known limitations

This phase stores the complete finance backup in one JSONB row per user rather than normalizing each account, transaction, budget, and savings pot into separate database rows.

This design preserves the existing finance domain with a relatively small persistence adapter, but it is not a realtime multi-device collaboration system. Concurrent writes from separate devices can race; the latest snapshot may overwrite a prior snapshot. A revision-aware or transaction-level sync model is a future improvement.

## Verification

Use two independent test accounts:

1. Register and sign in to account A.
2. Create a uniquely identifiable test transaction and wait for persistence.
3. Sign out, then sign in to account B.
4. Confirm account B cannot see account A's transaction.
5. Create a different transaction in account B.
6. Sign back in to account A in a separate browser or device.
7. Confirm account A sees only its own data after refresh.

Also test unauthenticated database access and inspect the effective RLS policies directly in Supabase.

## Local data warning

Account initialization replaces the existing browser finance cache with the signed-in user's cloud snapshot. Export and retain a backup before switching to this branch if the browser contains local-only financial data that has not been migrated.
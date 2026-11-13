-- Per-user cloud persistence for Spendly finance data.
create table if not exists public.user_finance_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  backup jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_finance_snapshots_backup_object check (jsonb_typeof(backup) = 'object')
);

alter table public.user_finance_snapshots enable row level security;

drop policy if exists "Users can read their own finance snapshot" on public.user_finance_snapshots;
create policy "Users can read their own finance snapshot"
  on public.user_finance_snapshots for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own finance snapshot" on public.user_finance_snapshots;
create policy "Users can insert their own finance snapshot"
  on public.user_finance_snapshots for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own finance snapshot" on public.user_finance_snapshots;
create policy "Users can update their own finance snapshot"
  on public.user_finance_snapshots for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.user_finance_snapshots to authenticated;
revoke all on public.user_finance_snapshots from anon;

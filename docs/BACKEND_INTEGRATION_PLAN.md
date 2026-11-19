# SPENDLY — BACKEND INTEGRATION & ARCHITECTURAL EVOLUTION PLAN
## Supabase PostgreSQL, Row-Level Security, Multi-User Auth & Migration Architecture

**Spendly Version:** 2.0 (Platform Edition)  
**Author:** Spendly Architecture & Engineering  
**Target Backend:** Supabase (PostgreSQL 16+), Supabase Auth, Edge Functions  

---

## 1. ARCHITECTURAL OVERVIEW

Spendly was designed and implemented around a strict **Repository Pattern** decoupled via TypeScript interfaces (`FinanceRepository`). In Phase 1 and Phase 2, all domain operations run against `LocalFinanceRepository`, persisting to browser `localStorage` with minor-unit integer arithmetic (paise) and an atomic ledger engine.

In Phase 3 (Cloud & Multi-User), Spendly will seamlessly transition from `LocalFinanceRepository` to `SupabaseFinanceRepository` simply by swapping the injected repository instance in `FinanceContext`.

```
                    ┌────────────────────────┐
                    │    React UI Layer      │
                    │ (Pages, Modals, Pulse) │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │    useFinance() Hook   │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │  FinanceRepository     │
                    │  (Abstract Interface)  │
                    └─────┬────────────┬─────┘
                          │            │
            ┌─────────────▼──┐      ┌──▼────────────────────────┐
            │ LocalStorage   │      │ SupabaseFinanceRepository │
            │ (Offline/Guest)│      │ (PostgreSQL + RLS + Auth) │
            └────────────────┘      └───────────────────────────┘
```

---

## 2. POSTGRESQL RELATIONAL SCHEMA

All financial values are stored as integers in **minor units (paise: 1 INR = 100 paise)** or `numeric(14, 2)` to eliminate floating-point rounding errors.

### 2.1 Profiles / Users Table
Extends `auth.users` with user preferences and default configuration.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  currency varchar(3) default 'INR' not null,
  allow_overdraft boolean default false not null,
  notifications_enabled boolean default true not null,
  savings_reminder_enabled boolean default true not null,
  savings_reminder_frequency text default 'weekly' not null check (savings_reminder_frequency in ('daily', 'weekly', 'monthly')),
  reduced_motion boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

### 2.2 Accounts (Virtual Wallets) Table
Stores cash and bank balances with constraint protection.

```sql
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash', 'bank', 'savings', 'credit', 'other')),
  bank_name text,
  account_number_last4 varchar(4),
  opening_balance bigint not null default 0, -- stored in paise
  current_balance bigint not null default 0, -- stored in paise
  color text,
  icon text,
  is_primary boolean default false not null,
  is_archived boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_accounts_user on public.accounts(user_id);
```

### 2.3 Transactions (Expenses, Income) Table
Primary financial transaction table.

```sql
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  amount bigint not null check (amount > 0), -- stored in paise
  category text not null,
  description text,
  date date not null,
  payment_method text not null,
  is_split boolean default false not null,
  savings_pot_id uuid references public.savings_pots(id) on delete set null,
  recurring_id uuid references public.recurring_transactions(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_transactions_user_date on public.transactions(user_id, date desc);
create index idx_transactions_category on public.transactions(user_id, category);
```

### 2.4 Transaction Splits Table
Supports hybrid payments across multiple accounts.

```sql
create table public.transaction_splits (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  amount bigint not null check (amount > 0), -- stored in paise
  created_at timestamptz default now() not null
);

create index idx_splits_tx on public.transaction_splits(transaction_id);
create index idx_splits_account on public.transaction_splits(account_id);
```

### 2.5 Account Transfers Table
Transfers between wallets that do not affect net worth.

```sql
create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_account_id uuid not null references public.accounts(id) on delete restrict,
  destination_account_id uuid not null references public.accounts(id) on delete restrict,
  amount bigint not null check (amount > 0), -- stored in paise
  date date not null,
  note text,
  created_at timestamptz default now() not null
);

create index idx_transfers_user on public.transfers(user_id, date desc);
```

### 2.6 Savings Pots & Goals Table
Dedicated savings pots with customizable target dates.

```sql
create table public.savings_pots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  target_amount bigint not null check (target_amount > 0), -- in paise
  current_amount bigint not null default 0 check (current_amount >= 0), -- in paise
  target_date date,
  category text not null,
  color text,
  icon text,
  is_completed boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_savings_pots_user on public.savings_pots(user_id);
```

### 2.7 Savings Contributions & Withdrawals Table
Tracks every deposit and withdrawal made against savings goals.

```sql
create table public.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  pot_id uuid not null references public.savings_pots(id) on delete cascade,
  source_account_id uuid references public.accounts(id) on delete set null,
  amount bigint not null check (amount > 0), -- in paise
  date date not null,
  note text,
  created_at timestamptz default now() not null
);

create table public.savings_withdrawals (
  id uuid primary key default gen_random_uuid(),
  pot_id uuid not null references public.savings_pots(id) on delete cascade,
  destination_account_id uuid references public.accounts(id) on delete set null,
  amount bigint not null check (amount > 0), -- in paise
  date date not null,
  reason text,
  is_expense boolean default false not null,
  created_at timestamptz default now() not null
);
```

### 2.8 Monthly Budgets Table
Category-level and overall monthly spending limits.

```sql
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month varchar(7) not null, -- YYYY-MM
  category text, -- NULL represents total overall monthly budget
  monthly_limit bigint not null check (monthly_limit > 0), -- in paise
  warning_threshold smallint default 80 not null check (warning_threshold between 10 and 100),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, month, category)
);

create index idx_budgets_user_month on public.budgets(user_id, month);
```

### 2.9 Recurring Transactions & Occurrences Table
Scheduled bills with due-date tracker.

```sql
create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  amount bigint not null check (amount > 0), -- in paise
  category text not null,
  account_id uuid not null references public.accounts(id) on delete restrict,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  billing_day smallint not null check (billing_day between 1 and 31),
  next_due_date date not null,
  is_active boolean default true not null,
  auto_log boolean default false not null,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.recurring_occurrences (
  id uuid primary key default gen_random_uuid(),
  recurring_id uuid not null references public.recurring_transactions(id) on delete cascade,
  due_date date not null,
  paid_date date,
  status text not null check (status in ('pending', 'paid', 'skipped')),
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz default now() not null
);
```

---

## 3. ROW LEVEL SECURITY (RLS) POLICIES

Every table in Spendly mandates RLS enabled, ensuring complete data isolation between authenticated users.

```sql
-- Enable RLS on every table
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_splits enable row level security;
alter table public.transfers enable row level security;
alter table public.savings_pots enable row level security;
alter table public.savings_contributions enable row level security;
alter table public.savings_withdrawals enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.recurring_occurrences enable row level security;

-- profiles: keyed by id, not user_id
create policy "Users manage own profile" on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- tables with a user_id column
create policy "Own accounts" on public.accounts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own transactions" on public.transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own transfers" on public.transfers for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own savings pots" on public.savings_pots for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own budgets" on public.budgets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own recurring" on public.recurring_transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- child tables: ownership via parent (add WITH CHECK too)
create policy "Own splits" on public.transaction_splits for all
  using (exists (select 1 from public.transactions t
                 where t.id = transaction_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.transactions t
                 where t.id = transaction_id and t.user_id = auth.uid()));
create policy "Own contributions" on public.savings_contributions for all
  using (exists (select 1 from public.savings_pots p
                 where p.id = pot_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.savings_pots p
                 where p.id = pot_id and p.user_id = auth.uid()));
create policy "Own withdrawals" on public.savings_withdrawals for all
  using (exists (select 1 from public.savings_pots p
                 where p.id = pot_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.savings_pots p
                 where p.id = pot_id and p.user_id = auth.uid()));
create policy "Own occurrences" on public.recurring_occurrences for all
  using (exists (select 1 from public.recurring_transactions r
                 where r.id = recurring_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.recurring_transactions r
                 where r.id = recurring_id and r.user_id = auth.uid()));
```

---

## 4. ATOMIC DATABASE TRANSACTIONS (RPC FUNCTIONS)

To prevent race conditions and balance discrepancies during complex multi-wallet split payments, PostgreSQL stored procedures (RPCs) are executed in single database transactions.

### 4.1 Atomic Expense Creation with Split Deductions
```sql
create or replace function create_expense_with_splits(
  p_amount bigint, p_category text, p_description text, p_date date,
  p_payment_method text, p_savings_pot_id uuid, p_splits jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_tx uuid; v_split jsonb; v_acc uuid; v_amt bigint; v_bal bigint; v_overdraft boolean;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select allow_overdraft into v_overdraft from profiles where id = v_uid;

  if p_savings_pot_id is not null and not exists
     (select 1 from savings_pots where id = p_savings_pot_id and user_id = v_uid) then
    raise exception 'Invalid savings pot';
  end if;

  insert into transactions (user_id, type, amount, category, description, date,
                            payment_method, is_split, savings_pot_id)
  values (v_uid, 'expense', p_amount, p_category, p_description, p_date,
          p_payment_method, jsonb_array_length(p_splits) > 1, p_savings_pot_id)
  returning id into v_tx;

  for v_split in select * from jsonb_array_elements(p_splits) loop
    v_acc := (v_split->>'account_id')::uuid;
    v_amt := (v_split->>'amount')::bigint;

    select current_balance into v_bal from accounts
      where id = v_acc and user_id = v_uid for update;
    if not found then raise exception 'Account not found'; end if;
    if not v_overdraft and (v_bal - v_amt) < 0 then
      raise exception 'Insufficient balance in account %', v_acc;
    end if;

    update accounts set current_balance = current_balance - v_amt, updated_at = now()
      where id = v_acc and user_id = v_uid;
    insert into transaction_splits (transaction_id, account_id, amount)
      values (v_tx, v_acc, v_amt);
  end loop;

  if p_savings_pot_id is not null then
    update savings_pots set current_amount = greatest(0, current_amount - p_amount),
      updated_at = now() where id = p_savings_pot_id and user_id = v_uid;
  end if;

  return v_tx;
end;
$$;
```

---

## 5. LOCALSTORAGE TO POSTGRESQL MIGRATION GUIDE

Spendly's `LocalFinanceRepository` already produces a clean, JSON-serializable `FullBackupData` export. When a user creates an account or signs in for the first time:

1. **Detection**: Client checks if local data exists in `localStorage` (`spendly_accounts_v2`, `spendly_transactions_v2`, etc.).
2. **Prompt**: A friendly Blockit modal asks:  
   *"We found existing financial records on this device. Would you like to sync them to your cloud account?"*
3. **Execution**:
   ```typescript
   async function migrateLocalToSupabase(user: SupabaseUser) {
     const backup = await localFinanceRepository.exportFullBackup();
     
     // 1. Upload Accounts with UUID mapping
     const accountMap = new Map<string, string>(); // localId -> cloudUUID
     for (const acc of backup.accounts) {
       const { data: cloudAcc } = await supabase.from('accounts').insert({
         user_id: user.id,
         name: acc.name,
         type: acc.type,
         opening_balance: Math.round(acc.openingBalance * 100),
         current_balance: Math.round(acc.currentBalance * 100),
         color: acc.color,
         icon: acc.icon,
         is_primary: acc.isPrimary
       }).select().single();
       accountMap.set(acc.id, cloudAcc.id);
     }

     // 2. Upload Savings Pots
     const potMap = new Map<string, string>();
     for (const pot of backup.savingsPots) {
       const { data: cloudPot } = await supabase.from('savings_pots').insert({
         user_id: user.id,
         name: pot.name,
         target_amount: Math.round(pot.targetAmount * 100),
         current_amount: Math.round(pot.currentAmount * 100),
         category: pot.category,
         target_date: pot.targetDate
       }).select().single();
       potMap.set(pot.id, cloudPot.id);
     }

     // 3. Upload Transactions and Splits
     for (const tx of backup.transactions) {
       const { data: cloudTx } = await supabase.from('transactions').insert({
         user_id: user.id,
         type: tx.type,
         amount: Math.round(tx.amount * 100),
         category: tx.category,
         description: tx.description,
         date: tx.date,
         payment_method: tx.paymentMethod,
         is_split: tx.isSplit,
         savings_pot_id: tx.savingsPotId ? potMap.get(tx.savingsPotId) : null
       }).select().single();

       if (tx.splits && tx.splits.length > 0) {
         await supabase.from('transaction_splits').insert(
           tx.splits.map(s => ({
             transaction_id: cloudTx.id,
             account_id: accountMap.get(s.accountId)!,
             amount: Math.round(s.amount * 100)
           }))
         );
       }
     }
   }
   ```
4. **Verification**: After server reconciliation returns 0 variance, local storage key is preserved as offline backup with sync timestamp.

---

## 6. MULTI-USER AUTHENTICATION ROADMAP

- **Auth Providers**: Email OTP (Passwordless Magic Link) and Google OAuth via Supabase Auth.
- **Session Management**: Supabase JWT stored securely in browser session/cookie.
- **Offline Fallback**: TanStack Query / WatermelonDB or local offline cache with sync queue on reconnection.
- **Zero Disruption**: The UI remains completely identical for guests and authenticated users, ensuring maximum user delight.


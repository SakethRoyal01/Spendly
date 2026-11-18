# Spendly

<p align="center">
  <img src="public/logo.png" alt="Spendly" width="104" />
</p>

<h3 align="center">A clearer way to understand your money.</h3>
<p align="center">A responsive personal-finance workspace for everyday expenses, wallets, savings, budgets, and spending insights.</p>

<p align="center">
  <a href="https://spendly-roan-omega.vercel.app/">Live deployment</a> 
  <a href="https://github.com/SakethRoyal01/Spendly/issues">Issues</a> 
  <a href="https://github.com/SakethRoyal01">Developer</a>
</p>

> **Demo access:** the current Vercel project has access protection enabled. The deployment may require sign-in or access approval. Enable a public demo before broad promotion.

## About

Spendly is a personal finance tracker built to make day-to-day money management easier to record and understand. It brings a daily expense journal, wallet balances, transfers, savings goals, budgets, recurring payments, and financial insights into one responsive interface.

The application uses a modular React/TypeScript frontend, a finance repository layer, Supabase Auth, and Supabase Postgres for per-user cloud persistence.

## Features

- Daily expense recording with descriptions, categories, dates, and payment methods.
- Cash, UPI/bank, and split-payment tracking.
- Wallet and account balances, transfers, deposits, and transaction history.
- Savings pots with contributions and withdrawals.
- Monthly category budgets and recurring payment schedules.
- Calendar-based activity history and spending analytics.
- Sign-up, email verification where configured, sign-in, sign-out, and password reset.
- User-specific cloud snapshots protected by database Row Level Security.
- Responsive navigation and light/dark themes.

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS 4, Framer Motion, Lucide React |
| Charts | Recharts |
| Utilities | date-fns |
| Auth | Supabase Auth |
| Data | Supabase Postgres, JSONB, Row Level Security |
| Hosting | Vercel |

## Architecture

```mermaid
flowchart TD
  U[User] --> APP[React application]
  APP --> AUTH[Supabase Auth]
  APP --> FIN[Finance context]
  FIN --> REPO[Finance repository]
  REPO --> LOCAL[Local finance domain adapter]
  REPO --> CLOUD[Authenticated cloud adapter]
  CLOUD --> DB[(Supabase Postgres)]
  DB --> RLS[Row Level Security]
  RLS --> USER[Rows scoped to auth.uid()]
```

The authenticated repository verifies the current Supabase user, loads the row owned by that user, and persists finance changes to that same row. The migration in `supabase/migrations/` defines owner-scoped SELECT, INSERT, and UPDATE policies.

**Persistence limitation:** the current design stores one complete JSONB backup per user in `user_finance_snapshots.backup`. It is not realtime collaboration; overlapping writes from multiple devices can race, with the latest snapshot potentially replacing an earlier one. A revision-aware sync model is a future improvement.

## Run locally

**Requirements:** Node.js 22+, npm, and a Supabase project.

```bash
git clone https://github.com/SakethRoyal01/Spendly.git
cd Spendly
npm ci
```

Copy `.env.example` to `.env.local` (PowerShell: `Copy-Item .env.example .env.local`) and set:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Apply the SQL migration in `supabase/migrations/` to your Supabase project, then configure the local and production authentication redirect URLs in Supabase Auth settings.

``gbash
npm run dev
```

Quality commands:

```bash
npm run lint
npm test
npm run build
```

`npm test` currently runs lightweight scenario-based financial arithmetic/ledger checks. It does not replace integration tests for Supabase Auth, RLS, or multi-user isolation.

## Deployment

Vercel settings: **Vite**, install `npm ci`, build `npm run build`, output `dist`. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the required Vercel environments. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Security

- `.env` files containing real values are ignored; `.env.example` contains placeholders.
- Every `VITE_*` variable is bundled into the browser and must be considered public.
- A Supabase publishable key is intended for client use; it does not replace Row Level Security.
- Never commit service-role/secret keys, database passwords, tokens, private keys, personal exports, or real financial records.
- Verify that the migration is applied and that effective RLS policies are correct in the hosted Supabase project.

Public source code can be cloned. Protect data with server-side authorization, RLS, and safe credential handlingnot by attempting to hide frontend code. See [SECURITY.md](SECURITY.md).

## Repository layout

```text
src/
 app/          # App shell, providers, routes
 core/         # Auth, finance state, repositories, Supabase client
 features/     # Expenses, wallets, savings, budgets, insights, etc.
 shared/       # Layout, UI, navigation, theme, utilities
 types/        # Finance domain types
supabase/
 migrations/   # Database schema and RLS migrations
docs/             # Persistence and implementation notes
scripts/          # Scenario checks
```

## Roadmap

- [ ] Add current, privacy-safe screenshots and a product walkthrough.
- [ ] Add integration tests for authentication, RLS, and account isolation.
- [ ] Introduce revision-aware persistence to prevent cross-device write races.
- [ ] Expand tests around actual finance-domain operations.
- [ ] Enable an accessible public demo with appropriate safeguards.

## Author

**Saketh Rayalu**  [GitHub](https://github.com/SakethRoyal01)  [LinkedIn](https://www.linkedin.com/in/sakethrayalu/)

For bugs or suggestions, open an issue with clear reproduction steps.

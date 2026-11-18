# Spendly — Complete Codebase Restructuring & Refactoring Plan

## 1. Executive Summary & Goals

Spendly is a fully featured personal finance tracker built with React 18, TypeScript, Tailwind CSS, and Vite. The financial domain features—including dual-ledger transactions, change deduction from expenditures, daily net cash flow calculations, overdraft/negative balance allowances, split payments, savings goals, budgets, and recurring transactions—are already implemented and verified by 92 automated test scenarios.

### Core Objectives
1. **Professional Feature-Oriented Architecture**: Transition from a fragmented structure to a clear domain-driven structure (`src/app/`, `src/features/`, `src/core/`, `src/shared/`, `src/types/`).
2. **Context Consolidation**: Eliminate the legacy `ExpenseContext` shim, which is an unnecessary proxy layer on top of `FinanceContext`. All components will consume `FinanceContext` directly.
3. **Repository Unification**: Retire unreferenced repository interfaces (`ExpenseRepository.ts`, `LocalExpenseRepository.ts`) in favor of canonical `FinanceRepository` and `LocalFinanceRepository`.
4. **Dead Code & Asset Removal**: Remove unreferenced assets (`logo1.png`, `hero.png`, `react.svg`, `vite.svg`, `App.css`), unrouted legacy pages (`DailyExpenses.tsx`), and pruned commented blocks in `InsightsSection.tsx` (~470 lines of dead code).
5. **Absolute Preservation**: 100% preservation of all visual layouts, styling, themes (light/dark mode), animations, LocalStorage keys/data schema, and financial calculation integrity.

---

## 2. Codebase Audit & Current State Analysis

### Current File Inventory (89 files across `src/`)
- `src/components/ui/` (13 components: Button, Modal, Card, Dropdown, Toggle, FormInput, CurrencyInput, DatePicker, NotificationToast, ThemeToggle, Preloader, StatCard, Badge)
- `src/components/layout/` (2 components: Navbar, SectionAnchor)
- `src/components/overview/` (7 components: DailyExpensePreview, ExpenseHistorySection, JournalCalendarSection, OverviewSummary, MonthlySummaryCards, MonthlyCalendar, MonthlyActivityChart)
- `src/components/expenses/` (2 components: ExpenseList, ExpenseStats)
- `src/components/transactions/` (2 components: AddTransactionModal, TransactionList)
- `src/components/wallets/` (4 components: WalletList, AddAccountModal, TransferModal, EditAccountModal)
- `src/components/savings/` (3 components: SavingsPotsList, AddSavingsGoalModal, AddMoneyToGoalModal)
- `src/components/budgets/` (2 components: BudgetList, AddBudgetModal)
- `src/components/calendar/` (1 component: CalendarView)
- `src/components/insights/` (2 components: InsightsSection, DateAnchor)
- `src/components/settings/` (1 component: SettingsSection)
- `src/pages/` (8 pages: Overview, Expenses, DailyExpenses [dead], Wallets, Savings, Budgets, Calendar, Insights)
- `src/context/` (3 contexts: FinanceContext, ExpenseContext [shim], ThemeContext, NavigationContext)
- `src/services/` (Repositories & storage)
- `src/utils/` (Financial, formatting, and date helpers)
- `src/types/` (Global types)

### Redundancies Identified
1. **`ExpenseContext.tsx`**: Merely wraps `useFinance()` and re-exposes subsets of functions under legacy aliases.
2. **`ExpenseRepository.ts` & `LocalExpenseRepository.ts`**: Zero usages in the codebase. All transactions and balances are managed via `FinanceRepository` and `LocalFinanceRepository`.
3. **`DailyExpenses.tsx`**: Dead route. Daily expenses are rendered inside the main page (`Overview.tsx`) through `ExpenseHistorySection`.
4. **`InsightsSection.tsx`**: Contains ~470 lines of commented-out legacy code at the top.
5. **Unused Static Assets**: `logo1.png` (318 KB), `hero.png` (13 KB), `react.svg`, `vite.svg`, `App.css` (empty).

---

## 3. Target Architecture

```
src/
├── app/
│   ├── App.tsx                     # Main application shell & layout router
│   ├── providers.tsx               # Consolidated provider wrapper
│   └── routes.tsx                  # Tab/page navigation registry
├── core/
│   ├── finance/
│   │   ├── FinanceContext.tsx       # Primary finance state & transaction orchestrator
│   │   ├── financeContextInstance.ts
│   │   └── useFinance.ts
│   ├── repositories/
│   │   ├── FinanceRepository.ts     # Canonical repository contract
│   │   └── LocalFinanceRepository.ts # LocalStorage implementation with atomic reversals
│   ├── notifications/              # Negative balance alert manager
│   └── storage/
│       └── storage.ts              # LocalStorage persistence wrapper & constants
├── features/
│   ├── overview/                   # Overview dashboard & daily ledger
│   ├── expenses/                   # Expense log & statistics
│   ├── transactions/               # Add/edit transaction modal & unified list
│   ├── wallets/                    # Accounts, cash wallet & transfer modals
│   ├── savings/                    # Savings pots & goal tracking
│   ├── budgets/                    # Category budgets & alerts
│   ├── calendar/                   # Monthly financial calendar
│   ├── insights/                   # Net cash flow analytics & trends
│   └── settings/                   # Data export, preferences & theme
├── shared/
│   ├── components/
│   │   ├── layout/                 # Navbar, SectionAnchor, PageShell
│   │   └── ui/                     # Button, Modal, Card, Preloader, Toast, etc.
│   ├── navigation/                 # NavigationContext & useNavigation
│   ├── theme/                      # ThemeContext & useTheme
│   └── utils/                      # Currency, dates, math, calculations
├── types/
│   └── index.ts                    # Single source of truth for domain types
└── assets/
    └── logo.png                    # Spendly brand logo
```

---

## 4. Preservation Guarantees

1. **LocalStorage Keys & Formats**:
   - `spendly_accounts_v2`
   - `spendly_transactions_v2`
   - `spendly_ledger_v2`
   - `spendly_savings_v2`
   - `spendly_budgets_v2`
   - `spendly_recurring_v2`
   - `spendly_notifications_v2`
   - `spendly_preferences_v2`
   - `spendly_theme_mode`
2. **Financial Calculation Rules**:
   - Change received deducted from expense totals.
   - Net cash flow = Inflows - Outflows.
   - Accounts allowed to drop below zero (overdraft/negative balance allowed).
   - Atomic balance rollback on edit/delete.
   - Flow values never show minus sign, rendered in `#F05010`.
   - Negative wallet balance renders with minus sign.
3. **UI / Responsive / Theme Fidelity**:
   - Zero modifications to CSS classes, color hexes, motion settings, spacing, or breakpoints.
   - Light and dark themes fully maintained.

---

## 5. Verification Protocol

- Run `node scripts/test-scenarios.js` (92 assertions must all pass).
- Run `npm run build` (`tsc -b && vite build` must compile with 0 errors).
- Inspect preloader and initial load behavior.

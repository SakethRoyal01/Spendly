# Spendly — Personal Finance Journal & Tracker

Spendly is a minimalist personal finance journal and liquidity management system built with React 18, TypeScript, Vite, Tailwind CSS 4, and Framer Motion. Engineered around an editorial aesthetic and robust double-entry style financial integrity, Spendly provides real-time tracking of wallets, bank accounts, expenses, returned change, savings goals, category budgets, and recurring schedules.

---

## 🎨 Visual Identity & Design Philosophy

- **Brand Orange**: `#F05010`
- **Deep Navy**: `#082052`
- **Warm Ivory**: `#F8F0E5`

Spendly avoids generic dashboard clutter and excessive containers. It presents financial data with **editorial typography, generous whitespace, clear visual hierarchy, and subtle separators**.

### Dual Themes
- **Light Mode**: Warm Ivory (`#F8F0E5`) paper background, Deep Navy (`#082052`) text and accents, with muted navy borders.
- **Dark Mode**: Deep Navy (`#082052`) background, Warm Ivory (`#F8F0E5`) typography and accents, with muted cream borders.
- Persisted automatically in browser LocalStorage (`spendly_theme_mode`).

---

## 💡 Core Financial Rules & Logic

1. **Expenses First, Then Overview**: The main page defaults to the daily journal & ledger (`#expenses`) at the top, transitioning smoothly into the comprehensive monthly overview (`#overview`).
2. **Change Deducted from Expenditures**: When cash change is received from a payment, it directly reduces net daily and monthly spending rather than being counted as new income.
3. **Daily Net Cash Flow**: Net Cash Flow = Verified Inflows − Net Spending (`Gross Expenses - Change`). Surplus renders with `+` in green, while deficits render in brand orange (`#F05010`) without a minus sign.
4. **Overdraft / Negative Balances Allowed**: Transactions are never blocked due to insufficient account balance. Accounts are allowed to drop below zero, displaying `-₹amount` with professional non-blocking toast alerts.
5. **Atomic Reversals on Edit/Delete**: Modifying or deleting expenses or transfers completely reverses previous account allocations before applying new allocations, ensuring 100% mathematical integrity across all wallets and ledgers.

---

## 🏗️ Clean Modular Architecture

The application is structured into domain-driven feature modules and a robust core:

```
src/
├── app/
│   ├── App.tsx                     # Main application shell & layout router
│   ├── providers.tsx               # Consolidated provider wrapper
│   └── routes.tsx                  # Tab & page navigation registry
├── core/
│   ├── finance/
│   │   ├── FinanceContext.tsx       # Primary state orchestrator & reactive metrics
│   │   ├── financeContextInstance.ts
│   │   ├── useFinance.ts            # Canonical finance hook
│   │   └── index.ts
│   ├── repositories/
│   │   ├── FinanceRepository.ts     # Interface contract for local & cloud storage
│   │   └── LocalFinanceRepository.ts # Full LocalStorage implementation with atomic reversals
│   └── storage/
│       └── storage.ts              # Robust safeStorage wrapper with error handling
├── features/
│   ├── overview/                   # Overview dashboard, savings & wallet summary widgets
│   ├── expenses/                   # Quick add, split payment editor, reminder modals
│   ├── transactions/               # Daily ledger, interactive date anchor, history archive
│   ├── wallets/                    # Accounts, cash wallet, deposit & transfer modals
│   ├── savings/                    # Savings pots, contribution & withdrawal modals
│   ├── budgets/                    # Monthly category budgets & recurring payment manager
│   ├── calendar/                   # Monthly calendar & interactive activity charts
│   ├── insights/                   # Net cash flow analytics, spending pulse & yearly heatmap
│   └── settings/                   # Data backup/restore (JSON/CSV), notification drawer
├── shared/
│   ├── components/
│   │   ├── layout/                 # AppLayout, Sidebar, MobileNav, Header
│   │   └── ui/                     # Badge, Button, Card, ConfirmDialog, Modal, Preloader, Toast
│   ├── navigation/                 # NavigationContext & useNavigation
│   ├── theme/                      # ThemeContext & useTheme
│   └── utils/                      # Currency (INR), dates, calculations, categories, CSV export
└── types/
    ├── expense.ts                  # Expense categories & stats models
    ├── finance.ts                  # Core accounts, transactions, splits, budgets, and savings
    └── index.ts                    # Single entry-point for all domain types
```

---

## 🧪 Automated Financial Integrity Suite

Spendly includes a comprehensive test suite with **92 automated assertions** validating financial scenarios A through Z8:

```bash
# Run test suite
npm run test
```

### Key Scenarios Covered:
- **Scenario A–C**: Cash, UPI, and Hybrid Split payments.
- **Scenario D–F**: Savings contributions and withdrawals.
- **Scenario G–H**: Verified income recording and atomic edit/delete reversals.
- **Scenario I, U–W**: Negative balance allowance across Cash and Bank accounts with single-fire notifications.
- **Scenario L–R**: Unspecified payment method handling and subsequent resolution.
- **Scenario S–T**: Hybrid split account attribution and wallet spending isolation.
- **Scenario Z3–Z8**: Net Cash Flow calculation, brand orange styling, and user change deduction reconciliation.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm run test

# Run linter
npm run lint

# Build production bundle
npm run build
```

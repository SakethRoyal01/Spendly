# Spendly — Personal Finance Journal

Spendly is a minimalist personal finance journal built with React 18, TypeScript, Vite, Tailwind CSS 4, and Framer Motion. Engineered around an editorial notebook aesthetic, it focuses on daily expense recording with an interactive date anchor, inline ledger entries, monthly calendar review, and chronological archive.

---

## 🎨 Design Philosophy & Identity

- **Deep Navy**: `#082052`
- **Warm Ivory**: `#F8F0E5`

Spendly avoids generic dashboard card clutter, neon gradients, and excess containers. Instead, it organizes financial data using **editorial typography, whitespace, and subtle separators**.

### Dual Themes
- **Light Mode**: Warm Ivory (`#F8F0E5`) paper background, Deep Navy (`#082052`) text and accents, with muted navy separators.
- **Dark Mode**: Deep Navy (`#082052`) background, Warm Ivory (`#F8F0E5`) typography and accents, with muted cream separators.
- Persisted automatically in browser LocalStorage (`spendly_theme_mode`).

---

## 📖 Homepage Hierarchy

1. **Minimal Header**: Brand identity with editorial serif typography, navigation links, and theme toggle.
2. **Prominent Date Anchor**:
   - Interactive day and date display (e.g. `WEDNESDAY, 11 NOVEMBER 2026`).
   - Previous and next day navigation.
   - Click to open the calendar date picker to choose any date.
   - Subtle "Today" indicator.
3. **Daily Expense Ledger**:
   - Clean horizontal table layout with serial number (`01`, `02`...), description, and right-aligned amount in INR (`₹`).
   - Inline `+ Add expense` row: type description, select category, enter amount, press **Enter** to save, **Esc** to cancel.
   - Inline row editing and deletion with confirmation dialog.
4. **Daily Total**:
   - Immediate calculation of the total spent for the active day in bold editorial serif typography.
   - Clean empty state when no expenses are logged.
5. **Monthly Overview Summary**:
   - Typographic metrics: Total spent this month, today's spend, and average daily spend based on elapsed days.
6. **Calendar Section**:
   - Monthly calendar with navigation, indicator dots for days with expenses, and single-click date selection.
7. **Expense History & Archive**:
   - Filterable ledger with description search, category filters, month selector, and CSV export.

---

## 🛠️ Architecture

Spendly uses the **Repository Pattern** to decouple storage from UI components:

```
src/
├── components/
│   ├── journal/           # DateAnchor, DailyLedgerList, OverviewSummary, JournalCalendarSection, ExpenseHistorySection
│   ├── layout/            # Header, AppLayout
│   └── ui/                # Button, Modal, ConfirmDialog, Badge, ToastContainer
├── context/
│   ├── ExpenseContext.tsx
│   ├── expenseContextInstance.ts
│   ├── ThemeContext.tsx
│   └── themeContextInstance.ts
├── hooks/
│   ├── useExpenses.ts
│   └── useTheme.ts
├── services/
│   └── repositories/
│       ├── ExpenseRepository.ts       # Storage interface
│       └── LocalExpenseRepository.ts  # LocalStorage implementation
├── types/
│   └── expense.ts         # Domain model with nullable userId for Supabase
└── utils/
    ├── calculations.ts    # Reactive derived metrics
    ├── categories.ts      # Expense categories
    ├── currency.ts        # INR (₹) formatting (en-IN)
    ├── dates.ts           # date-fns utilities
    └── csv.ts             # CSV generator
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linter
npm run lint

# Build production bundle
npm run build
```

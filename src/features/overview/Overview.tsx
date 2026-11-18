import React, { useState } from 'react';
import { DateAnchor } from '../transactions/DateAnchor';
import { QuickAddBar } from '../expenses/QuickAddBar';
import { DailyLedgerList } from '../transactions/DailyLedgerList';
import { OverviewSummary } from './OverviewSummary';
import { WalletsSummaryWidget } from './WalletsSummaryWidget';
import { SavingsSummaryWidget } from './SavingsSummaryWidget';
import { BudgetCard } from '../budgets/BudgetCard';
import { RecurringManager } from '../budgets/RecurringManager';
import { JournalCalendarSection } from '../calendar/JournalCalendarSection';
import { ExpenseHistorySection } from '../transactions/ExpenseHistorySection';
import { UnspecifiedPaymentReminder } from '../expenses/UnspecifiedPaymentReminder';
import { ExpenseFormModal } from '../expenses/ExpenseFormModal';
import type { Expense } from '../../types/expense';
import { useFinance } from '../../core/finance/useFinance';
import { motion } from 'framer-motion';

export const Overview: React.FC = () => {
  const { selectedDate } = useFinance();
  const [resolveExpense, setResolveExpense] = useState<Expense | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-12 sm:space-y-16"
    >
      {/* --- SECTION 1: EXPENSES (First) --- */}
      <section
        id="expenses"
        className="scroll-mt-24 space-y-8 sm:space-y-12"
      >
        <div className="text-center pb-1">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#F05010] block">
            Daily Journal & Ledger
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1">
            Daily Expenses
          </h1>
        </div>

        {/* Date Anchor (Prominent Visual Anchor) */}
        <DateAnchor />

        {/* Intelligent Quick Add Input */}
        <QuickAddBar />

        {/* Non-intrusive reminder for expenses missing payment method */}
        <UnspecifiedPaymentReminder onResolve={(exp) => setResolveExpense(exp)} />

        {/* Daily Ledger Table + Prominent Daily Total with Payment Breakdown */}
        <DailyLedgerList key={selectedDate} />

        {/* Monthly Calendar View */}
        <div className="pt-6 border-t border-[var(--border-subtle)]/50">
          <JournalCalendarSection />
        </div>

        {/* Transaction History / Archive */}
        <div className="pt-6 border-t border-[var(--border-subtle)]/50">
          <ExpenseHistorySection />
        </div>
      </section>

      {/* --- SECTION 2: OVERVIEW (Second) --- */}
      <section
        id="overview"
        className="scroll-mt-24 space-y-8 sm:space-y-12 pt-8 border-t border-[var(--border-subtle)]/70"
      >
        <div className="text-center pb-1">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#F05010] block">
            Executive Financial Snapshot
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1">
            Financial Overview
          </h2>
        </div>

        {/* Financial Overview Metrics */}
        <OverviewSummary />

        {/* Virtual Wallets & Savings Pots Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WalletsSummaryWidget />
          <SavingsSummaryWidget />
        </div>

        {/* Monthly Budget Tracker */}
        <BudgetCard />

        {/* Upcoming Recurring Bills */}
        <RecurringManager />
      </section>

      {/* Resolve Expense Payment Method Modal */}
      <ExpenseFormModal
        isOpen={Boolean(resolveExpense)}
        onClose={() => setResolveExpense(null)}
        initialExpense={resolveExpense}
      />
    </motion.div>
  );
};

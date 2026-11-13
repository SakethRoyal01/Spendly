import React, { useState } from 'react';
import { useFinance } from '../../core/finance/useFinance';
import { InsightsSection } from './InsightsSection';
import { SpendingPulse } from './SpendingPulse';
import { YearlyHeatmap } from './YearlyHeatmap';
import { CashFlowCard } from './CashFlowCard';
import { MonthlyRecap } from './MonthlyRecap';
import { PaymentMethodAnalytics } from './PaymentMethodAnalytics';
import { UnspecifiedPaymentReminder } from '../expenses/UnspecifiedPaymentReminder';
import { ExpenseFormModal } from '../expenses/ExpenseFormModal';
import type { Expense } from '../../types/expense';
import { calculateDailySpendingSeries } from '../../shared/utils/calculations';
import { motion } from 'framer-motion';

export const Insights: React.FC = () => {
  const { expenses, incomes, selectedMonth } = useFinance();
  const [resolveExpense, setResolveExpense] = useState<Expense | null>(null);

  const series = calculateDailySpendingSeries(expenses, selectedMonth, incomes);
  const totalMonthNet = series.reduce((sum: number, s) => sum + (s.netCashFlow ?? 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-8"
    >
      {/* Reminder if any expenses need payment details */}
      <UnspecifiedPaymentReminder onResolve={(exp: Expense) => setResolveExpense(exp)} />

      {/* 1. Primary Insights (Weekly/Monthly Report with Daily Net Cash Flow) */}
      <InsightsSection />

      {/* 2. Signature Daily Net Cash Flow Pulse Visualization */}
      <SpendingPulse
        series={series}
        totalAmount={totalMonthNet}
        periodLabel={selectedMonth}
      />

      {/* 3. Cash Flow & Net Worth */}
      <CashFlowCard />

      {/* 4. Payment Method Analytics (with Hybrid Split attribution) */}
      <PaymentMethodAnalytics />

      {/* 5. Monthly Financial Recap */}
      <MonthlyRecap />

      {/* 6. Yearly Net Cash Flow Heatmap (365 days) */}
      <YearlyHeatmap expenses={expenses} incomes={incomes} />

      {/* Resolve Expense Payment Method Modal */}
      <ExpenseFormModal
        isOpen={Boolean(resolveExpense)}
        onClose={() => setResolveExpense(null)}
        initialExpense={resolveExpense}
      />
    </motion.div>
  );
};

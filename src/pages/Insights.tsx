import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { InsightsSection } from '../components/insights/InsightsSection';
import { SpendingPulse } from '../components/insights/SpendingPulse';
import { YearlyHeatmap } from '../components/insights/YearlyHeatmap';
import { CashFlowCard } from '../components/insights/CashFlowCard';
import { MonthlyRecap } from '../components/insights/MonthlyRecap';
import { PaymentMethodAnalytics } from '../components/insights/PaymentMethodAnalytics';
import { UnspecifiedPaymentReminder } from '../components/expenses/UnspecifiedPaymentReminder';
import { ExpenseFormModal } from '../components/expenses/ExpenseFormModal';
import type { Expense } from '../types/expense';
import { calculateDailySpendingSeries } from '../utils/calculations';
import { motion } from 'framer-motion';

export const Insights: React.FC = () => {
  const { expenses, incomes, selectedMonth } = useFinance();
  const [resolveExpense, setResolveExpense] = useState<Expense | null>(null);

  const series = calculateDailySpendingSeries(expenses, selectedMonth, incomes);
  const totalMonthNet = series.reduce((sum, s) => sum + (s.netCashFlow ?? 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-8"
    >
      {/* Reminder if any expenses need payment details */}
      <UnspecifiedPaymentReminder onResolve={(exp) => setResolveExpense(exp)} />

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


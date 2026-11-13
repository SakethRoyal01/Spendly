import React, { useMemo } from 'react';
import { useFinance } from '../../core/finance/useFinance';
import { formatINR } from '../../shared/utils/currency';
import { calculateCategoryBreakdown, calculateMonthlyStats } from '../../shared/utils/calculations';
import { Sparkles } from 'lucide-react';

export const MonthlyRecap: React.FC = () => {
  const { expenses, incomes, changeTransactions, selectedMonth, currentBudget } = useFinance();

  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => e.date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const monthIncomes = useMemo(() => {
    return incomes.filter((e) => e.date.startsWith(selectedMonth));
  }, [incomes, selectedMonth]);

  const stats = useMemo(() => {
    return calculateMonthlyStats(expenses, selectedMonth, changeTransactions);
  }, [expenses, selectedMonth, changeTransactions]);

  const categoryBreakdown = useMemo(() => {
    return calculateCategoryBreakdown(monthExpenses);
  }, [monthExpenses]);

  const topCategory = categoryBreakdown[0] || null;
  const totalIncome = monthIncomes.reduce((s, i) => s + i.amount, 0);

  if (monthExpenses.length === 0 && monthIncomes.length === 0) {
    return null;
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#F05010]" />
        <h3 className="font-display text-base sm:text-lg font-extrabold text-[var(--text-primary)]">
          Monthly Financial Recap
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--bg-input)] space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-disabled)] block">
            Top Category
          </span>
          <div className="font-display text-lg font-extrabold text-[var(--text-primary)]">
            {topCategory ? topCategory.category : 'N/A'}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            {topCategory ? `${formatINR(topCategory.amount)} (${topCategory.percentage}%)` : 'No expenses'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-input)] space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-disabled)] block">
            Daily Average
          </span>
          <div className="font-display text-lg font-extrabold text-[var(--text-primary)]">
            {formatINR(stats.averageDailySpending)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Over {stats.transactionCount} transactions
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-input)] space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-disabled)] block">
            Income Captured
          </span>
          <div className="font-display text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatINR(totalIncome)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            {monthIncomes.length} inflow entries
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-input)] space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-disabled)] block">
            Budget Status
          </span>
          <div className="font-display text-lg font-extrabold text-[var(--text-primary)]">
            {currentBudget && currentBudget.overallMonthlyBudget > 0
              ? `${Math.round((stats.totalExpense / currentBudget.overallMonthlyBudget) * 100)}%`
              : 'Uncapped'}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            {currentBudget && currentBudget.overallMonthlyBudget > 0
              ? `of ${formatINR(currentBudget.overallMonthlyBudget)} limit`
              : 'No cap defined'}
          </span>
        </div>
      </div>
    </div>
  );
};

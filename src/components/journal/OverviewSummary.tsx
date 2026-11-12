import React from 'react';
import { useExpenses } from '../../hooks/useExpenses';
import { useFinance } from '../../hooks/useFinance';
import { formatINR } from '../../utils/currency';
import { formatMonthYear } from '../../utils/dates';

export const OverviewSummary: React.FC = () => {
  const { monthlyStats, selectedMonth } = useExpenses();
  const { dailyNetCashFlow } = useFinance();

  return (
    <section className="w-full max-w-2xl mx-auto my-8 sm:my-12 select-none">
      <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs">
        {/* Header Line */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--border-subtle)]">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-disabled)]">
            Financial Summary
          </span>
          <span className="px-3 py-1 rounded-full bg-[var(--bg-input)] text-xs font-display font-bold text-[var(--text-secondary)]">
            {formatMonthYear(selectedMonth)}
          </span>
        </div>

        {/* 3 Metric Tiles with Soft Tonal Separation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Month Total Expenses */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-input)] flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-secondary)] block mb-1">
              Month Spend
            </span>
            <span className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tabular-nums block">
              {formatINR(monthlyStats.totalExpense)}
            </span>
            <span className="text-[11px] font-medium text-[var(--text-disabled)] mt-2 block">
              {monthlyStats.transactionCount} {monthlyStats.transactionCount === 1 ? 'transaction' : 'transactions'}
            </span>
          </div>

          {/* Active Day Net Cash Flow (Main Flow) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-input)] flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-secondary)] block mb-1">
              Day Net Flow
            </span>
            <span
              className={`font-display text-2xl sm:text-3xl font-extrabold tabular-nums block ${
                dailyNetCashFlow > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : dailyNetCashFlow < 0
                  ? 'text-[#F05010]'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {dailyNetCashFlow > 0
                ? `+${formatINR(dailyNetCashFlow)}`
                : formatINR(Math.abs(dailyNetCashFlow))}
            </span>
            <span className="text-[11px] font-medium text-[var(--text-disabled)] mt-2 block">
              Received − Spent
            </span>
          </div>

          {/* Average Daily Spend */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-input)] flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-secondary)] block mb-1">
              Daily Average
            </span>
            <span className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tabular-nums block">
              {formatINR(monthlyStats.averageDailySpending)}
            </span>
            <span className="text-[11px] font-medium text-[var(--text-disabled)] mt-2 block">
              Per elapsed day
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

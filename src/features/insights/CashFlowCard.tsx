import React from 'react';
import { useFinance } from '../../core/finance/useFinance';
import { formatINR } from '../../shared/utils/currency';
import { TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight, ShieldCheck } from 'lucide-react';

export const CashFlowCard: React.FC = () => {
  const {
    monthlyIncome,
    monthlyChange,
    grossMonthlyExpenses,
    monthlyExpenses,
    monthlyNetCashFlow,
    totalWalletBalance,
    totalSavingsBalance,
    totalNetWorth,
    selectedMonth,
  } = useFinance();

  const isPositive = monthlyNetCashFlow >= 0;

  return (
    <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F05010] block">
            Liquidity & Capital
          </span>
          <h3 className="font-display text-base sm:text-lg font-extrabold text-[var(--text-primary)]">
            Cash Flow & Net Worth
          </h3>
        </div>
        <span className="text-xs font-bold text-[var(--text-secondary)]">{selectedMonth}</span>
      </div>

      {/* Net Worth Tile */}
      <div className="p-5 rounded-2xl bg-[var(--bg-input)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-disabled)] block">
            Total Tracked Net Worth
          </span>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1 tracking-tight tabular-nums">
            {formatINR(totalNetWorth)}
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-semibold mt-1">
            <span>Wallets: {formatINR(totalWalletBalance)}</span>
            <span>•</span>
            <span>Savings Pots: {formatINR(totalSavingsBalance)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--text-secondary)]">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Internal transfers between wallets and savings never alter net worth.</span>
        </div>
      </div>

      {/* Cash Flow 3-Tile Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Income */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-disabled)]">
              Total Inflow
            </span>
            <ArrowDownRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5 tabular-nums">
            {formatINR(monthlyIncome)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5 block">
            Verified income sources
          </span>
        </div>

        {/* Expenses / Outflow */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-disabled)]">
              Total Outflow
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#F05010]" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-extrabold text-[#F05010] mt-1.5 tabular-nums">
            {formatINR(monthlyExpenses)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5 block">
            {monthlyChange > 0
              ? `Gross: ${formatINR(grossMonthlyExpenses)} − Change: ${formatINR(monthlyChange)}`
              : 'Expenses recorded'}
          </span>
        </div>

        {/* Net Flow */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-disabled)]">
              Net Cash Flow
            </span>
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-[#F05010]" />
            )}
          </div>
          <div
            className={`font-display text-xl sm:text-2xl font-extrabold mt-1.5 tabular-nums ${
              isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#F05010]'
            }`}
          >
            {isPositive ? `+${formatINR(monthlyNetCashFlow)}` : formatINR(Math.abs(monthlyNetCashFlow))}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5 block">
            {isPositive ? 'Surplus retained' : 'Deficit this month'}
          </span>
        </div>
      </div>
    </div>
  );
};

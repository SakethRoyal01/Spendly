import React from 'react';
import { useExpenses } from '../../hooks/useExpenses';
import { formatINR } from '../../utils/currency';
import { formatMonthYear } from '../../utils/dates';
import {
  TrendingDown,
  Receipt,
  Calendar,
  Clock,
} from 'lucide-react';

export const MonthlySummaryCards: React.FC = () => {
  const { monthlyStats, selectedMonth } = useExpenses();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Expenses This Month */}
      <div className="bg-[#121615] border border-[#1e2623] rounded-2xl p-5 relative overflow-hidden group hover:border-[#2b3732] transition-colors">
        <div className="flex items-center justify-between text-zinc-400 mb-3">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Total Spent ({formatMonthYear(selectedMonth)})
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
          {formatINR(monthlyStats.totalExpense)}
        </div>
        <div className="mt-3 flex items-center text-xs text-zinc-400">
          <span className="text-zinc-500">Recorded for this month</span>
        </div>
      </div>

      {/* Transactions Count */}
      <div className="bg-[#121615] border border-[#1e2623] rounded-2xl p-5 relative overflow-hidden group hover:border-[#2b3732] transition-colors">
        <div className="flex items-center justify-between text-zinc-400 mb-3">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Total Transactions
          </span>
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
          {monthlyStats.transactionCount}
        </div>
        <div className="mt-3 flex items-center text-xs text-zinc-400">
          <span className="text-zinc-500">Expenses logged in month</span>
        </div>
      </div>

      {/* Today's Total Spending */}
      <div className="bg-[#121615] border border-[#1e2623] rounded-2xl p-5 relative overflow-hidden group hover:border-[#2b3732] transition-colors">
        <div className="flex items-center justify-between text-zinc-400 mb-3">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Today's Spending
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
          {formatINR(monthlyStats.todayExpense)}
        </div>
        <div className="mt-3 flex items-center text-xs text-zinc-400">
          <span className="text-zinc-500">Active day spend</span>
        </div>
      </div>

      {/* Daily Average Spending */}
      <div className="bg-[#121615] border border-[#1e2623] rounded-2xl p-5 relative overflow-hidden group hover:border-[#2b3732] transition-colors">
        <div className="flex items-center justify-between text-zinc-400 mb-3">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Daily Average
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
          {formatINR(monthlyStats.averageDailySpending)}
        </div>
        <div className="mt-3 flex items-center text-xs text-zinc-400">
          <span className="text-zinc-500">Per elapsed day</span>
        </div>
      </div>
    </div>
  );
};

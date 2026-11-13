import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../core/finance/useFinance';
import { formatDateLong } from '../../shared/utils/dates';
import { formatINR } from '../../shared/utils/currency';
import { CategoryBadge } from '../../shared/components/ui/Badge';
import { Button } from '../../shared/components/ui/Button';
import {
  CalendarDays,
  Plus,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import type { Expense } from '../../types/expense';

interface DailyExpensePreviewProps {
  onOpenAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
}

export const DailyExpensePreview: React.FC<DailyExpensePreviewProps> = ({
  onOpenAddExpense,
}) => {
  const navigate = useNavigate();
  const { selectedDate, selectedDateExpenses, selectedDateTotal } = useFinance();

  const previewList = selectedDateExpenses.slice(0, 4);

  return (
    <div className="bg-[#121615] border border-[#1e2623] rounded-2xl p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-[#1b2220]">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 mb-1">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Selected Date</span>
          </div>
          <h3 className="font-semibold text-zinc-100 text-base">
            {formatDateLong(selectedDate)}
          </h3>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onOpenAddExpense}
          icon={<Plus className="w-3.5 h-3.5" />}
          className="shrink-0"
        >
          Add
        </Button>
      </div>

      {/* Date Metrics */}
      <div className="grid grid-cols-2 gap-3 my-4">
        <div className="p-3 rounded-xl bg-[#0e1211] border border-[#1c2421]">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
            Day Spending
          </span>
          <span className="text-xl font-bold text-white tracking-tight tabular-nums mt-0.5 block">
            {formatINR(selectedDateTotal)}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[#0e1211] border border-[#1c2421]">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
            Transactions
          </span>
          <span className="text-xl font-bold text-white tracking-tight tabular-nums mt-0.5 block">
            {selectedDateExpenses.length}
          </span>
        </div>
      </div>

      {/* Transactions preview list */}
      <div className="flex-1 space-y-2 mb-4 overflow-y-auto max-h-[220px]">
        {selectedDateExpenses.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-6 text-center text-zinc-500">
            <Receipt className="w-8 h-8 text-zinc-600 mb-2 stroke-[1.5]" />
            <p className="text-xs text-zinc-400 font-medium">No expenses for this day</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">Click Add to record an expense</p>
          </div>
        ) : (
          previewList.map((expense: Expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f1312] border border-[#1a2320] hover:border-[#27322e] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <CategoryBadge category={expense.category} size="sm" />
                <span className="text-xs text-zinc-300 truncate">
                  {expense.description || expense.category}
                </span>
              </div>
              <span className="text-xs font-semibold text-zinc-100 tabular-nums shrink-0">
                {formatINR(expense.amount)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer link to dedicated Daily Expenses page */}
      <div className="pt-2 border-t border-[#1b2220] mt-auto">
        <Button
          variant="secondary"
          size="sm"
          className="w-full justify-between group"
          onClick={() => navigate('/expenses')}
        >
          <span>Manage Daily Expenses</span>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    </div>
  );
};


import React, { useState, useMemo } from 'react';
import type { Expense } from '../../types/expense';
import { formatINR } from '../../shared/utils/currency';
import { formatDateShort } from '../../shared/utils/dates';
import {
  eachDayOfInterval,
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameMonth,
  isAfter,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface YearlyHeatmapProps {
  expenses: Expense[];
  incomes?: Array<{ date: string; amount: number }>;
}

export const YearlyHeatmap: React.FC<YearlyHeatmapProps> = ({
  expenses,
  incomes = [],
}) => {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    startOfMonth(new Date())
  );

  const [selectedCell, setSelectedCell] = useState<{
    date: string;
    expense: number;
    income: number;
    netCashFlow: number;
    count: number;
  } | null>(null);

  // Map daily income and expenses
  const dateMap = useMemo(() => {
    const map = new Map<
      string,
      { expense: number; income: number; netCashFlow: number; count: number }
    >();

    expenses.forEach((e) => {
      const cur = map.get(e.date) || {
        expense: 0,
        income: 0,
        netCashFlow: 0,
        count: 0,
      };

      const newExp = cur.expense + e.amount;

      map.set(e.date, {
        ...cur,
        expense: newExp,
        netCashFlow: cur.income - newExp,
        count: cur.count + 1,
      });
    });

    incomes.forEach((i) => {
      const cur = map.get(i.date) || {
        expense: 0,
        income: 0,
        netCashFlow: 0,
        count: 0,
      };

      const newInc = cur.income + i.amount;

      map.set(i.date, {
        ...cur,
        income: newInc,
        netCashFlow: newInc - cur.expense,
        count: cur.count + 1,
      });
    });

    return map;
  }, [expenses, incomes]);

  // Generate dates for the selected month
  const days = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);

    // Align the first day with Monday
    const gridStart = startOfWeek(start, { weekStartsOn: 1 });
    const totalDays = eachDayOfInterval({ start: gridStart, end });

    return totalDays;
  }, [selectedMonth]);

  const getColor = (netCashFlow: number, hasActivity: boolean) => {
    if (!hasActivity) return 'var(--bg-input)';

    if (netCashFlow > 0) {
      if (netCashFlow < 1000) return '#10b98145';
      if (netCashFlow < 5000) return '#10b98180';
      return '#10b981';
    } else if (netCashFlow < 0) {
      const abs = Math.abs(netCashFlow);

      if (abs < 300) return '#F0501035';
      if (abs < 800) return '#F0501070';
      if (abs < 2000) return '#F05010B0';

      return '#F05010';
    }

    return 'var(--text-disabled)';
  };

  const today = new Date();

  const canGoNext = !isSameMonth(selectedMonth, today) &&
    !isAfter(selectedMonth, today);

  const changeMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth((current) =>
      direction === 'prev'
        ? subMonths(current, 1)
        : addMonths(current, 1)
    );
    setSelectedCell(null);
  };

  return (
    <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F05010] block">
            Monthly Activity
          </span>

          <h3 className="font-display text-base sm:text-lg font-extrabold text-[var(--text-primary)]">
            Monthly Daily Net Cash Flow
          </h3>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeMonth('prev')}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-input)] transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={17} />
          </button>

          <span className="min-w-[125px] text-center font-bold text-sm text-[var(--text-primary)]">
            {format(selectedMonth, 'MMMM yyyy')}
          </span>

          <button
            onClick={() => changeMonth('next')}
            disabled={!canGoNext}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-input)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-[var(--text-secondary)]">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#10b981]" />
          <span>+ Net Inflow</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#F05010]" />
          <span>Net Outflow</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-xs bg-[var(--bg-input)]" />
          <span>No activity</span>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-2 text-center">
          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
            <span
              key={day}
              className="text-[9px] font-extrabold tracking-wider text-[var(--text-disabled)]"
            >
              {day}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');

            const data = dateMap.get(dateStr) || {
              expense: 0,
              income: 0,
              netCashFlow: 0,
              count: 0,
            };

            const hasActivity = data.count > 0;
            const isSelected = selectedCell?.date === dateStr;
            const isCurrentMonth = isSameMonth(day, selectedMonth);
            const isFuture = isAfter(day, today) &&
              format(day, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd');

            return (
              <div key={dateStr} className="relative group flex justify-center">
                <button
                  disabled={!isCurrentMonth || isFuture}
                  onClick={() => {
                    if (isCurrentMonth && !isFuture) {
                      setSelectedCell({ date: dateStr, ...data });
                    }
                  }}
                  className={`aspect-square w-full max-w-[40px] rounded-md transition-all duration-200 ${!isCurrentMonth
                    ? 'opacity-0 pointer-events-none'
                    : isFuture
                      ? 'opacity-20 cursor-not-allowed'
                      : 'cursor-pointer hover:scale-110 hover:ring-1 hover:ring-[var(--text-secondary)]/40'
                    } ${isSelected
                      ? 'ring-2 ring-[#F05010] scale-110'
                      : ''
                    }`}
                  style={{
                    backgroundColor: getColor(data.netCashFlow, hasActivity),
                  }}
                  title={`${formatDateShort(dateStr)} — Received: ${formatINR(data.income)}, Spent: ${formatINR(data.expense)}`}
                  aria-label={`${formatDateShort(dateStr)}, Received ${formatINR(data.income)}, Spent ${formatINR(data.expense)}`}
                />

                {/* Hover Tooltip */}
                {isCurrentMonth && !isFuture && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
      invisible opacity-0 group-hover:visible group-hover:opacity-100
      transition-all duration-200 pointer-events-none
      w-48 rounded-xl border border-[var(--border-subtle)]
      bg-[var(--bg-surface)] shadow-xl p-3">

                    <p className="text-[11px] font-extrabold text-[var(--text-primary)] mb-2">
                      {format(day, 'dd MMM yyyy')}
                    </p>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
                          Received
                        </span>
                        <span className="text-[11px] font-bold text-emerald-500">
                          +{formatINR(data.income)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
                          Spent
                        </span>
                        <span className="text-[11px] font-bold text-[#F05010]">
                          -{formatINR(data.expense)}
                        </span>
                      </div>

                      <div className="border-t border-[var(--border-subtle)] pt-2 flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-[var(--text-secondary)]">
                          Net Flow
                        </span>
                        <span className={`text-[11px] font-extrabold ${data.netCashFlow > 0
                          ? 'text-emerald-500'
                          : data.netCashFlow < 0
                            ? 'text-[#F05010]'
                            : 'text-[var(--text-primary)]'
                          }`}>
                          {data.netCashFlow > 0 ? '+' : data.netCashFlow < 0 ? '-' : ''}
                          {formatINR(Math.abs(data.netCashFlow))}
                        </span>
                      </div>
                    </div>

                    {!hasActivity && (
                      <p className="text-[9px] text-[var(--text-disabled)] mt-2">
                        No transactions recorded
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedCell && (
        <div className="p-4 rounded-2xl bg-[var(--bg-input)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-[var(--text-primary)]">
              {formatDateShort(selectedCell.date)}
            </span>

            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              {formatINR(selectedCell.income)} Received
              {' • '}
              {formatINR(selectedCell.expense)} Spent
              {' • '}
              {selectedCell.count} entries
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-disabled)]">
              Net Flow:
            </span>

            <span
              className={`font-display text-sm font-extrabold tabular-nums ${selectedCell.netCashFlow > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : selectedCell.netCashFlow < 0
                  ? 'text-[#F05010]'
                  : 'text-[var(--text-primary)]'
                }`}
            >
              {selectedCell.netCashFlow > 0 ? '+' : ''}
              {formatINR(selectedCell.netCashFlow)}
            </span>
          </div>
        </div>
      )}

    </div>
  );
};

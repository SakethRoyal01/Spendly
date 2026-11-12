import React, { useMemo } from 'react';
import { useExpenses } from '../../hooks/useExpenses';
import { useFinance } from '../../hooks/useFinance';
import {
  getCalendarGrid,
  formatMonthYear,
  getPreviousMonth,
  getNextMonth,
  getTodayDateString,
  getCurrentMonthString,
  formatDateMedium,
} from '../../utils/dates';
import { formatCompactINR, formatINR, addRupees, subtractRupees } from '../../utils/currency';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const JournalCalendarSection: React.FC = () => {
  const {
    selectedMonth,
    setSelectedMonth,
    selectedDate,
    setSelectedDate,
  } = useExpenses();

  const { transactions, dailyNetCashFlow } = useFinance();

  const gridDays = getCalendarGrid(selectedMonth, selectedDate);
  const todayStr = getTodayDateString();
  const currentMonthStr = getCurrentMonthString();

  // Aggregate daily net cash flow per date for the calendar
  const dateNetFlowMap = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; netFlow: number }>();
    transactions.forEach((tx) => {
      const existing = map.get(tx.date) || { income: 0, expense: 0, netFlow: 0 };
      if (tx.type === 'income') {
        existing.income = addRupees(existing.income, tx.amount);
      } else if (tx.type === 'expense') {
        existing.expense = addRupees(existing.expense, tx.amount);
      }
      existing.netFlow = subtractRupees(existing.income, existing.expense);
      map.set(tx.date, existing);
    });
    return map;
  }, [transactions]);

  const handlePrevMonth = () => {
    setSelectedMonth(getPreviousMonth(selectedMonth));
  };

  const handleNextMonth = () => {
    setSelectedMonth(getNextMonth(selectedMonth));
  };

  const handleSelectDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    // Smooth scroll up to ledger
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  return (
    <section className="w-full max-w-2xl mx-auto my-8 sm:my-12 select-none">
      <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[var(--border-subtle)] gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-disabled)] block">
              Calendar View
            </span>
            <span className="font-display text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] mt-0.5 block">
              {formatMonthYear(selectedMonth)}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Selected day Net Cash Flow pill */}
            <div className="px-3.5 py-1.5 rounded-full bg-[var(--bg-input)] text-xs font-semibold text-[var(--text-secondary)] hidden sm:flex items-center gap-1.5">
              <span>{formatDateMedium(selectedDate)} Net Flow:</span>
              <span
                className={`font-bold tabular-nums ${
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
            </div>

            {/* Month Navigation Chevrons */}
            <div className="flex items-center gap-1.5">
              {selectedMonth !== currentMonthStr && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth(currentMonthStr);
                    setSelectedDate(todayStr);
                  }}
                  className="px-3 py-1.5 rounded-full bg-[var(--bg-input)] hover:bg-[#F05010] hover:text-white text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] transition-colors cursor-pointer mr-1"
                >
                  Today
                </button>
              )}
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-9 h-9 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors text-[var(--text-primary)] cursor-pointer"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-9 h-9 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors text-[var(--text-primary)] cursor-pointer"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Weekday Row */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-bold tracking-wider text-[var(--text-disabled)] uppercase py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid (Tactile Rounded Days) */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {gridDays.map((item) => {
            const dayRecord = dateNetFlowMap.get(item.dateString);
            const hasActivity = Boolean(
              dayRecord && (dayRecord.income > 0 || dayRecord.expense > 0)
            );
            const netFlow = dayRecord ? dayRecord.netFlow : 0;
            const isSelected = item.isSelected;
            const isItemToday = item.isToday;
            const isCurrentMonth = item.isCurrentMonth;

            return (
              <button
                type="button"
                key={item.dateString}
                onClick={() => handleSelectDay(item.dateString)}
                className={`relative flex flex-col items-center justify-between py-2 px-1 rounded-2xl min-h-[56px] sm:min-h-[64px] transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#F05010] text-white shadow-sm font-bold scale-[1.02]'
                    : isItemToday
                    ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold'
                    : isCurrentMonth
                    ? 'bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] font-semibold'
                    : 'bg-transparent text-[var(--text-disabled)] hover:bg-[var(--bg-input)] opacity-40 font-medium'
                }`}
              >
                {/* Day Number */}
                <div className="flex items-center justify-center w-full">
                  <span className="text-xs sm:text-sm font-display tabular-nums">
                    {item.dayNumber}
                  </span>

                  {isItemToday && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F05010] absolute top-2 right-2" />
                  )}
                </div>

                {/* Net Flow Indicator Pill */}
                <div className="min-h-[16px] flex items-center justify-center w-full">
                  {hasActivity ? (
                    <span
                      className={`text-[9px] sm:text-[10px] tabular-nums font-bold px-1.5 py-0.5 rounded-full leading-none ${
                        isSelected
                          ? 'bg-white text-[#F05010]'
                          : netFlow > 0
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : netFlow < 0
                          ? 'bg-[#F05010]/15 text-[#F05010]'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {netFlow > 0
                        ? `+${formatCompactINR(netFlow)}`
                        : formatCompactINR(Math.abs(netFlow))}
                    </span>
                  ) : (
                    <span className="text-[10px] text-transparent">-</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

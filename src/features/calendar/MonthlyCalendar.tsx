import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useFinance } from '../../core/finance/useFinance';
import {
  getCalendarGrid,
  formatMonthYear,
  getPreviousMonth,
  getNextMonth,
  getTodayDateString,
  getCurrentMonthString,
} from '../../shared/utils/dates';
import { formatCompactINR } from '../../shared/utils/currency';

interface MonthlyCalendarProps {
  onSelectDate?: (dateStr: string) => void;
  className?: string;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  onSelectDate,
  className = '',
}) => {
  const {
    selectedMonth,
    setSelectedMonth,
    selectedDate,
    setSelectedDate,
    dateSpendingMap,
  } = useFinance();

  const gridDays = getCalendarGrid(selectedMonth, selectedDate);
  const todayStr = getTodayDateString();
  const currentMonthStr = getCurrentMonthString();

  const handlePrevMonth = () => {
    setSelectedMonth(getPreviousMonth(selectedMonth));
  };

  const handleNextMonth = () => {
    setSelectedMonth(getNextMonth(selectedMonth));
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (onSelectDate) {
      onSelectDate(dateStr);
    }
  };

  return (
    <div className={`bg-[#121615] border border-[#1e2623] rounded-2xl p-5 ${className}`}>
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-zinc-100 text-sm sm:text-base">
            {formatMonthYear(selectedMonth)}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          {selectedMonth !== currentMonthStr && (
            <button
              type="button"
              onClick={() => {
                setSelectedMonth(currentMonthStr);
                setSelectedDate(todayStr);
              }}
              className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-md hover:bg-emerald-500/10 mr-1 cursor-pointer transition-colors"
            >
              Today
            </button>
          )}

          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[11px] font-semibold tracking-wider text-zinc-500 uppercase py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {gridDays.map((item) => {
          const spending = dateSpendingMap.get(item.dateString) || 0;
          const hasExpenses = spending > 0;
          const isSelected = item.isSelected;
          const isToday = item.isToday;
          const isCurrentMonth = item.isCurrentMonth;

          return (
            <button
              type="button"
              key={item.dateString}
              onClick={() => handleDayClick(item.dateString)}
              className={`relative flex flex-col items-center justify-between py-2 px-1 rounded-xl min-h-[52px] sm:min-h-[64px] border transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500/15 border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/40 text-emerald-300'
                  : isToday
                  ? 'bg-[#18211d] border-emerald-500/30 text-white hover:bg-[#1d2723]'
                  : isCurrentMonth
                  ? 'bg-[#0f1312] border-[#1b2220] text-zinc-200 hover:bg-[#161c1a] hover:border-[#27322e]'
                  : 'bg-transparent border-transparent text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-center w-full">
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    isSelected
                      ? 'text-emerald-300 font-bold'
                      : isToday
                      ? 'text-emerald-400 font-bold'
                      : isCurrentMonth
                      ? 'text-zinc-200'
                      : 'text-zinc-600'
                  }`}
                >
                  {item.dayNumber}
                </span>

                {/* Today Small Pill */}
                {isToday && !isSelected && (
                  <span className="w-1 h-1 rounded-full bg-emerald-400 absolute top-1.5 right-1.5" />
                )}
              </div>

              {/* Spending indicator */}
              <div className="min-h-[16px] flex items-center justify-center w-full">
                {hasExpenses ? (
                  <span
                    className={`text-[10px] font-medium leading-none px-1 py-0.5 rounded truncate max-w-full tabular-nums ${
                      isSelected
                        ? 'text-emerald-200 font-semibold'
                        : 'text-emerald-400/90 bg-emerald-500/10'
                    }`}
                    title={`₹${spending.toFixed(2)}`}
                  >
                    {formatCompactINR(spending)}
                  </span>
                ) : (
                  <span className="text-[10px] text-transparent select-none">-</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

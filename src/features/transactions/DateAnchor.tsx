import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../core/finance/useFinance';
import {
  formatDateDayOfWeek,
  formatDateDayMonthYear,
  getPreviousDayString,
  getNextDayString,
  getTodayDateString,
  getCalendarGrid,
  formatMonthYear,
  getPreviousMonth,
  getNextMonth,
} from '../../shared/utils/dates';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DateAnchor: React.FC = () => {
  const { selectedDate, setSelectedDate, dateSpendingMap } = useFinance();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [monthOverride, setMonthOverride] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const todayStr = getTodayDateString();
  const isToday = selectedDate === todayStr;

  const viewMonth = monthOverride ?? selectedDate.substring(0, 7);

  // Close picker on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
        setMonthOverride(null);
      }
    };
    if (pickerOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [pickerOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pickerOpen) {
        setPickerOpen(false);
        setMonthOverride(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pickerOpen]);

  const handlePrevDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(getPreviousDayString(selectedDate));
  };

  const handleNextDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(getNextDayString(selectedDate));
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setMonthOverride(null);
    setPickerOpen(false);
  };

  const handleJumpToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(todayStr);
    setMonthOverride(null);
    setPickerOpen(false);
  };

  const calendarDays = getCalendarGrid(viewMonth, selectedDate);

  return (
    <div className="relative flex flex-col items-center justify-center my-6 sm:my-10 select-none">
      {/* Date Navigation & Display Container */}
      <div className="flex items-center justify-center gap-2 sm:gap-6 w-full max-w-xl">
        {/* Previous Day Chevron Button */}
        <button
          type="button"
          onClick={handlePrevDay}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
          title="Previous day"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
        </button>

        {/* Center Interactive Date Display */}
        <button
          type="button"
          onClick={() => {
            setMonthOverride(null);
            setPickerOpen(!pickerOpen);
          }}
          className="group flex flex-col items-center py-2 px-4 sm:px-8 rounded-3xl hover:bg-[var(--bg-secondary)]/50 transition-all cursor-pointer text-center"
          title="Click to choose a date from calendar"
          aria-expanded={pickerOpen}
        >
          {/* Day of Week & Today Badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-[0.22em] text-[var(--text-secondary)] uppercase">
              {formatDateDayOfWeek(selectedDate)}
            </span>
            {isToday && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F05010] text-white leading-none shadow-xs">
                Today
              </span>
            )}
          </div>

          {/* Date Main Text (Geometric Typography) */}
          <div className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[#F05010] transition-colors flex items-center gap-2.5">
            <span>{formatDateDayMonthYear(selectedDate)}</span>
            <CalendarIcon className="w-4 h-4 text-[var(--text-disabled)] group-hover:text-[#F05010] transition-colors hidden sm:inline-block stroke-[2.2]" />
          </div>

          <span className="text-[11px] font-medium tracking-wide text-[var(--text-disabled)] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Tap to open calendar
          </span>
        </button>

        {/* Next Day Chevron Button */}
        <button
          type="button"
          onClick={handleNextDay}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
          title="Next day"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Blockit-styled Calendar Popover */}
      <AnimatePresence>
        {pickerOpen && (
          <div className="fixed inset-0 sm:absolute sm:inset-auto sm:top-full sm:mt-4 z-50 flex items-center justify-center p-4 sm:p-0">
            {/* Backdrop on mobile */}
            <div
              className="fixed inset-0 bg-black/40 sm:hidden"
              onClick={() => {
                setPickerOpen(false);
                setMonthOverride(null);
              }}
            />

            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="relative w-full max-w-[340px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl rounded-3xl p-5 text-[var(--text-primary)] z-10"
            >
              {/* Popover Header */}
              <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-[var(--border-subtle)]">
                <span className="font-display text-base font-bold text-[var(--text-primary)]">
                  {formatMonthYear(viewMonth)}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMonthOverride(getPreviousMonth(viewMonth))}
                    className="w-8 h-8 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors text-[var(--text-primary)] cursor-pointer"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonthOverride(getNextMonth(viewMonth))}
                    className="w-8 h-8 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors text-[var(--text-primary)] cursor-pointer"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerOpen(false);
                      setMonthOverride(null);
                    }}
                    className="w-8 h-8 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] ml-1 cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[var(--text-disabled)] uppercase tracking-wider mb-2">
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
                <span>Su</span>
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((cell) => {
                  const hasExpense = (dateSpendingMap.get(cell.dateString) || 0) > 0;
                  const isSelected = cell.isSelected;
                  const isCellToday = cell.isToday;

                  return (
                    <button
                      key={cell.dateString}
                      type="button"
                      onClick={() => handleSelectDate(cell.dateString)}
                      className={`relative flex flex-col items-center justify-center h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#F05010] text-white shadow-xs'
                          : isCellToday
                          ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold'
                          : cell.isCurrentMonth
                          ? 'text-[var(--text-primary)] hover:bg-[var(--bg-input)]'
                          : 'text-[var(--text-disabled)] hover:bg-[var(--bg-input)] opacity-40'
                      }`}
                    >
                      <span>{cell.dayNumber}</span>
                      {hasExpense && !isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F05010] absolute bottom-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick shortcut */}
              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleJumpToday}
                  className="px-3 py-1.5 rounded-full bg-[var(--bg-input)] hover:bg-[#F05010] hover:text-white text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] transition-colors cursor-pointer"
                >
                  Jump to Today
                </button>
                <span className="text-[11px] font-mono text-[var(--text-disabled)] tabular-nums">
                  {selectedDate}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

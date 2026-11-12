import React from 'react';
import { JournalCalendarSection } from '../components/journal/JournalCalendarSection';
import { DateAnchor } from '../components/journal/DateAnchor';
import { DailyLedgerList } from '../components/journal/DailyLedgerList';
import { useExpenses } from '../hooks/useExpenses';
import { motion } from 'framer-motion';

export const CalendarView: React.FC = () => {
  const { selectedDate } = useExpenses();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-10"
    >
      <div className="text-center pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">
          Monthly Ledger
        </span>
      </div>

      <JournalCalendarSection />

      <div className="pt-8 border-t border-[var(--border-subtle)]">
        <DateAnchor />
        <DailyLedgerList key={selectedDate} />
      </div>
    </motion.div>
  );
};

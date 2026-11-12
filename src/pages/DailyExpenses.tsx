import React from 'react';
import { DateAnchor } from '../components/journal/DateAnchor';
import { DailyLedgerList } from '../components/journal/DailyLedgerList';
import { useExpenses } from '../hooks/useExpenses';
import { motion } from 'framer-motion';

export const DailyExpenses: React.FC = () => {
  const { selectedDate } = useExpenses();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="text-center pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">
          Daily Ledger
        </span>
      </div>

      <DateAnchor />
      <DailyLedgerList key={selectedDate} />
    </motion.div>
  );
};

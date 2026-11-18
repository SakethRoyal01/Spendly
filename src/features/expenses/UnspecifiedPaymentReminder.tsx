import React, { useState } from 'react';
import { useFinance } from '../../core/finance/useFinance';
import type { Expense, ExpenseCategory } from '../../types/expense';
import { formatINR } from '../../shared/utils/currency';
import { formatDateShort } from '../../shared/utils/dates';
import { HelpCircle, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UnspecifiedPaymentReminderProps {
  onResolve: (expense: Expense) => void;
}

export const UnspecifiedPaymentReminder: React.FC<UnspecifiedPaymentReminderProps> = ({
  onResolve,
}) => {
  const { unspecifiedExpenses, unspecifiedCount, expenses } = useFinance();
  const [isExpanded, setIsExpanded] = useState(false);

  if (unspecifiedCount === 0) return null;

  // Map to expense items
  const itemsToReview = unspecifiedExpenses.map((tx) => {
    const exp = expenses.find((e) => e.id === tx.id);
    return (
      exp || {
        id: tx.id,
        userId: tx.userId,
        amount: tx.amount,
        category: (tx.category as ExpenseCategory) || 'Other',
        description: tx.description,
        date: tx.date,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      }
    );
  });

  return (
    <div className="bg-[var(--bg-surface)] rounded-3xl p-5 sm:p-6 border border-[#F05010]/30 shadow-xs space-y-3 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F05010]/15 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-[#F05010]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
                {unspecifiedCount} {unspecifiedCount === 1 ? 'expense needs' : 'expenses need'} payment details
              </span>
              <span className="w-2 h-2 rounded-full bg-[#F05010] animate-pulse" />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Assign Cash, UPI, or Hybrid so wallet balances stay accurate.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer self-start sm:self-center"
        >
          <span>{isExpanded ? 'Hide List' : 'Review & Assign'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-2 border-t border-[var(--border-subtle)] space-y-2 overflow-hidden"
          >
            <div className="divide-y divide-[var(--border-subtle)]/70">
              {itemsToReview.map((item) => (
                <div
                  key={item.id}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-[var(--bg-input)]/50 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-bold text-[var(--text-disabled)] shrink-0">
                      {formatDateShort(item.date)}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
                      {item.description || item.category}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] shrink-0">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-display text-xs sm:text-sm font-bold text-[var(--text-primary)] tabular-nums">
                      {formatINR(item.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onResolve(item)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F05010] hover:bg-[#d94408] text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                      title="Select how this was paid"
                    >
                      <span>Assign</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

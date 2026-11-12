import React from 'react';
import { motion } from 'framer-motion';
import type { Expense } from '../../types/expense';
import { formatINR } from '../../utils/currency';
import { formatDateMedium } from '../../utils/dates';
import { CategoryBadge } from '../ui/Badge';
import { Pencil, Trash2 } from 'lucide-react';

interface TransactionItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  showDate?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  expense,
  onEdit,
  onDelete,
  showDate = false,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="group flex items-center justify-between py-3 px-2 border-b border-[var(--border-subtle)]/70 hover:bg-[var(--bg-hover)] rounded-lg transition-all"
    >
      {/* Left Details */}
      <div className="flex items-center gap-3.5 min-w-0 pr-3">
        <CategoryBadge category={expense.category} size="sm" />

        <div className="min-w-0">
          <p className="text-sm font-normal text-[var(--text-primary)] truncate">
            {expense.description || expense.category}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-0.5">
            {showDate && <span>{formatDateMedium(expense.date)}</span>}
            {showDate && <span>•</span>}
            <span className="capitalize">{expense.category}</span>
          </div>
        </div>
      </div>

      {/* Right: Amount & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-journal text-base font-normal text-[var(--text-primary)] tabular-nums">
          {formatINR(expense.amount)}
        </span>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(expense)}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-md transition-colors cursor-pointer"
            title="Edit expense"
            aria-label="Edit expense"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(expense)}
            className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
            title="Delete expense"
            aria-label="Delete expense"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

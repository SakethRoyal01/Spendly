import React, { useState, useMemo } from 'react';
import { useFinance } from '../../core/finance/useFinance';
import { ALL_CATEGORIES } from '../../shared/utils/categories';
import { formatINR } from '../../shared/utils/currency';
import { formatDateShort } from '../../shared/utils/dates';
import type { Expense } from '../../types/expense';
import { ConfirmDialog } from '../../shared/components/ui/ConfirmDialog';
import { ExpenseFormModal } from '../expenses/ExpenseFormModal';
import { Search, X, Pencil, Trash2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ExpenseHistorySection: React.FC = () => {
  const { expenses, deleteExpense, exportCSV } = useFinance();
  const { transactions } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');

  // Modal edit state
  const [modalExpense, setModalExpense] = useState<Expense | null>(null);

  // Deletion state
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Derive unique months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => set.add(e.date.substring(0, 7)));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  // Filter expenses
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = (e.description || '').toLowerCase().includes(query);
        const matchesCat = e.category.toLowerCase().includes(query);
        if (!matchesDesc && !matchesCat) return false;
      }
      if (categoryFilter !== 'ALL' && e.category !== categoryFilter) return false;
      if (monthFilter !== 'ALL' && !e.date.startsWith(monthFilter)) return false;

      if (paymentMethodFilter !== 'ALL') {
        const tx = transactions.find((t) => t.id === e.id);
        const method = tx?.paymentMethod || 'Not specified';
        if (paymentMethodFilter === 'Other') {
          if (['Cash', 'UPI', 'Hybrid', 'Not specified'].includes(method)) return false;
        } else if (method !== paymentMethodFilter) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, transactions, searchQuery, categoryFilter, monthFilter, paymentMethodFilter]);

  const filteredTotal = useMemo(() => {
    return filtered.reduce((sum, e) => sum + e.amount, 0);
  }, [filtered]);

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="w-full max-w-2xl mx-auto my-8 sm:my-12">
      <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[var(--border-subtle)] gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-disabled)] block">
              Search & Archive
            </span>
            <span className="font-display text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] mt-0.5 block">
              Expense History
            </span>
          </div>

          <button
            type="button"
            onClick={exportCSV}
            disabled={expenses.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#484848] hover:bg-[#383838] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 self-start sm:self-auto shadow-xs"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3 pb-5 mb-4 border-b border-[var(--border-subtle)]">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-disabled)] absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.2]" />
            <input
              type="text"
              placeholder="Search expenses by description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-input)] rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:ring-2 focus:ring-[#F05010]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-disabled)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills (Scrollable Blockit Pills) */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-[#F05010] text-white shadow-xs'
                  : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              All
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#F05010] text-white shadow-xs'
                    : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Payment Method Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-disabled)] tracking-wider mr-1 shrink-0">
              Payment:
            </span>
            {[
              { id: 'ALL', label: 'All Methods' },
              { id: 'Not specified', label: 'Not specified' },
              { id: 'Cash', label: 'Cash' },
              { id: 'UPI', label: 'UPI' },
              { id: 'Hybrid', label: 'Hybrid' },
              { id: 'Other', label: 'Other' },
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethodFilter(method.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  paymentMethodFilter === method.id
                    ? 'bg-[#484848] text-white shadow-xs'
                    : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>

          {/* Month Filter Selector */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-[11px] font-bold uppercase text-[var(--text-disabled)] tracking-wider">
              Filter by Month:
            </span>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              aria-label="Filter by month"
              className="bg-[var(--bg-input)] rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Recorded Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Counter Line */}
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)] mb-3 px-1">
          <span>
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} found
          </span>
          <span className="font-display text-sm font-bold text-[var(--text-primary)] tabular-nums">
            Total: {formatINR(filteredTotal)}
          </span>
        </div>

        {/* Ledger History List */}
        <div className="divide-y divide-[var(--border-subtle)]/70">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-secondary)] font-medium">
              No transactions match your search or filter criteria.
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map((item) => {
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group flex items-center justify-between py-3.5 px-2 hover:bg-[var(--bg-secondary)]/40 rounded-2xl transition-colors"
                  >
                    {/* Left: Date + Description + Category + Payment Method */}
                    <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 pr-3">
                      <span className="text-xs font-mono font-bold text-[var(--text-disabled)] w-14 shrink-0 tabular-nums">
                        {formatDateShort(item.date)}
                      </span>
                      <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {item.description || item.category}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] shrink-0">
                        {item.category}
                      </span>
                      {(() => {
                        const tx = transactions.find((t) => t.id === item.id);
                        const method = tx?.paymentMethod || 'Not specified';

                        if (method === 'Hybrid') {
                          return (
                            <button
                              type="button"
                              onClick={() => setModalExpense(item)}
                              className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F05010]/15 text-[#F05010] hover:bg-[#F05010]/25 transition-colors cursor-pointer shrink-0"
                              title="Hybrid Split payment (click to edit)"
                            >
                              Split ({tx?.splits?.length || 2})
                            </button>
                          );
                        }
                        if (method === 'Not specified') {
                          return (
                            <button
                              type="button"
                              onClick={() => setModalExpense(item)}
                              className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F05010]/10 text-[#F05010] border border-[#F05010]/30 hover:bg-[#F05010]/20 shrink-0 transition-all cursor-pointer flex items-center gap-1"
                              title="Payment method not specified — Click to assign"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F05010] animate-pulse" />
                              <span>Not specified</span>
                            </button>
                          );
                        }
                        if (method === 'UPI') {
                          return (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F05010]/10 text-[#F05010] shrink-0">
                              UPI
                            </span>
                          );
                        }
                        return (
                          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] shrink-0">
                            {method}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Right: Amount + Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)] tabular-nums">
                        {formatINR(item.amount)}
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setModalExpense(item)}
                          className="w-7 h-7 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit expense details and payment method"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpenseToDelete(item)}
                          className="w-7 h-7 rounded-full bg-[var(--bg-input)] hover:bg-red-500/15 text-[var(--text-secondary)] hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(expenseToDelete)}
        title="Remove Transaction"
        message={`Are you sure you want to remove "${
          expenseToDelete?.description || expenseToDelete?.category
        }" (${expenseToDelete ? formatINR(expenseToDelete.amount) : ''})?`}
        confirmLabel="Remove"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setExpenseToDelete(null)}
      />

      {/* Full Edit Modal */}
      <ExpenseFormModal
        isOpen={Boolean(modalExpense)}
        onClose={() => setModalExpense(null)}
        initialExpense={modalExpense}
      />
    </section>
  );
};

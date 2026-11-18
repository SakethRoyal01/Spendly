import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFinance } from '../../core/finance/useFinance';
import { formatINR, addRupees, subtractRupees } from '../../shared/utils/currency';
import type { Expense, ExpenseCategory } from '../../types/expense';
import type { Transaction } from '../../types/finance';
import { isChangeTransaction } from '../../types/finance';
import { ConfirmDialog } from '../../shared/components/ui/ConfirmDialog';
import { ExpenseFormModal } from '../expenses/ExpenseFormModal';
import { AddMoneyModal } from '../wallets/AddMoneyModal';
import {
  Plus,
  Coins,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
  Scale,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DailyLedgerList: React.FC = () => {
  const {
    selectedDate,
    transactions,
    accounts,
    deleteTransaction,
  } = useFinance();

  // Modals state
  const [modalExpense, setModalExpense] = useState<Expense | null>(null);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);

  const [modalIncome, setModalIncome] = useState<Transaction | null>(null);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

  // Deletion confirm dialog state
  const [itemToDelete, setItemToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const addExpenseBtnRef = useRef<HTMLButtonElement>(null);

  // All transactions (expenses, incomes & change) recorded for the selected date
  const dailyTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.date === selectedDate)
      .sort((a, b) => {
        // Chronological sort: newest first
        const timeDiff = (b.createdAt || '').localeCompare(a.createdAt || '');
        if (timeDiff !== 0) return timeDiff;
        return b.id.localeCompare(a.id);
      });
  }, [transactions, selectedDate]);

  // Aggregate metrics
  const dailyExpenses = useMemo(() => {
    return dailyTransactions.filter((t) => t.type === 'expense' && !isChangeTransaction(t));
  }, [dailyTransactions]);

  // Split daily inflows into True Earned Income vs Payment Change
  const dailyRealIncomes = useMemo(() => {
    return dailyTransactions.filter(
      (t) => t.type === 'income' && !isChangeTransaction(t)
    );
  }, [dailyTransactions]);

  const dailyChangeTransactions = useMemo(() => {
    return dailyTransactions.filter((t) => isChangeTransaction(t));
  }, [dailyTransactions]);

  const grossDailyExpenses = useMemo(() => {
    return dailyExpenses.reduce((sum, t) => addRupees(sum, t.amount), 0);
  }, [dailyExpenses]);

  const totalRealIncome = useMemo(() => {
    return dailyRealIncomes.reduce((sum, t) => addRupees(sum, t.amount), 0);
  }, [dailyRealIncomes]);

  const totalChange = useMemo(() => {
    return dailyChangeTransactions.reduce((sum, t) => addRupees(sum, t.amount), 0);
  }, [dailyChangeTransactions]);

  // Money spent on the day: Change is deducted from amount spent!
  const netDailyExpenses = useMemo(() => {
    return Math.max(0, subtractRupees(grossDailyExpenses, totalChange));
  }, [grossDailyExpenses, totalChange]);

  // Daily Net Cash Flow: Real Earned Inflow − Net Outflow
  // Balanced flow: Real Inflow − Money Spent = Net Cash Flow!
  const netCashFlow = useMemo(() => {
    return subtractRupees(totalRealIncome, netDailyExpenses);
  }, [totalRealIncome, netDailyExpenses]);

  // Source breakdown for daily expenses
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    dailyExpenses.forEach((tx) => {
      const method = tx.paymentMethod || 'Not specified';
      map[method] = (map[method] || 0) + tx.amount;
    });
    return map;
  }, [dailyExpenses]);

  // Global keyboard shortcuts:
  // 'n' or '+' to add expense, 'c' or 'm' to add change (when not inside an input field)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }
      if (e.key === 'n' || e.key === 'N' || e.key === '+') {
        e.preventDefault();
        setModalExpense(null);
        setIsAddExpenseModalOpen(true);
      } else if (e.key === 'c' || e.key === 'C' || e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setModalIncome(null);
        setIsChangeModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleStartAddExpense = () => {
    setModalExpense(null);
    setIsAddExpenseModalOpen(true);
  };

  const handleStartAddChange = () => {
    setModalIncome(null);
    setIsChangeModalOpen(true);
  };

  const handleEditItem = (tx: Transaction) => {
    if (tx.type === 'income' || isChangeTransaction(tx)) {
      setModalIncome(tx);
      setIsChangeModalOpen(true);
    } else {
      // Map to Expense structure for ExpenseFormModal
      const expenseObj: Expense = {
        id: tx.id,
        userId: tx.userId,
        amount: tx.amount,
        category: (tx.category as ExpenseCategory) || 'Other',
        description: tx.description,
        date: tx.date,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      };
      setModalExpense(expenseObj);
      setIsAddExpenseModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(itemToDelete.id);
      setItemToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-6 sm:my-10 space-y-6">
      {/* Primary Surface Container: Daily Activity Ledger */}
      <div className="bg-[var(--bg-surface)] rounded-3xl p-5 sm:p-8 shadow-xs border border-[var(--border-subtle)]">
        {/* Ledger Header Line */}
        <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-[var(--border-subtle)] text-[11px] uppercase tracking-[0.22em] font-bold text-[var(--text-disabled)] select-none">
          <div className="flex items-center gap-6">
            <span className="w-8">No.</span>
            <span>Item / Activity</span>
          </div>
          <span className="text-right">Amount</span>
        </div>

        {/* Ledger Rows (Chronological Interleaved Expenses & Income) */}
        <div className="divide-y divide-[var(--border-subtle)]/70">
          <AnimatePresence initial={false}>
            {dailyTransactions.map((tx, index) => {
              const serial = (index + 1).toString().padStart(2, '0');
              const isIncome = tx.type === 'income';

              const destAcc = isIncome
                ? accounts.find((a) => a.id === tx.destinationAccountId)
                : null;

              return (
                <motion.div
                  key={tx.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="group flex items-center justify-between py-4 px-2 hover:bg-[var(--bg-secondary)]/40 rounded-2xl transition-colors"
                >
                  {/* Serial Number & Activity Details */}
                  <div className="flex items-center gap-4 sm:gap-6 min-w-0 pr-4">
                    <span className="text-xs font-mono font-bold text-[var(--text-disabled)] w-8 tabular-nums select-none shrink-0">
                      {serial}
                    </span>
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-sm sm:text-base font-semibold text-[var(--text-primary)] truncate">
                        {tx.description || tx.category}
                      </span>

                      {/* Type Badge (Change vs Income vs Expense) */}
                      {isIncome ? (
                        isChangeTransaction(tx) ? (
                          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0 border border-amber-500/30 flex items-center gap-1">
                            <Coins className="w-3 h-3 stroke-[2.5]" />
                            <span>Change</span>
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0 border border-emerald-500/30">
                            Income
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] shrink-0">
                          {tx.category}
                        </span>
                      )}

                      {/* Payment/Deposit Method Indicator */}
                      {isIncome ? (
                        isChangeTransaction(tx) ? (
                          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 shrink-0">
                            {tx.paymentMethod === 'Cash' ? 'Cash Wallet' : destAcc ? destAcc.name : 'Wallet'}
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shrink-0">
                            {tx.paymentMethod === 'Cash'
                              ? 'Cash Wallet'
                              : destAcc
                                ? `UPI • ${destAcc.name}`
                                : 'UPI / Bank'}
                          </span>
                        )
                      ) : tx.paymentMethod === 'Hybrid' ? (
                        <button
                          type="button"
                          onClick={() => handleEditItem(tx)}
                          className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F05010]/15 text-[#F05010] hover:bg-[#F05010]/25 transition-colors cursor-pointer shrink-0"
                          title="Hybrid Split payment (click to edit)"
                        >
                          Split ({tx.splits?.length || 2})
                        </button>
                      ) : tx.savingsPotId ? (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E89878]/20 text-[#F05010] shrink-0">
                          Savings
                        </span>
                      ) : (!tx.paymentMethod || tx.paymentMethod === 'Not specified') ? (
                        <button
                          type="button"
                          onClick={() => handleEditItem(tx)}
                          className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F05010]/10 text-[#F05010] border border-[#F05010]/30 hover:bg-[#F05010]/20 shrink-0 transition-all cursor-pointer flex items-center gap-1"
                          title="Payment method not specified — Click to assign"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F05010] animate-pulse" />
                          <span>Not specified</span>
                        </button>
                      ) : tx.paymentMethod === 'Cash' ? (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] shrink-0">
                          Cash
                        </span>
                      ) : tx.paymentMethod === 'UPI' ? (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F05010]/10 text-[#F05010] shrink-0">
                          UPI
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)] shrink-0">
                          {tx.paymentMethod}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-display text-base sm:text-xl font-bold tabular-nums ${
                        isIncome
                          ? tx.isChange || tx.category === 'Change'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                          : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {isIncome ? `+ ${formatINR(tx.amount)}` : formatINR(tx.amount)}
                    </span>

                    {/* Edit/Delete Actions (shown on hover or tap) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleEditItem(tx)}
                        className="w-7 h-7 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
                        title={isIncome ? 'Edit income entry' : 'Edit expense details'}
                        aria-label="Edit entry"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(tx)}
                        className="w-7 h-7 rounded-full bg-[var(--bg-input)] hover:bg-red-500/15 text-[var(--text-secondary)] hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                        title={isIncome ? 'Delete income' : 'Delete expense'}
                        aria-label="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty State when no entries */}
        {dailyTransactions.length === 0 && (
          <div className="py-12 sm:py-16 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <button
                type="button"
                onClick={handleStartAddExpense}
                className="w-11 h-11 rounded-2xl bg-[var(--bg-secondary)] hover:bg-[#F05010] hover:text-white text-[var(--text-secondary)] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                title="Add expense"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={handleStartAddChange}
                className="w-11 h-11 rounded-2xl bg-amber-500/15 hover:bg-amber-600 hover:text-white text-amber-600 dark:text-amber-400 flex items-center justify-center transition-colors cursor-pointer shadow-xs border border-amber-500/30"
                title="Record change"
              >
                <Coins className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
            <p className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)]">
              No transactions recorded for this date
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Tap "+ Add Expense" or "+ Change" below to log your daily activity.
            </p>
          </div>
        )}

        {/* Action Controls: Add Expense & Change placed side-by-side */}
        <div className="pt-5 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Primary '+ Add Expense' button */}
            <button
              ref={addExpenseBtnRef}
              type="button"
              onClick={handleStartAddExpense}
              className="group flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[var(--bg-secondary)] hover:bg-[#F05010] text-[var(--text-primary)] hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-98 shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[3] text-[#F05010] group-hover:text-white transition-colors" />
              <span>Add Expense</span>
            </button>

            {/* Dedicated '+ Change' button directly beside '+ Add Expense' */}
            <button
              type="button"
              onClick={handleStartAddChange}
              className="group flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-amber-500/15 hover:bg-amber-600 text-amber-700 dark:text-amber-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-98 shadow-xs border border-amber-500/30"
            >
              <Coins className="w-4 h-4 stroke-[2.5] text-amber-600 dark:text-amber-400 group-hover:text-white transition-colors" />
              <span>Change</span>
            </button>
          </div>

          <span className="text-[11px] font-bold text-[var(--text-disabled)] tracking-wide hidden sm:inline-block">
            Press <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--bg-secondary)] font-mono text-[10px]">N</kbd> for expense, <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--bg-secondary)] font-mono text-[10px]">C</kbd> for change
          </span>
        </div>
      </div>

      {/* --- DAILY SUMMARY SECTION: HERO NET CASH FLOW + CALCULATED SPENDING & ADDITION --- */}
      <div className="p-6 sm:p-8 bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-subtle)] shadow-xs select-none space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <span className="text-xs uppercase tracking-[0.22em] font-extrabold text-[var(--text-disabled)]">
            Daily Cash Flow Summary
          </span>
          <span className="text-xs font-bold text-[var(--text-secondary)]">
            {dailyTransactions.length} {dailyTransactions.length === 1 ? 'record' : 'records'} on this date
          </span>
        </div>

        {/* 1. HERO FLOW DISPLAY: TOTAL NET CASH FLOW PER DAY (MAIN FLOW) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-input)]/70 border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-[var(--text-secondary)]">
                Daily Net Cash Flow
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  netCashFlow > 0
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : netCashFlow < 0
                    ? 'bg-[#F05010]/10 text-[#F05010] border border-[#F05010]/20'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                {netCashFlow > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                    <span>Net Inflow</span>
                  </>
                ) : netCashFlow < 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3 stroke-[2.5]" />
                    <span>Net Outflow</span>
                  </>
                ) : (
                  <>
                    <Scale className="w-3 h-3 stroke-[2.5]" />
                    <span>Balanced Flow</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs font-medium text-[var(--text-disabled)]">
              {totalChange > 0
                ? `Money Received (Income) − Money Spent (Gross: ${formatINR(grossDailyExpenses)} − Change: ${formatINR(totalChange)})`
                : 'Money Inflow (Income) − Money Spent (Spending)'}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span
              className={`font-display text-4xl sm:text-6xl font-extrabold tracking-tight tabular-nums block ${
                netCashFlow > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : netCashFlow < 0
                  ? 'text-[#F05010]'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {netCashFlow > 0
                ? `+${formatINR(netCashFlow)}`
                : formatINR(Math.abs(netCashFlow))}
            </span>
          </div>
        </div>

        {/* 2. THE TWO CALCULATED COMPONENTS: SPENDING AND ADDITION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          {/* Component A: Total Money Received (Real Income) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-input)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-[var(--text-secondary)]">
                Money Received (Income)
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>
            <span className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums block">
              +{formatINR(totalRealIncome)}
            </span>
            <span className="text-[11px] font-medium text-[var(--text-disabled)] mt-2 block">
              {totalChange > 0
                ? `${dailyRealIncomes.length} income entries • ${formatINR(totalChange)} change deducted from spending`
                : `${dailyRealIncomes.length} ${dailyRealIncomes.length === 1 ? 'addition' : 'additions'} recorded`}
            </span>
          </div>

          {/* Component B: Total Money Spent (Spending - Change deducted) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-input)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-[var(--text-secondary)]">
                Money Spent (Spending)
              </span>
              <div className="w-6 h-6 rounded-lg bg-[#F05010]/10 text-[#F05010] flex items-center justify-center">
                <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>
            <span className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tabular-nums block">
              {formatINR(netDailyExpenses)}
            </span>
            <span className="text-[11px] font-medium text-[var(--text-disabled)] mt-2 block">
              {totalChange > 0
                ? `Gross: ${formatINR(grossDailyExpenses)} − Change: ${formatINR(totalChange)}`
                : `${dailyExpenses.length} ${dailyExpenses.length === 1 ? 'expense' : 'expenses'} logged`}
            </span>
          </div>
        </div>

        {/* 3. Source Breakdown by Payment Method */}
        {dailyExpenses.length > 0 && Object.keys(paymentBreakdown).length > 0 && (
          <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-disabled)] mr-1">
              Source Breakdown:
            </span>
            {Object.entries(paymentBreakdown).map(([method, amount]) => (
              <span
                key={method}
                className="px-2.5 py-1 rounded-full bg-[var(--bg-input)] text-[var(--text-primary)] flex items-center gap-1.5"
              >
                <span>{method}</span>
                <span className="font-display font-bold text-[#F05010]">{formatINR(amount)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        title={itemToDelete?.type === 'income' ? 'Remove Income' : 'Remove Expense'}
        message={`Are you sure you want to delete "${itemToDelete?.description || itemToDelete?.category
          }" (${itemToDelete ? formatINR(itemToDelete.amount) : ''})? This will automatically reverse the balance adjustment.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Expense Form Modal (Add & Edit) */}
      <ExpenseFormModal
        isOpen={isAddExpenseModalOpen || Boolean(modalExpense)}
        onClose={() => {
          setIsAddExpenseModalOpen(false);
          setModalExpense(null);
        }}
        initialExpense={modalExpense}
        defaultDate={selectedDate}
      />

      {/* Change / Add Money Modal (Add & Edit) */}
      <AddMoneyModal
        isOpen={isChangeModalOpen || Boolean(modalIncome)}
        onClose={() => {
          setIsChangeModalOpen(false);
          setModalIncome(null);
        }}
        initialIncome={modalIncome}
        defaultDate={selectedDate}
        mode={modalIncome?.isChange ? 'change' : isChangeModalOpen ? 'change' : 'income'}
      />
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import type { Account, Transaction } from '../../types/finance';
import type { Expense, ExpenseCategory } from '../../types/expense';
import { useFinance } from '../../core/finance/useFinance';
import { formatINR } from '../../shared/utils/currency';
import { formatDateMedium, getCurrentMonthString } from '../../shared/utils/dates';
import { CATEGORIES_CONFIG, type CategoryMeta } from '../../shared/utils/categories';
import {
  ArrowLeft,
  Banknote,
  Landmark,
  CreditCard,
  Wallet,
  Search,
  X,
  Plus,
  ArrowRightLeft,
  MoreVertical,
  Pencil,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  ShoppingBag,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AccountDetailViewProps {
  account: Account;
  onBack: () => void;
  onEditAccount: (account: Account) => void;
  onTransfer: (account: Account) => void;
  onDeposit: (account: Account) => void;
  onEditExpense: (expense: Expense) => void;
}

export interface ActivityRow {
  id: string;
  referenceId: string;
  date: string;
  createdAt: string;
  type: 'expense' | 'income' | 'transfer' | 'savings_contribution' | 'savings_withdrawal';
  title: string;
  subtitle: string;
  category?: string;
  amount: number; // Positive number representing the magnitude
  isDebit: boolean;
  paymentMethod?: string;
  isHybridPortion?: boolean;
  totalExpenseAmount?: number;
  rawExpense?: Expense;
}

export const AccountDetailView: React.FC<AccountDetailViewProps> = ({
  account,
  onBack,
  onEditAccount,
  onTransfer,
  onDeposit,
  onEditExpense,
}) => {
  const { accounts, transactions, transfers, ledgerEntries, expenses } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSES' | 'INCOME' | 'TRANSFERS' | 'SAVINGS'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_30_DAYS'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  const isCashWallet = account.type === 'cash';
  const isBankWallet = account.type === 'bank' || account.type === 'savings_account';

  const getAccountIcon = () => {
    switch (account.type) {
      case 'cash':
        return <Banknote className="w-6 h-6 text-emerald-500" />;
      case 'bank':
      case 'savings_account':
        return <Landmark className="w-6 h-6 text-blue-500" />;
      case 'credit':
        return <CreditCard className="w-6 h-6 text-purple-500" />;
      default:
        return <Wallet className="w-6 h-6 text-[#F05010]" />;
    }
  };

  // Compile all activity rows attributed to this account
  const allAccountActivity = useMemo<ActivityRow[]>(() => {
    const rows: ActivityRow[] = [];

    // Helper to turn Transaction into Expense for the edit modal
    const toExpense = (tx: Transaction): Expense => {
      const match = expenses.find((e) => e.id === tx.id);
      if (match) return match;
      return {
        id: tx.id,
        userId: tx.userId,
        amount: tx.amount,
        category: (tx.category as ExpenseCategory) || 'Other',
        description: tx.description,
        date: tx.date,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      };
    };

    // 1. Process Expenses
    transactions.forEach((tx) => {
      if (tx.type !== 'expense') return;

      // Unspecified expenses have no wallet/account allocation
      if (!tx.paymentMethod || tx.paymentMethod === 'Not specified') {
        return;
      }

      // Hybrid expense handling: check if this account funded one of the splits
      if (tx.paymentMethod === 'Hybrid' && tx.splits && tx.splits.length > 0) {
        const split = tx.splits.find((s) => s.sourceAccountId === account.id);
        if (split && split.amount > 0) {
          rows.push({
            id: `${tx.id}-${split.id || account.id}`,
            referenceId: tx.id,
            date: tx.date,
            createdAt: tx.createdAt,
            type: 'expense',
            title: tx.description || tx.category,
            subtitle: `Hybrid payment • Paid ₹${split.amount} of ₹${tx.amount} total`,
            category: tx.category,
            amount: split.amount,
            isDebit: true,
            paymentMethod: 'Hybrid',
            isHybridPortion: true,
            totalExpenseAmount: tx.amount,
            rawExpense: toExpense(tx),
          });
        }
        return;
      }

      // Single source expense handling
      const isDirectSource = tx.sourceAccountId === account.id;
      // Fallback matching if legacy transaction had no sourceAccountId stored
      const isLegacyMatch =
        !tx.sourceAccountId &&
        ((isCashWallet && tx.paymentMethod === 'Cash') ||
          (isBankWallet && tx.paymentMethod === 'UPI'));

      if (isDirectSource || isLegacyMatch) {
        rows.push({
          id: tx.id,
          referenceId: tx.id,
          date: tx.date,
          createdAt: tx.createdAt,
          type: 'expense',
          title: tx.description || tx.category,
          subtitle: `${tx.paymentMethod} payment • ${tx.category}`,
          category: tx.category,
          amount: tx.amount,
          isDebit: true,
          paymentMethod: tx.paymentMethod,
          isHybridPortion: false,
          totalExpenseAmount: tx.amount,
          rawExpense: toExpense(tx),
        });
      }
    });

    // 2. Process Income
    transactions.forEach((tx) => {
      if (tx.type !== 'income') return;
      if (tx.destinationAccountId === account.id) {
        rows.push({
          id: tx.id,
          referenceId: tx.id,
          date: tx.date,
          createdAt: tx.createdAt,
          type: 'income',
          title: tx.description || 'Income Deposit',
          subtitle: `${tx.category} • Credited to ${account.name}`,
          category: tx.category,
          amount: tx.amount,
          isDebit: false,
        });
      }
    });

    // 3. Process Transfers
    transfers.forEach((trf) => {
      if (trf.sourceAccountId === account.id) {
        const dest = accounts.find((a) => a.id === trf.destinationAccountId);
        rows.push({
          id: trf.id,
          referenceId: trf.id,
          date: trf.date,
          createdAt: trf.createdAt,
          type: 'transfer',
          title: trf.note || `Transfer to ${dest?.name || 'Account'}`,
          subtitle: `Outgoing transfer → ${dest?.name || 'Account'}`,
          amount: trf.amount,
          isDebit: true,
        });
      } else if (trf.destinationAccountId === account.id) {
        const src = accounts.find((a) => a.id === trf.sourceAccountId);
        rows.push({
          id: trf.id,
          referenceId: trf.id,
          date: trf.date,
          createdAt: trf.createdAt,
          type: 'transfer',
          title: trf.note || `Transfer from ${src?.name || 'Account'}`,
          subtitle: `Incoming transfer ← ${src?.name || 'Account'}`,
          amount: trf.amount,
          isDebit: false,
        });
      }
    });

    // 4. Process Savings Contributions & Withdrawals via Ledger
    ledgerEntries.forEach((led) => {
      if (led.accountId !== account.id) return;

      if (led.type === 'savings_contribution') {
        rows.push({
          id: led.id,
          referenceId: led.referenceId,
          date: led.date,
          createdAt: led.createdAt,
          type: 'savings_contribution',
          title: led.description || 'Savings Contribution',
          subtitle: 'Transferred to savings goal',
          amount: Math.abs(led.amount),
          isDebit: true,
        });
      } else if (led.type === 'savings_withdrawal') {
        rows.push({
          id: led.id,
          referenceId: led.referenceId,
          date: led.date,
          createdAt: led.createdAt,
          type: 'savings_withdrawal',
          title: led.description || 'Savings Withdrawal',
          subtitle: 'Withdrawn from savings goal',
          amount: Math.abs(led.amount),
          isDebit: false,
        });
      }
    });

    return rows;
  }, [account, transactions, transfers, ledgerEntries, expenses, accounts, isCashWallet, isBankWallet]);

  // Total All-Time Spending from this Account
  const totalSpentFromThisAccount = useMemo(() => {
    return allAccountActivity
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);
  }, [allAccountActivity]);

  // Filter and sort the activity rows
  const filteredActivity = useMemo(() => {
    const currentMonth = getCurrentMonthString();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().substring(0, 10);

    return allAccountActivity
      .filter((row) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = row.title.toLowerCase().includes(q);
          const matchesSub = row.subtitle.toLowerCase().includes(q);
          const matchesCat = (row.category || '').toLowerCase().includes(q);
          if (!matchesTitle && !matchesSub && !matchesCat) return false;
        }

        // Type filter
        if (typeFilter === 'EXPENSES' && row.type !== 'expense') return false;
        if (typeFilter === 'INCOME' && row.type !== 'income') return false;
        if (typeFilter === 'TRANSFERS' && row.type !== 'transfer') return false;
        if (
          typeFilter === 'SAVINGS' &&
          row.type !== 'savings_contribution' &&
          row.type !== 'savings_withdrawal'
        ) {
          return false;
        }

        // Date range filter
        if (dateFilter === 'THIS_MONTH' && !row.date.startsWith(currentMonth)) return false;
        if (dateFilter === 'LAST_30_DAYS' && row.date < thirtyDaysAgoStr) return false;

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || a.date).getTime();
        const timeB = new Date(b.createdAt || b.date).getTime();
        return sortOrder === 'NEWEST' ? timeB - timeA : timeA - timeB;
      });
  }, [allAccountActivity, searchQuery, typeFilter, dateFilter, sortOrder]);

  // Total spending for the filtered period
  const filteredPeriodSpending = useMemo(() => {
    return filteredActivity
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);
  }, [filteredActivity]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.18 }}
      className="space-y-6"
    >
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={onBack}
          className="group flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer self-start shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#F05010] group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to All Wallets</span>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDeposit(account)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
            <span>Add Money</span>
          </button>

          <button
            type="button"
            onClick={() => onTransfer(account)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#F05010]" />
            <span>Transfer</span>
          </button>

          <button
            type="button"
            onClick={() => onEditAccount(account)}
            className="p-2 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
            title="Edit wallet settings"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Account Header Hero Card */}
      <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center p-3 shadow-xs shrink-0"
              style={{
                backgroundColor: `${account.color}18`,
                border: `1.5px solid ${account.color}35`,
              }}
            >
              {getAccountIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)]">
                  {account.type.replace('_', ' ')}
                </span>
                {isCashWallet && (
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                    Physical Cash
                  </span>
                )}
                {isBankWallet && (
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                    UPI & Transfers
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1">
                {account.name}
              </h1>
              {account.description && (
                <p className="text-xs font-medium text-[var(--text-secondary)] mt-1">
                  {account.description}
                </p>
              )}
            </div>
          </div>

          {/* Balance display */}
          <div className="sm:text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-disabled)] block">
              Current Balance
            </span>
            <div
              className={`font-display text-3xl sm:text-4xl font-extrabold mt-1 tracking-tight tabular-nums ${
                account.currentBalance < 0 ? 'text-red-500' : 'text-[var(--text-primary)]'
              }`}
            >
              {formatINR(account.currentBalance)}
            </div>
            <div className="flex sm:justify-end items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                Opening Balance: {formatINR(account.openingBalance)}
              </span>
              {account.currentBalance < 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-bold text-[10px] uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3" />
                  Negative Balance
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3 Metric Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-[var(--border-subtle)]">
          <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-disabled)] block">
              {isCashWallet ? 'Total Spent Using Cash' : 'Total Spent via this Account'}
            </span>
            <div className="font-display text-xl font-extrabold text-[var(--text-primary)] tabular-nums">
              {formatINR(totalSpentFromThisAccount)}
            </div>
            <span className="text-[11px] text-[var(--text-secondary)]">
              All-time spending (includes hybrid portions)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-disabled)] block">
              Period Spending ({dateFilter === 'ALL' ? 'All Time' : dateFilter === 'THIS_MONTH' ? 'This Month' : 'Last 30 Days'})
            </span>
            <div className="font-display text-xl font-extrabold text-[#F05010] tabular-nums">
              {formatINR(filteredPeriodSpending)}
            </div>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Expenses matching current filters
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-disabled)] block">
              Total Recorded Activities
            </span>
            <div className="font-display text-xl font-extrabold text-[var(--text-primary)] tabular-nums">
              {filteredActivity.length}
            </div>
            <span className="text-[11px] text-[var(--text-secondary)]">
              {allAccountActivity.length} total ledger records
            </span>
          </div>
        </div>
      </div>

      {/* Account Activity Section */}
      <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-subtle)]">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F05010] block">
              Complete Ledger Trail
            </span>
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-[var(--text-primary)]">
              Account Activity History
            </h2>
          </div>

          {/* Date range filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {(['ALL', 'THIS_MONTH', 'LAST_30_DAYS'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setDateFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  dateFilter === filter
                    ? 'bg-[#F05010] text-white shadow-xs font-extrabold'
                    : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {filter === 'ALL' && 'All Time'}
                {filter === 'THIS_MONTH' && 'This Month'}
                {filter === 'LAST_30_DAYS' && 'Last 30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar: Search, Type Filter, Sort Order */}
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-disabled)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search activity by description or category..."
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

          {/* Type Filters & Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {(['ALL', 'EXPENSES', 'INCOME', 'TRANSFERS', 'SAVINGS'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    typeFilter === t
                      ? 'bg-[#484848] text-white shadow-xs'
                      : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  {t === 'ALL' && 'All Types'}
                  {t === 'EXPENSES' && 'Expenses'}
                  {t === 'INCOME' && 'Income'}
                  {t === 'TRANSFERS' && 'Transfers'}
                  {t === 'SAVINGS' && 'Savings'}
                </button>
              ))}
            </div>

            {/* Sort Order Selector */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[10px] font-bold uppercase text-[var(--text-disabled)]">Sort:</span>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'NEWEST' ? 'OLDEST' : 'NEWEST')}
                className="px-2.5 py-1 rounded-xl bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition-colors cursor-pointer"
              >
                {sortOrder === 'NEWEST' ? 'Newest first ↓' : 'Oldest first ↑'}
              </button>
            </div>
          </div>
        </div>

        {/* Activity Rows List */}
        <div className="divide-y divide-[var(--border-subtle)]/70 pt-2">
          {filteredActivity.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-input)] flex items-center justify-center mx-auto text-[var(--text-disabled)]">
                <Search className="w-5 h-5" />
              </div>
              <p className="font-display text-sm font-bold text-[var(--text-primary)]">
                No activity found
              </p>
              <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
                No transactions match your current search, type, or date filters for this account.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filteredActivity.map((item) => {
                const categoryConfig = item.category
                  ? (CATEGORIES_CONFIG as Record<string, CategoryMeta>)[item.category] || null
                  : null;
                const CategoryIcon = categoryConfig?.icon || ShoppingBag;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="py-3.5 px-2.5 flex items-center justify-between gap-3 hover:bg-[var(--bg-input)]/50 rounded-2xl transition-colors group"
                  >
                    {/* Left: Icon, Date, Description, Category, Subtitle */}
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-input)] flex items-center justify-center shrink-0">
                        {item.type === 'expense' && (
                          <CategoryIcon className="w-4 h-4 text-[var(--text-primary)]" />
                        )}
                        {item.type === 'income' && (
                          <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                        )}
                        {item.type === 'transfer' && (
                          <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                        )}
                        {item.type === 'savings_contribution' && (
                          <PiggyBank className="w-4 h-4 text-purple-500" />
                        )}
                        {item.type === 'savings_withdrawal' && (
                          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                            {item.title}
                          </span>

                          {/* Distinct Transaction Type Badges */}
                          {item.type === 'expense' && item.isHybridPortion && (
                            <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 shrink-0">
                              Hybrid Portion
                            </span>
                          )}
                          {item.type === 'expense' && !item.isHybridPortion && item.paymentMethod && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] shrink-0">
                              {item.paymentMethod}
                            </span>
                          )}
                          {item.type === 'income' && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0">
                              Income
                            </span>
                          )}
                          {item.type === 'transfer' && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 shrink-0">
                              Transfer
                            </span>
                          )}
                          {item.type === 'savings_contribution' && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 shrink-0">
                              Savings Pot
                            </span>
                          )}
                          {item.type === 'savings_withdrawal' && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0">
                              Pot Withdrawal
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                          <span>{formatDateMedium(item.date)}</span>
                          <span>•</span>
                          <span className="truncate">{item.subtitle}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span
                          className={`font-display text-sm sm:text-base font-extrabold tabular-nums block ${
                            item.isDebit ? 'text-[var(--text-primary)]' : 'text-emerald-500'
                          }`}
                        >
                          {item.isDebit ? '-' : '+'}
                          {formatINR(item.amount)}
                        </span>
                        {item.isHybridPortion && item.totalExpenseAmount && (
                          <span className="text-[10px] text-[var(--text-disabled)] font-bold block tabular-nums">
                            of {formatINR(item.totalExpenseAmount)}
                          </span>
                        )}
                      </div>

                      {/* Edit button if it's an expense */}
                      {item.rawExpense && (
                        <button
                          type="button"
                          onClick={() => onEditExpense(item.rawExpense!)}
                          className="w-8 h-8 rounded-full bg-[var(--bg-input)] hover:bg-[#F05010] text-[var(--text-secondary)] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit expense details and payment source"
                          aria-label="Edit expense"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
};

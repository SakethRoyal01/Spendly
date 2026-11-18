import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFinance } from '../../core/finance/useFinance';
import { WalletCard } from './WalletCard';
import { WalletFormModal } from './WalletFormModal';
import { TransferModal } from './TransferModal';
import { DepositModal } from './DepositModal';
import { AccountDetailView } from './AccountDetailView';
import { ExpenseFormModal } from '../expenses/ExpenseFormModal';
import { UnspecifiedPaymentReminder } from '../expenses/UnspecifiedPaymentReminder';
import type { Account, AccountType } from '../../types/finance';
import type { Expense, ExpenseCategory } from '../../types/expense';
import { formatINR } from '../../shared/utils/currency';
import { formatDateShort } from '../../shared/utils/dates';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowRightLeft, ShieldCheck, Info, Pencil } from 'lucide-react';

export const Wallets: React.FC = () => {
  const {
    accounts,
    transactions,
    expenses,
    totalWalletBalance,
    createAccount,
    updateAccount,
    transferBetweenAccounts,
    addIncome,
  } = useFinance();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlAccountId = searchParams.get('account');

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(urlAccountId);
  const [prevUrlAccountId, setPrevUrlAccountId] = useState(urlAccountId);

  if (prevUrlAccountId !== urlAccountId) {
    setPrevUrlAccountId(urlAccountId);
    setSelectedAccountId(urlAccountId);
  }

  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return accounts.find((a) => a.id === selectedAccountId) || null;
  }, [accounts, selectedAccountId]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [transferSource, setTransferSource] = useState<Account | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [depositAccount, setDepositAccount] = useState<Account | null>(null);

  // Selected wallet activity filter & modal edit for overview list
  const [selectedWalletFilter, setSelectedWalletFilter] = useState<string>('ALL');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleSaveAccount = async (data: {
    name: string;
    type: AccountType;
    openingBalance: number;
    color: string;
    description?: string;
  }) => {
    if (editingAccount) {
      await updateAccount(editingAccount.id, data);
    } else {
      await createAccount({ ...data, currency: 'INR' });
    }
  };

  // Filter transactions belonging to selected wallet in overview list
  const walletTransactions = transactions.filter((t) => {
    if (selectedWalletFilter === 'ALL') return true;
    if (t.sourceAccountId === selectedWalletFilter) return true;
    if (t.destinationAccountId === selectedWalletFilter) return true;
    if (t.splits?.some((s) => s.sourceAccountId === selectedWalletFilter)) return true;
    return false;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-8"
    >
      {/* Reminder banner if any expenses need payment details */}
      <UnspecifiedPaymentReminder onResolve={(exp) => setEditingExpense(exp)} />

      <AnimatePresence mode="wait">
        {selectedAccount ? (
          /* Dedicated Account Detail View */
          <AccountDetailView
            key={selectedAccount.id}
            account={selectedAccount}
            onBack={() => {
              setSelectedAccountId(null);
              setSearchParams({});
            }}
            onEditAccount={(acc) => {
              setEditingAccount(acc);
              setIsAddModalOpen(true);
            }}
            onTransfer={(acc) => {
              setTransferSource(acc);
              setIsTransferModalOpen(true);
            }}
            onDeposit={(acc) => setDepositAccount(acc)}
            onEditExpense={(exp) => setEditingExpense(exp)}
          />
        ) : (
          /* All Wallets Overview */
          <motion.div
            key="wallets-overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#F05010] block">
                  Virtual Accounts
                </span>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-0.5">
                  Wallets & Balances
                </h1>
                <p className="text-xs font-semibold text-[var(--text-secondary)] mt-1">
                  Click any wallet or bank account below to inspect its dedicated activity and spending.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {accounts.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTransferSource(accounts[0]);
                      setIsTransferModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-[#F05010]" />
                    <span>Transfer</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setEditingAccount(null);
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#F05010] text-white text-xs font-bold transition-all cursor-pointer shadow-xs hover:opacity-90"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>New Wallet</span>
                </button>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--text-disabled)] block">
                  Total Available Liquidity
                </span>
                <div className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] mt-1.5 tracking-tight tabular-nums">
                  {formatINR(totalWalletBalance)}
                </div>
                <span className="text-xs font-semibold text-[var(--text-secondary)] mt-1 block">
                  Across {accounts.length} active {accounts.length === 1 ? 'wallet' : 'wallets'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-input)] p-3 rounded-2xl border border-[var(--border-subtle)] max-w-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Balances are reconciled against all verified cash, UPI, and split transactions.</span>
              </div>
            </div>

            {/* UPI & Source Account Clarification Note */}
            <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] flex items-start gap-3">
              <Info className="w-4 h-4 text-[#F05010] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                <strong className="text-[var(--text-primary)]">Interactive Wallets:</strong> Click any
                container below to open its dedicated ledger view with detailed spending breakdowns, cash/UPI activity, and hybrid splits.
              </p>
            </div>

            {/* Wallets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {accounts.map((acc) => (
                <WalletCard
                  key={acc.id}
                  account={acc}
                  onSelect={(a) => {
                    setSelectedAccountId(a.id);
                    setSearchParams({ account: a.id });
                  }}
                  onEdit={(a) => {
                    setEditingAccount(a);
                    setIsAddModalOpen(true);
                  }}
                  onTransfer={(a) => {
                    setTransferSource(a);
                    setIsTransferModalOpen(true);
                  }}
                  onDeposit={(a) => setDepositAccount(a)}
                />
              ))}
            </div>

            {/* Account Activity Section */}
            <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F05010] block">
                    Combined Ledger
                  </span>
                  <h3 className="font-display text-lg font-extrabold text-[var(--text-primary)]">
                    Recent Wallet Movements
                  </h3>
                </div>

                {/* Filter by specific wallet */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setSelectedWalletFilter('ALL')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedWalletFilter === 'ALL'
                        ? 'bg-[#F05010] text-white shadow-xs'
                        : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    All Wallets
                  </button>
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedWalletFilter(acc.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedWalletFilter === acc.id
                          ? 'bg-[#F05010] text-white shadow-xs'
                          : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                      }`}
                    >
                      {acc.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of activity transactions */}
              <div className="divide-y divide-[var(--border-subtle)]/70">
                {walletTransactions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-secondary)] font-medium">
                    No transactions recorded for this wallet view.
                  </div>
                ) : (
                  walletTransactions.slice(0, 15).map((t) => {
                    const exp = expenses.find((e) => e.id === t.id);
                    return (
                      <div
                        key={t.id}
                        className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-[var(--bg-input)]/40 rounded-2xl transition-colors"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-3">
                          <span className="text-xs font-mono font-bold text-[var(--text-disabled)] shrink-0 w-14">
                            {formatDateShort(t.date)}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
                            {t.description || t.category}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] shrink-0">
                            {t.category}
                          </span>

                          {/* Payment badge */}
                          {t.type === 'expense' && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)] shrink-0">
                              {t.paymentMethod}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`font-display text-xs sm:text-base font-bold tabular-nums ${
                              t.type === 'income' ? 'text-emerald-500' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {t.type === 'income' ? '+' : '-'}
                            {formatINR(t.amount)}
                          </span>

                          {t.type === 'expense' && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingExpense(
                                  exp || {
                                    id: t.id,
                                    userId: t.userId,
                                    amount: t.amount,
                                    category: (t.category as ExpenseCategory) || 'Other',
                                    description: t.description,
                                    date: t.date,
                                    createdAt: t.createdAt,
                                    updatedAt: t.updatedAt,
                                  }
                                )
                              }
                              className="w-7 h-7 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
                              title="Edit expense payment details"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <WalletFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveAccount}
        initialAccount={editingAccount}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={accounts}
        initialSourceAccount={transferSource}
        onTransfer={async (data) => {
          await transferBetweenAccounts(data);
        }}
      />

      <DepositModal
        isOpen={Boolean(depositAccount)}
        onClose={() => setDepositAccount(null)}
        account={depositAccount}
        onDeposit={async (data) => {
          await addIncome({
            userId: null,
            type: 'income',
            isChange: false,
            amount: data.amount,
            category: data.category,
            description: data.description,
            date: data.date,
            paymentMethod: 'Bank Transfer',
            destinationAccountId: data.destinationAccountId,
            note: data.note,
          });
        }}
      />

      {/* Edit Expense Modal from Wallet Activity */}
      <ExpenseFormModal
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        initialExpense={editingExpense}
      />
    </motion.div>
  );
};

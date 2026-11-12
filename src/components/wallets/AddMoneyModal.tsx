import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useFinance } from '../../hooks/useFinance';
import type { IncomeCategory, Transaction } from '../../types/finance';
import { ALL_INCOME_CATEGORIES } from '../../types/finance';
import { parseAmount, formatINR } from '../../utils/currency';
import { getTodayDateString } from '../../utils/dates';
import {
  Banknote,
  Smartphone,
  Calendar,
  Clock,
  Tag,
  FileText,
  Sparkles,
} from 'lucide-react';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIncome?: Transaction | null;
  defaultDate?: string;
  mode?: 'income' | 'change';
}

const QUICK_SOURCES: Array<{
  label: string;
  category: IncomeCategory;
  defaultMethod?: 'Cash' | 'UPI';
}> = [
  { label: 'Salary', category: 'Salary', defaultMethod: 'UPI' },
  { label: 'Freelance', category: 'Freelance', defaultMethod: 'UPI' },
  { label: 'Cash Deposit', category: 'Other', defaultMethod: 'Cash' },
  { label: 'Gift', category: 'Gifts', defaultMethod: 'Cash' },
  { label: 'Refund', category: 'Refund', defaultMethod: 'UPI' },
  { label: 'Investment', category: 'Investment', defaultMethod: 'UPI' },
];

const QUICK_CHANGE_SOURCES: Array<{
  label: string;
  category: IncomeCategory;
  defaultMethod?: 'Cash' | 'UPI';
}> = [
  { label: 'Cash Change', category: 'Change', defaultMethod: 'Cash' },
  { label: 'Grocery Change', category: 'Change', defaultMethod: 'Cash' },
  { label: 'Food / Dining', category: 'Change', defaultMethod: 'Cash' },
  { label: 'Auto / Travel', category: 'Change', defaultMethod: 'Cash' },
  { label: 'Shopping Change', category: 'Change', defaultMethod: 'Cash' },
  { label: 'UPI / Online Refund', category: 'Change', defaultMethod: 'UPI' },
];

export const AddMoneyModal: React.FC<AddMoneyModalProps> = ({
  isOpen,
  onClose,
  initialIncome,
  defaultDate,
  mode = 'income',
}) => {
  const { accounts, selectedDate, addIncome, updateTransaction } = useFinance();

  const isChangeMode =
    mode === 'change' ||
    initialIncome?.isChange === true ||
    initialIncome?.category === 'Change';

  const cashAccount = accounts.find((a) => a.type === 'cash') || accounts[0];
  const bankAccounts = accounts.filter(
    (a) => a.type === 'bank' || a.type === 'savings_account'
  );
  const defaultBank = bankAccounts[0] || accounts.find((a) => a.id !== cashAccount?.id) || accounts[0];

  const getCurrentTimeString = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('Salary');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [receivedMethod, setReceivedMethod] = useState<'Cash' | 'UPI'>('Cash');
  const [bankAccountId, setBankAccountId] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever modal opens or initialIncome changes
  useEffect(() => {
    if (isOpen) {
      if (initialIncome) {
        setAmount(initialIncome.amount.toString());
        setDescription(initialIncome.description || '');
        setCategory((initialIncome.category as IncomeCategory) || (isChangeMode ? 'Change' : 'Salary'));
        setDate(initialIncome.date);

        // Parse time if createdAt exists
        if (initialIncome.createdAt && initialIncome.createdAt.includes('T')) {
          const timePart = initialIncome.createdAt.split('T')[1]?.substring(0, 5);
          setTime(timePart || getCurrentTimeString());
        } else {
          setTime(getCurrentTimeString());
        }

        const isCash =
          initialIncome.paymentMethod === 'Cash' ||
          accounts.find((a) => a.id === initialIncome.destinationAccountId)?.type === 'cash';

        setReceivedMethod(isCash ? 'Cash' : 'UPI');
        setBankAccountId(initialIncome.destinationAccountId || defaultBank?.id || '');
        setNote(initialIncome.note || '');
      } else {
        setAmount('');
        setDescription(isChangeMode ? 'Payment Change' : '');
        setCategory(isChangeMode ? 'Change' : 'Salary');
        setDate(defaultDate || selectedDate || getTodayDateString());
        setTime(getCurrentTimeString());
        setReceivedMethod('Cash');
        setBankAccountId(defaultBank?.id || '');
        setNote('');
      }
      setError(null);
    }
  }, [isOpen, initialIncome, defaultDate, selectedDate, defaultBank?.id, accounts, isChangeMode]);

  if (!isOpen) return null;

  const quickSourcesList = isChangeMode ? QUICK_CHANGE_SOURCES : QUICK_SOURCES;

  const handleSelectQuickSource = (src: (typeof QUICK_SOURCES)[0]) => {
    setDescription(src.label);
    setCategory(src.category);
    if (src.defaultMethod) {
      setReceivedMethod(src.defaultMethod);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseAmount(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!description.trim()) {
      setError(isChangeMode ? 'Please enter a description for the change' : 'Please enter a description or source for the incoming money');
      return;
    }

    let destinationAccountId: string | null = null;
    if (receivedMethod === 'Cash') {
      destinationAccountId = cashAccount?.id || accounts[0]?.id || null;
    } else {
      destinationAccountId = bankAccountId || defaultBank?.id || accounts[0]?.id || null;
      if (!destinationAccountId) {
        setError('Please select a bank account to receive UPI deposit');
        return;
      }
    }

    // Build custom createdAt ISO timestamp from chosen date + time
    let customCreatedAt = new Date().toISOString();
    try {
      const combined = new Date(`${date}T${time || '12:00'}:00`);
      if (!isNaN(combined.getTime())) {
        customCreatedAt = combined.toISOString();
      }
    } catch {
      // Fallback to now
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (initialIncome) {
        // Edit existing income transaction
        await updateTransaction(initialIncome.id, {
          type: 'income',
          isChange: isChangeMode,
          amount: parsedAmount,
          description: description.trim(),
          category,
          date,
          paymentMethod: receivedMethod,
          destinationAccountId,
          note: note.trim() || undefined,
          createdAt: customCreatedAt,
        });
      } else {
        // Add new income / change transaction
        await addIncome({
          userId: null,
          type: 'income',
          isChange: isChangeMode,
          amount: parsedAmount,
          description: description.trim(),
          category,
          date,
          paymentMethod: receivedMethod,
          destinationAccountId,
          note: note.trim() || undefined,
          createdAt: customCreatedAt,
        });
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isChangeMode
          ? initialIncome
            ? 'Edit Change'
            : 'Record Change'
          : initialIncome
          ? 'Edit Income'
          : 'Add Money'
      }
      subtitle={
        isChangeMode
          ? 'Cash or balance received back as change from your payment (replenishes your wallet without being counted as income)'
          : initialIncome
          ? 'Modify recorded incoming funds and update balances'
          : 'Record incoming funds (Income) to increase your wallet or bank balance'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* 1. Amount Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            {isChangeMode ? 'Change Amount (₹) *' : 'Amount Received (₹) *'}
          </label>
          <div className="relative">
            <span
              className={`absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold ${
                isChangeMode ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              ₹
            </span>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] focus:outline-none tabular-nums transition-colors ${
                isChangeMode ? 'focus:border-amber-500' : 'focus:border-emerald-500'
              }`}
              autoFocus
            />
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-disabled)]">
            <Sparkles className={`w-3.5 h-3.5 ${isChangeMode ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
            <span>{isChangeMode ? 'Common Change Scenarios' : 'Common Sources'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickSourcesList.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleSelectQuickSource(item)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  description === item.label
                    ? isChangeMode
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[var(--bg-input)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Description / Source & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              {isChangeMode ? 'Change Description *' : 'Source / Description *'}
            </label>
            <input
              type="text"
              required
              placeholder={isChangeMode ? 'e.g. Grocery change, Auto change, Lunch change' : 'e.g. Salary, Client payment, Refund'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none transition-colors ${
                isChangeMode ? 'focus:border-amber-500' : 'focus:border-emerald-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncomeCategory)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 appearance-none transition-colors cursor-pointer"
              >
                {ALL_INCOME_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Tag className="w-4 h-4 text-[var(--text-disabled)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 3. Date & Time Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Date *
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              />
              <Calendar className="w-4 h-4 text-[var(--text-disabled)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Time
            </label>
            <div className="relative">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              />
              <Clock className="w-4 h-4 text-[var(--text-disabled)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 4. Received Through Selector: Cash vs UPI */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Received Through *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setReceivedMethod('Cash')}
              className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                receivedMethod === 'Cash'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-xs'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-input)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  receivedMethod === 'Cash'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                <Banknote className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-extrabold uppercase tracking-wide text-[var(--text-primary)]">
                  Cash Wallet
                </span>
                <span className="text-[11px] text-[var(--text-secondary)] block truncate">
                  Balance: {formatINR(cashAccount?.currentBalance ?? 0)}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setReceivedMethod('UPI')}
              className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                receivedMethod === 'UPI'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-xs'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-input)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  receivedMethod === 'UPI'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                <Smartphone className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-extrabold uppercase tracking-wide text-[var(--text-primary)]">
                  UPI / Bank
                </span>
                <span className="text-[11px] text-[var(--text-secondary)] block truncate">
                  Direct to Bank Account
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* 5. Bank Account Selector (Only shown if UPI selected) */}
        {receivedMethod === 'UPI' && (
          <div className="p-4 rounded-2xl bg-[var(--bg-input)]/70 border border-[var(--border-subtle)] space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Deposit Bank Account *
            </label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {bankAccounts.length > 0 ? (
                bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — Balance: {formatINR(acc.currentBalance)}
                  </option>
                ))
              ) : (
                <option value={defaultBank?.id || ''}>
                  {defaultBank?.name || 'Main Bank Account'}
                </option>
              )}
            </select>
            <p className="text-[11px] text-[var(--text-secondary)]">
              The incoming UPI amount will be credited to this bank account balance.
            </p>
          </div>
        )}

        {/* 6. Optional Note */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Optional Note
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Additional memo or reference ID"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <FileText className="w-4 h-4 text-[var(--text-disabled)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className={
              isChangeMode
                ? '!bg-amber-600 hover:!bg-amber-700 !text-white'
                : '!bg-emerald-600 hover:!bg-emerald-700 !text-white'
            }
          >
            {isSubmitting
              ? 'Saving...'
              : isChangeMode
              ? initialIncome
                ? 'Update Change'
                : 'Record Change'
              : initialIncome
              ? 'Update Income'
              : 'Add Money'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

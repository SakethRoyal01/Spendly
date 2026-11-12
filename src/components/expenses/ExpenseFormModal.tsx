import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ALL_CATEGORIES, CATEGORIES_CONFIG } from '../../utils/categories';
import type { Expense, ExpenseCategory } from '../../types/expense';
import type { PaymentMethod, TransactionSplit } from '../../types/finance';
import { useFinance } from '../../hooks/useFinance';
import { isValidAmount, parseAmount, formatINR, toPaise } from '../../utils/currency';
import { getTodayDateString } from '../../utils/dates';
import {
  Calendar,
  FileText,
  Check,
  PiggyBank,
  HelpCircle,
  Banknote,
  Smartphone,
  Split,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialExpense?: Expense | null;
  defaultDate?: string;
}

interface FormContentProps {
  initialExpense?: Expense | null;
  defaultDate?: string;
  onClose: () => void;
}

const ExpenseFormContent: React.FC<FormContentProps> = ({
  initialExpense,
  defaultDate,
  onClose,
}) => {
  const { accounts, savingsPots, selectedDate, addExpense, updateTransaction, transactions } =
    useFinance();

  // Find underlying transaction if editing
  const underlyingTx = initialExpense
    ? transactions.find((t) => t.id === initialExpense.id)
    : null;

  const isInitiallyUnspecified = Boolean(
    initialExpense &&
      (!underlyingTx?.paymentMethod || underlyingTx.paymentMethod === 'Not specified')
  );

  const [amount, setAmount] = useState<string>(
    initialExpense ? initialExpense.amount.toString() : ''
  );
  const [category, setCategory] = useState<ExpenseCategory>(
    initialExpense ? initialExpense.category : 'Food'
  );
  const [description, setDescription] = useState<string>(
    initialExpense?.description || ''
  );
  const [date, setDate] = useState<string>(
    initialExpense?.date || defaultDate || selectedDate || getTodayDateString()
  );

  // Available cash and bank accounts
  const cashAccount = accounts.find((a) => a.type === 'cash') || accounts[0];
  const bankAccounts = accounts.filter((a) => a.type === 'bank' || a.type === 'savings_account');
  const defaultBankAcc = bankAccounts[0] || accounts.find((a) => a.id !== cashAccount?.id) || accounts[0];

  // Payment method state: default to 'Cash' if new, or underlying tx method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    if (underlyingTx?.paymentMethod) return underlyingTx.paymentMethod;
    if (initialExpense) return 'Not specified';
    return 'Cash';
  });

  const [sourceAccountId, setSourceAccountId] = useState<string>(() => {
    if (underlyingTx?.sourceAccountId) return underlyingTx.sourceAccountId;
    if (paymentMethod === 'Cash') return cashAccount?.id || '';
    if (paymentMethod === 'UPI') return defaultBankAcc?.id || '';
    return cashAccount?.id || '';
  });

  const [savingsPotId, setSavingsPotId] = useState<string>(
    underlyingTx?.savingsPotId || ''
  );
  const [isFundedBySavings, setIsFundedBySavings] = useState<boolean>(
    Boolean(underlyingTx?.savingsPotId)
  );

  // Dedicated state for Hybrid Cash & UPI breakdown
  const initialCashSplit = underlyingTx?.splits?.find(
    (s) => s.paymentMethod === 'Cash' || accounts.find((a) => a.id === s.sourceAccountId)?.type === 'cash'
  );
  const initialUpiSplit = underlyingTx?.splits?.find(
    (s) => s.paymentMethod === 'UPI' || accounts.find((a) => a.id === s.sourceAccountId)?.type === 'bank'
  );

  const [hybridCashAmount, setHybridCashAmount] = useState<string>(() => {
    if (initialCashSplit) return initialCashSplit.amount.toString();
    if (initialExpense && underlyingTx?.paymentMethod === 'Hybrid') {
      return (initialExpense.amount / 2).toString();
    }
    return '';
  });

  const [hybridUpiAmount, setHybridUpiAmount] = useState<string>(() => {
    if (initialUpiSplit) return initialUpiSplit.amount.toString();
    if (initialExpense && underlyingTx?.paymentMethod === 'Hybrid') {
      return (initialExpense.amount / 2).toString();
    }
    return '';
  });

  const [hybridBankAccountId, setHybridBankAccountId] = useState<string>(() => {
    if (initialUpiSplit?.sourceAccountId) return initialUpiSplit.sourceAccountId;
    return defaultBankAcc?.id || accounts[0]?.id || '';
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ amount?: string; date?: string; general?: string }>({});

  const isEditing = Boolean(initialExpense);

  const handleSelectMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setIsFundedBySavings(false);

    if (method === 'Cash') {
      if (cashAccount) setSourceAccountId(cashAccount.id);
    } else if (method === 'UPI') {
      if (defaultBankAcc) setSourceAccountId(defaultBankAcc.id);
    } else if (method === 'Hybrid') {
      const parsed = parseAmount(amount);
      if (parsed !== null && parsed > 0 && (!hybridCashAmount || !hybridUpiAmount)) {
        const half = Math.round((parsed / 2) * 100) / 100;
        const remaining = Math.round((parsed - half) * 100) / 100;
        setHybridCashAmount(half.toString());
        setHybridUpiAmount(remaining.toString());
      }
    } else if (method === 'Not specified') {
      setSourceAccountId('');
    }
  };

  // Hybrid auto-calculation helpers
  const handleHybridCashChange = (val: string) => {
    setHybridCashAmount(val);
    const parsedTotal = parseAmount(amount);
    const cashVal = parseFloat(val);
    if (parsedTotal !== null && parsedTotal > 0 && !isNaN(cashVal) && cashVal >= 0 && cashVal <= parsedTotal) {
      const remaining = Math.round((parsedTotal - cashVal) * 100) / 100;
      setHybridUpiAmount(remaining >= 0 ? remaining.toString() : '0');
    }
  };

  const handleHybridUpiChange = (val: string) => {
    setHybridUpiAmount(val);
    const parsedTotal = parseAmount(amount);
    const upiVal = parseFloat(val);
    if (parsedTotal !== null && parsedTotal > 0 && !isNaN(upiVal) && upiVal >= 0 && upiVal <= parsedTotal) {
      const remaining = Math.round((parsedTotal - upiVal) * 100) / 100;
      setHybridCashAmount(remaining >= 0 ? remaining.toString() : '0');
    }
  };

  const handleSplitFiftyFifty = () => {
    const parsedTotal = parseAmount(amount);
    if (parsedTotal !== null && parsedTotal > 0) {
      const half = Math.round((parsedTotal / 2) * 100) / 100;
      const remaining = Math.round((parsedTotal - half) * 100) / 100;
      setHybridCashAmount(half.toString());
      setHybridUpiAmount(remaining.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { amount?: string; date?: string; general?: string } = {};

    if (!amount.trim()) {
      newErrors.amount = 'Please enter an expense amount';
    } else if (!isValidAmount(amount)) {
      newErrors.amount = 'Amount must be a valid positive number greater than 0';
    }

    if (!date) {
      newErrors.date = 'Please select a date';
    }

    const parsed = parseAmount(amount);
    if (parsed === null || parsed <= 0) {
      newErrors.amount = 'Invalid amount entered';
    }

    // Hybrid split validation
    let resolvedSplits: TransactionSplit[] | undefined = undefined;
    if (paymentMethod === 'Hybrid' && !isFundedBySavings && parsed !== null) {
      const cashNum = parseAmount(hybridCashAmount);
      const upiNum = parseAmount(hybridUpiAmount);

      if (cashNum === null || cashNum < 0 || upiNum === null || upiNum < 0) {
        newErrors.general = 'Please enter valid Cash and UPI amounts for Hybrid payment';
      } else if (cashNum === 0 && upiNum === 0) {
        newErrors.general = 'Cash amount and UPI amount cannot both be zero';
      } else if (toPaise(cashNum + upiNum) !== toPaise(parsed)) {
        newErrors.general = `Cash (₹${cashNum}) + UPI (₹${upiNum}) must equal total expense of ₹${parsed}`;
      } else if (!hybridBankAccountId) {
        newErrors.general = 'Please select a bank account for the UPI portion';
      } else {
        const cashAcc = accounts.find((a) => a.type === 'cash') || accounts[0];
        resolvedSplits = [
          {
            id: initialCashSplit?.id || 'split-cash',
            sourceAccountId: cashAcc?.id || accounts[0]?.id,
            amount: cashNum,
            paymentMethod: 'Cash',
          },
          {
            id: initialUpiSplit?.id || 'split-upi',
            sourceAccountId: hybridBankAccountId,
            amount: upiNum,
            paymentMethod: 'UPI',
          },
        ];
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      let resolvedSourceAccId: string | null = null;
      if (!isFundedBySavings) {
        if (paymentMethod === 'Cash') {
          resolvedSourceAccId =
            sourceAccountId || cashAccount?.id || accounts[0]?.id || null;
        } else if (paymentMethod === 'UPI') {
          resolvedSourceAccId =
            sourceAccountId || defaultBankAcc?.id || accounts[0]?.id || null;
        } else if (paymentMethod !== 'Hybrid' && paymentMethod !== 'Not specified') {
          resolvedSourceAccId = sourceAccountId || accounts[0]?.id || null;
        }
      }

      const payload = {
        userId: null,
        type: 'expense' as const,
        amount: parsed!,
        category,
        description: description.trim(),
        date,
        paymentMethod: isFundedBySavings ? ('Other' as PaymentMethod) : paymentMethod,
        sourceAccountId: resolvedSourceAccId,
        savingsPotId: isFundedBySavings ? savingsPotId : null,
        splits: paymentMethod === 'Hybrid' && !isFundedBySavings ? resolvedSplits : undefined,
      };

      if (isEditing && initialExpense) {
        await updateTransaction(initialExpense.id, payload);
      } else {
        await addExpense(payload);
      }
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save expense';
      setErrors({ general: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hybrid live validation calculation
  const parsedTotal = parseAmount(amount) || 0;
  const cashSplitNum = parseFloat(hybridCashAmount) || 0;
  const upiSplitNum = parseFloat(hybridUpiAmount) || 0;
  const hybridAllocated = cashSplitNum + upiSplitNum;
  const hybridDiff = Math.round((parsedTotal - hybridAllocated) * 100) / 100;
  const isHybridExact = parsedTotal > 0 && Math.abs(hybridDiff) < 0.01;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Outstanding payment prompt when opening an expense with no payment method */}
      {isInitiallyUnspecified && (
        <div className="p-4 rounded-2xl bg-[#F05010]/10 border border-[#F05010]/30 space-y-2.5">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#F05010]" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F05010]">
              Payment Details Needed
            </span>
          </div>
          <p className="text-sm font-bold text-[var(--text-primary)]">
            How did you pay for this expense?
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Choose a payment method below to accurately reflect this in your wallet balances:
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleSelectMethod('Cash')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                paymentMethod === 'Cash'
                  ? 'bg-[#F05010] text-white border-[#F05010] shadow-xs'
                  : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border-[var(--border-subtle)] text-[var(--text-primary)]'
              }`}
            >
              <Banknote className="w-3.5 h-3.5 text-emerald-500" />
              <span>Cash</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMethod('UPI')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                paymentMethod === 'UPI'
                  ? 'bg-[#F05010] text-white border-[#F05010] shadow-xs'
                  : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border-[var(--border-subtle)] text-[var(--text-primary)]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#F05010]" />
              <span>UPI</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMethod('Hybrid')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                paymentMethod === 'Hybrid'
                  ? 'bg-[#F05010] text-white border-[#F05010] shadow-xs'
                  : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border-[var(--border-subtle)] text-[var(--text-primary)]'
              }`}
            >
              <Split className="w-3.5 h-3.5 text-blue-500" />
              <span>Hybrid</span>
            </button>
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div>
        <label
          htmlFor="expense-amount"
          className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
        >
          Amount (INR) <span className="text-[#F05010]">*</span>
        </label>
        <div className="relative rounded-2xl overflow-hidden border border-[var(--border-subtle)] focus-within:border-[#F05010] bg-[var(--bg-input)] transition-all">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-muted)] font-extrabold text-xl">
            ₹
          </span>
          <input
            id="expense-amount"
            type="number"
            step="any"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
            }}
            className="w-full pl-10 pr-4 py-3 bg-transparent text-xl font-display font-extrabold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none tabular-nums"
            autoFocus
          />
        </div>
        {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
      </div>

      {/* --- PAYMENT METHOD SELECTOR (PROMINENT DIRECTLY AFTER AMOUNT) --- */}
      <div className="pt-1 space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[var(--text-primary)]">
            Payment Method
          </label>

          {savingsPots.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsFundedBySavings(!isFundedBySavings);
                if (!isFundedBySavings && !savingsPotId) {
                  setSavingsPotId(savingsPots[0]?.id || '');
                }
              }}
              className="text-[11px] font-bold text-[#F05010] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <PiggyBank className="w-3.5 h-3.5" />
              <span>{isFundedBySavings ? 'Standard Wallet' : 'Pay from Savings'}</span>
            </button>
          )}
        </div>

        {isFundedBySavings ? (
          /* Option A: Paid directly from a Savings Goal/Pot */
          <div className="p-3.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E89878] block">
              Direct Savings Pot Deduction
            </span>
            <select
              value={savingsPotId}
              onChange={(e) => setSavingsPotId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none"
            >
              <option value="">Select Savings Pot</option>
              {savingsPots.map((pot) => (
                <option key={pot.id} value={pot.id}>
                  {pot.name} (Saved: {formatINR(pot.currentAmount)})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Reduces this savings pot balance and marks expense as goal-funded.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 4 Clear Tactile Segmented Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSelectMethod('Cash')}
                className={`py-2.5 px-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  paymentMethod === 'Cash'
                    ? 'bg-[#F05010] text-white border-[#F05010] shadow-xs font-extrabold'
                    : 'bg-[var(--bg-input)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Banknote className="w-4 h-4 shrink-0" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMethod('UPI')}
                className={`py-2.5 px-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  paymentMethod === 'UPI'
                    ? 'bg-[#F05010] text-white border-[#F05010] shadow-xs font-extrabold'
                    : 'bg-[var(--bg-input)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>UPI</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMethod('Hybrid')}
                className={`py-2.5 px-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  paymentMethod === 'Hybrid'
                    ? 'bg-[#F05010] text-white border-[#F05010] shadow-xs font-extrabold'
                    : 'bg-[var(--bg-input)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Split className="w-4 h-4 shrink-0" />
                <span>Hybrid</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMethod('Not specified')}
                className={`py-2.5 px-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  paymentMethod === 'Not specified'
                    ? 'bg-[#F05010] text-white border-[#F05010] shadow-xs font-extrabold'
                    : 'bg-[var(--bg-input)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">Not specified</span>
              </button>
            </div>

            {/* --- CASH METHOD DETAIL --- */}
            {paymentMethod === 'Cash' && (
              <div className="p-3.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-[var(--text-primary)] block">
                      Cash Wallet Deduction
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      Available balance: {formatINR(cashAccount?.currentBalance ?? 0)}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0">
                  Deducts {formatINR(parseAmount(amount) || 0)}
                </span>
              </div>
            )}

            {/* --- UPI METHOD DETAIL --- */}
            {paymentMethod === 'UPI' && (
              <div className="p-3.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#F05010]" />
                    <span className="text-xs font-extrabold text-[var(--text-primary)]">
                      Deduct via UPI from Bank Account:
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#F05010] bg-[#F05010]/10 px-2.5 py-0.5 rounded-full">
                    UPI Payment
                  </span>
                </div>

                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none"
                >
                  {bankAccounts.length > 0 ? (
                    bankAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Balance: {formatINR(a.currentBalance)})
                      </option>
                    ))
                  ) : (
                    accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Balance: {formatINR(a.currentBalance)})
                      </option>
                    ))
                  )}
                </select>

                <p className="text-[11px] text-[var(--text-secondary)]">
                  The full expense amount of {formatINR(parseAmount(amount) || 0)} will be deducted from this bank account.
                </p>
              </div>
            )}

            {/* --- HYBRID METHOD DETAIL (CASH + UPI SPLIT) --- */}
            {paymentMethod === 'Hybrid' && (
              <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[var(--border-subtle)]">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F05010] block">
                      Hybrid Split Breakdown
                    </span>
                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                      Total: {formatINR(parsedTotal)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSplitFiftyFifty}
                      disabled={parsedTotal <= 0}
                      className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--bg-surface)] hover:bg-[#F05010] hover:text-white transition-colors border border-[var(--border-subtle)] cursor-pointer disabled:opacity-40"
                    >
                      50 / 50 Split
                    </button>

                    {isHybridExact ? (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Matched</span>
                      </span>
                    ) : (
                      <span
                        className={`text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-full ${
                          hybridDiff < 0
                            ? 'text-red-500 bg-red-500/10'
                            : 'text-[#F05010] bg-[#F05010]/10'
                        }`}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>
                          {hybridDiff < 0
                            ? `Over by ${formatINR(Math.abs(hybridDiff))}`
                            : `Remaining: ${formatINR(hybridDiff)}`}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Split inputs: Cash & UPI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Cash Portion */}
                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Cash Portion</span>
                      </span>
                      <span className="text-[10px] font-bold text-[var(--text-disabled)]">
                        Cash Wallet
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-[var(--text-muted)]">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        value={hybridCashAmount}
                        onChange={(e) => handleHybridCashChange(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-sm font-extrabold text-[var(--text-primary)] focus:outline-none tabular-nums"
                      />
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)] block">
                      Avail: {formatINR(cashAccount?.currentBalance ?? 0)}
                    </span>
                  </div>

                  {/* UPI Portion */}
                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-[#F05010]" />
                        <span>UPI Portion</span>
                      </span>
                      <span className="text-[10px] font-bold text-[var(--text-disabled)]">
                        Bank UPI
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-[var(--text-muted)]">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        value={hybridUpiAmount}
                        onChange={(e) => handleHybridUpiChange(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-sm font-extrabold text-[var(--text-primary)] focus:outline-none tabular-nums"
                      />
                    </div>

                    {/* Bank account dropdown for UPI */}
                    <div className="pt-0.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
                        Bank for UPI:
                      </label>
                      <select
                        value={hybridBankAccountId}
                        onChange={(e) => setHybridBankAccountId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
                      >
                        {bankAccounts.length > 0 ? (
                          bankAccounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({formatINR(a.currentBalance)})
                            </option>
                          ))
                        ) : (
                          accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({formatINR(a.currentBalance)})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)]">
                  Only the Cash portion is deducted from your Cash Wallet, and only the UPI portion is deducted from your bank.
                </p>
              </div>
            )}

            {/* --- NOT SPECIFIED METHOD DETAIL --- */}
            {paymentMethod === 'Not specified' && (
              <div className="p-3.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-start gap-3">
                <Info className="w-4 h-4 text-[#F05010] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-[var(--text-primary)]">
                    Payment method not specified
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    This expense is counted in your daily and monthly spending totals, but <strong>no money will be deducted</strong> from your Cash Wallet or Bank Accounts. You can assign how it was paid at any time later.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Selector */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
          Category <span className="text-[#F05010]">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ALL_CATEGORIES.map((catKey) => {
            const meta = CATEGORIES_CONFIG[catKey];
            const Icon = meta.icon;
            const isSelected = category === catKey;

            return (
              <button
                type="button"
                key={catKey}
                onClick={() => setCategory(catKey)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-[#F05010] text-white border-[#F05010] shadow-xs'
                    : 'bg-[var(--bg-input)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{catKey}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Selector */}
      <div>
        <label
          htmlFor="expense-date"
          className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
        >
          Date <span className="text-[#F05010]">*</span>
        </label>
        <div className="relative rounded-2xl border border-[var(--border-subtle)] focus-within:border-[#F05010] bg-[var(--bg-input)] transition-all">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
            <Calendar className="w-4 h-4" />
          </span>
          <input
            id="expense-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent text-xs font-bold text-[var(--text-primary)] focus:outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="expense-description"
          className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
        >
          Description
        </label>
        <div className="relative rounded-2xl border border-[var(--border-subtle)] focus-within:border-[#F05010] bg-[var(--bg-input)] transition-all">
          <span className="absolute top-3 left-3.5 pointer-events-none text-[var(--text-muted)]">
            <FileText className="w-4 h-4" />
          </span>
          <input
            id="expense-description"
            type="text"
            placeholder="e.g. Grocery store, Uber ride, Flight booking..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
            maxLength={120}
          />
        </div>
      </div>

      {/* Submit / Cancel Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? (
            'Saving...'
          ) : (
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isEditing ? 'Update Expense' : 'Save Expense'}</span>
            </span>
          )}
        </Button>
      </div>
    </form>
  );
};

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  initialExpense,
  defaultDate,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialExpense ? 'Edit Expense Record' : 'Record New Expense'}
    >
      <ExpenseFormContent
        initialExpense={initialExpense}
        defaultDate={defaultDate}
        onClose={onClose}
      />
    </Modal>
  );
};

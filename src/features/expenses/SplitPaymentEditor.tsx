import React from 'react';
import type { Account, PaymentMethod, TransactionSplit } from '../../types/finance';
import { formatINR, toPaise, toRupees } from '../../shared/utils/currency';
import { Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface SplitPaymentEditorProps {
  totalAmount: number;
  accounts: Account[];
  splits: TransactionSplit[];
  onChange: (splits: TransactionSplit[]) => void;
}

const generateSplitId = () => Math.random().toString(36).substring(2, 9);

export const SplitPaymentEditor: React.FC<SplitPaymentEditorProps> = ({
  totalAmount,
  accounts,
  splits,
  onChange,
}) => {
  const allocatedPaise = splits.reduce((sum, s) => sum + toPaise(s.amount), 0);
  const totalPaise = toPaise(totalAmount);
  const remainingRupees = toRupees(totalPaise - allocatedPaise);
  const isExact = allocatedPaise === totalPaise && totalPaise > 0;

  const handleAddSplit = () => {
    // Pick first unused account or first account
    const usedIds = new Set(splits.map((s) => s.sourceAccountId));
    const nextAcc = accounts.find((a) => !usedIds.has(a.id)) || accounts[0];
    const defaultAmt = remainingRupees > 0 ? remainingRupees : 0;

    const newSplit: TransactionSplit = {
      id: generateSplitId(),
      sourceAccountId: nextAcc?.id || '',
      amount: defaultAmt,
      paymentMethod: nextAcc?.type === 'cash' ? 'Cash' : 'UPI',
    };

    onChange([...splits, newSplit]);
  };

  const handleUpdateSplit = (index: number, updates: Partial<TransactionSplit>) => {
    const updated = splits.map((s, idx) => (idx === index ? { ...s, ...updates } : s));
    onChange(updated);
  };

  const handleRemoveSplit = (index: number) => {
    if (splits.length <= 1) return;
    const updated = splits.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  return (
    <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F05010] block">
            Split Payment Breakdown
          </span>
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Total: {formatINR(totalAmount)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold">
          {isExact ? (
            <span className="text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Fully Allocated</span>
            </span>
          ) : (
            <span
              className={`flex items-center gap-1 ${
                remainingRupees < 0 ? 'text-red-500' : 'text-[#F05010]'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>
                {remainingRupees < 0
                  ? `Over by ${formatINR(Math.abs(remainingRupees))}`
                  : `Remaining: ${formatINR(remainingRupees)}`}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Split Rows */}
      <div className="space-y-2.5">
        {splits.map((split, idx) => {
          return (
            <div
              key={split.id || idx}
              className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
            >
              {/* Account selection */}
              <div className="flex-1">
                <select
                  value={split.sourceAccountId}
                  onChange={(e) => handleUpdateSplit(idx, { sourceAccountId: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatINR(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Method */}
              <div className="w-28">
                <select
                  value={split.paymentMethod}
                  onChange={(e) =>
                    handleUpdateSplit(idx, { paymentMethod: e.target.value as PaymentMethod })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>

              {/* Amount */}
              <div className="w-32">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs text-[var(--text-muted)] font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="0"
                    value={split.amount || ''}
                    onChange={(e) =>
                      handleUpdateSplit(idx, { amount: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              {/* Remove button */}
              {splits.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSplit(idx)}
                  className="p-1.5 rounded-lg text-[var(--text-disabled)] hover:text-red-500 hover:bg-red-500/10 cursor-pointer self-end sm:self-auto"
                  title="Remove split source"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add another split button */}
      <button
        type="button"
        onClick={handleAddSplit}
        className="flex items-center gap-1.5 text-xs font-bold text-[#F05010] hover:underline cursor-pointer pt-1"
      >
        <Plus className="w-3.5 h-3.5 stroke-[3]" />
        <span>Add another payment source</span>
      </button>
    </div>
  );
};

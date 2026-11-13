import React, { useState } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Button } from '../../shared/components/ui/Button';
import type { Account } from '../../types/finance';
import { formatINR, parseAmount } from '../../shared/utils/currency';
import { getTodayDateString } from '../../shared/utils/dates';
import { ArrowRightLeft } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  initialSourceAccount?: Account | null;
  onTransfer: (data: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    date: string;
    note?: string;
  }) => Promise<void>;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  accounts,
  initialSourceAccount,
  onTransfer,
}) => {
  const [sourceId, setSourceId] = useState(
    initialSourceAccount?.id || accounts[0]?.id || ''
  );
  const [destinationId, setDestinationId] = useState(
    accounts.find((a) => a.id !== (initialSourceAccount?.id || accounts[0]?.id))?.id || ''
  );
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceId === destinationId) {
      setError('Source and destination accounts must be different');
      return;
    }

    const parsedAmount = parseAmount(amount);
    if (!parsedAmount) {
      setError('Please enter a valid transfer amount greater than 0');
      return;
    }


    setIsSubmitting(true);
    setError(null);
    try {
      await onTransfer({
        sourceAccountId: sourceId,
        destinationAccountId: destinationId,
        amount: parsedAmount,
        date,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Between Wallets"
      subtitle="Move money internally without altering your net worth"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              From Wallet *
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatINR(a.currentBalance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              To Wallet *
            </label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id} disabled={a.id === sourceId}>
                  {a.name} ({formatINR(a.currentBalance)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Transfer Amount (₹) *
          </label>
          <input
            type="number"
            step="any"
            min="0.01"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-lg font-bold text-[var(--text-primary)] focus:outline-none tabular-nums"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Date
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Note (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. ATM cash withdrawal from Bank"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<ArrowRightLeft className="w-4 h-4" />}
          >
            Transfer Funds
          </Button>
        </div>
      </form>
    </Modal>
  );
};

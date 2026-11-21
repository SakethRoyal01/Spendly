import React, { useEffect, useState } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Button } from '../../shared/components/ui/Button';
import { ALL_INCOME_CATEGORIES, type Account, type IncomeCategory, type Transaction } from '../../types/finance';
import { parseAmount } from '../../shared/utils/currency';

interface EditDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  accounts: Account[];
  onSave: (id: string, updates: {
    amount: number;
    category: IncomeCategory;
    description: string;
    date: string;
    destinationAccountId: string;
    note?: string;
  }) => Promise<void>;
}

export const EditDepositModal: React.FC<EditDepositModalProps> = ({
  isOpen, onClose, transaction, accounts, onSave,
}) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('Other');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transaction) return;
    setAmount(String(transaction.amount));
    setCategory((transaction.category as IncomeCategory) || 'Other');
    setDescription(transaction.description || '');
    setDate(transaction.date);
    setDestinationAccountId(transaction.destinationAccountId || accounts[0]?.id || '');
    setNote(transaction.note || '');
    setError(null);
  }, [transaction?.id, accounts]);

  if (!transaction) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseAmount(amount);
    if (!parsed || parsed <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    if (!destinationAccountId) {
      setError('Select the wallet that received this money.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(transaction.id, {
        amount: parsed,
        category,
        description: description.trim(),
        date,
        destinationAccountId,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this wallet deposit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Wallet Deposit" subtitle="Update the money added and keep the wallet balance in sync.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-xs font-semibold">{error}</div>}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Amount (₹) *</label>
          <input type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xl font-bold text-[var(--text-primary)] focus:outline-none tabular-nums" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as IncomeCategory)} className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)]">
              {ALL_INCOME_CATEGORIES.filter((item) => item !== 'Change').map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Date *</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)]" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Wallet *</label>
          <select required value={destinationAccountId} onChange={(e) => setDestinationAccountId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)]">
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Description</label>
          <input type="text" maxLength={120} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)]" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Note</label>
          <input type="text" maxLength={240} value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)]" />
        </div>
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

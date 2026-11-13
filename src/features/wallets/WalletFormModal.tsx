import React, { useState } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Button } from '../../shared/components/ui/Button';
import type { Account, AccountType } from '../../types/finance';
import { parseAmount } from '../../shared/utils/currency';

interface WalletFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    type: AccountType;
    openingBalance: number;
    color: string;
    description?: string;
  }) => Promise<void>;
  initialAccount?: Account | null;
}

const WALLET_COLORS = ['#F05010', '#484848', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'];

export const WalletFormModal: React.FC<WalletFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAccount,
}) => {
  const [name, setName] = useState(initialAccount?.name || '');
  const [type, setType] = useState<AccountType>(initialAccount?.type || 'bank');
  const [openingBalance, setOpeningBalance] = useState(
    initialAccount ? String(initialAccount.openingBalance) : '0'
  );
  const [color, setColor] = useState(initialAccount?.color || '#F05010');
  const [description, setDescription] = useState(initialAccount?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an account name');
      return;
    }

    const parsedOpening = parseAmount(openingBalance);
    if (parsedOpening === null && Number(openingBalance) !== 0) {
      setError('Please enter a valid opening balance');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        type,
        openingBalance: parsedOpening !== null ? parsedOpening : 0,
        color,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save wallet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialAccount ? 'Edit Wallet' : 'Create New Wallet'}
      subtitle="Virtual cash and bank balance management"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Wallet / Account Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. HDFC Salary, Petty Cash, Axis Card"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Account Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            >
              <option value="bank">Bank Account</option>
              <option value="cash">Cash Wallet</option>
              <option value="savings_account">Savings Account</option>
              <option value="credit">Credit Card</option>
              <option value="custom">Custom Account</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Opening Balance (₹)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Visual Color Theme
          </label>
          <div className="flex items-center gap-2 pt-1">
            {WALLET_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full cursor-pointer transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-offset-2 ring-[#F05010]' : 'opacity-80'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Description (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Primary salary account linked to UPI"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {initialAccount ? 'Save Changes' : 'Create Wallet'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

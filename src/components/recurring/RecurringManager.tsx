import React, { useState } from 'react';
import { useFinance } from '../../hooks/useFinance';
import type { PaymentMethod } from '../../types/finance';
import { formatINR, parseAmount } from '../../utils/currency';
import { formatDateShort, getTodayDateString } from '../../utils/dates';
import { ALL_CATEGORIES } from '../../utils/categories';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Clock, Plus, CheckCircle2, SkipForward } from 'lucide-react';

export const RecurringManager: React.FC = () => {
  const { recurring, accounts, createRecurring, markOccurrencePaid, skipOccurrence } = useFinance();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const today = getTodayDateString();

  return (
    <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-[#F05010]" />
          <div>
            <h3 className="font-display text-base sm:text-lg font-extrabold text-[var(--text-primary)]">
              Recurring Payments
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)] block">
              Automated Bills & Subscriptions
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#F05010]" />
          <span>New Schedule</span>
        </button>
      </div>

      {recurring.length === 0 ? (
        <div className="text-center py-6 space-y-2">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">
            No recurring bills scheduled.
          </p>
          <p className="text-[11px] text-[var(--text-disabled)]">
            Add rent, utilities, or subscriptions to track upcoming due dates.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {recurring.map((item) => {
            const isDue = item.nextDueDate <= today;
            const sourceAcc = accounts.find((a) => a.id === item.sourceAccountId);

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {item.description}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)]">
                      {item.frequency}
                    </span>
                    {isDue && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#F05010]/15 text-[#F05010]">
                        Due Now
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <span>Due: {formatDateShort(item.nextDueDate)}</span>
                    <span>•</span>
                    <span>{sourceAcc?.name || 'Wallet'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)]">
                  <span className="font-display text-base font-extrabold text-[var(--text-primary)] tabular-nums">
                    {formatINR(item.amount)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={processingId === item.id}
                      onClick={async () => {
                        setProcessingId(item.id);
                        try {
                          await markOccurrencePaid(item.id, item.nextDueDate);
                        } finally {
                          setProcessingId(null);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#F05010] text-white text-xs font-bold hover:bg-[#d94408] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Paid</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => skipOccurrence(item.id, item.nextDueDate)}
                      className="p-1.5 rounded-xl bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      title="Skip this cycle"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <RecurringModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        accounts={accounts}
        onSave={createRecurring}
      />
    </div>
  );
};

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: any[];
  onSave: (data: any) => Promise<any>;
}

const RecurringModal: React.FC<RecurringModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSave,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Bills');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseAmount(amount);
    if (!description.trim() || !parsed) return;

    setIsSubmitting(true);
    try {
      await onSave({
        description: description.trim(),
        amount: parsed,
        type: 'expense',
        category,
        frequency,
        sourceAccountId,
        paymentMethod,
        startDate,
        nextDueDate: startDate,
        isActive: true,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Recurring Payment"
      subtitle="Track recurring bills, subscriptions, and regular expenses"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Bill / Subscription Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. WiFi Bill, Netflix, Gym Membership"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Amount (₹) *
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
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Source Wallet
            </label>
            <select
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            >
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Next Due Date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Schedule Bill
          </Button>
        </div>
      </form>
    </Modal>
  );
};

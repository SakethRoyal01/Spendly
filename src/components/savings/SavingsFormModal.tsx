import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { SavingsPot } from '../../types/finance';
import { parseAmount } from '../../utils/currency';

interface SavingsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    targetAmount: number | null;
    targetDate: string | null;
    icon: string;
    color: string;
    priority: 'low' | 'medium' | 'high';
  }) => Promise<void>;
  initialPot?: SavingsPot | null;
}

const ICONS = ['PiggyBank', 'Laptop', 'Plane', 'Smartphone', 'Shield', 'Target'];
const COLORS = ['#F05010', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#484848'];

export const SavingsFormModal: React.FC<SavingsFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPot,
}) => {
  const [name, setName] = useState(initialPot?.name || '');
  const [description, setDescription] = useState(initialPot?.description || '');
  const [targetAmount, setTargetAmount] = useState(
    initialPot?.targetAmount ? String(initialPot.targetAmount) : ''
  );
  const [targetDate, setTargetDate] = useState(initialPot?.targetDate || '');
  const [icon, setIcon] = useState(initialPot?.icon || 'PiggyBank');
  const [color, setColor] = useState(initialPot?.color || '#F05010');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(
    initialPot?.priority || 'medium'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a savings goal name');
      return;
    }

    const parsedTarget = targetAmount.trim() ? parseAmount(targetAmount) : null;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        targetAmount: parsedTarget,
        targetDate: targetDate || null,
        icon,
        color,
        priority,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save savings pot');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialPot ? 'Edit Savings Pot' : 'Create Savings Goal'}
      subtitle="Organize money into dedicated savings pots and milestones"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Goal / Pot Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Emergency Fund, New Laptop, Japan Trip"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Target Amount (₹) <span className="text-[10px] lowercase font-normal">(optional)</span>
            </label>
            <input
              type="number"
              step="any"
              min="1"
              placeholder="e.g. 50000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Target Date <span className="text-[10px] lowercase font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            />
          </div>
        </div>

        {/* Priority & Icon selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Icon Symbol
            </label>
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            >
              {ICONS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Color Accent
          </label>
          <div className="flex items-center gap-2 pt-1">
            {COLORS.map((c) => (
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
            Description / Purpose
          </label>
          <input
            type="text"
            placeholder="e.g. 6 months emergency living fund"
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
            {initialPot ? 'Save Changes' : 'Create Savings Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};


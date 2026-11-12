import React, { useState } from 'react';
import { useFinance } from '../../hooks/useFinance';
import { formatINR } from '../../utils/currency';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ALL_CATEGORIES } from '../../utils/categories';
import { Target, Sliders, Plus } from 'lucide-react';

export const BudgetCard: React.FC = () => {
  const { currentBudget, selectedMonth, monthlyExpenses, saveBudget } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Actual net spending in selectedMonth (Change deducted from amount spent)
  const totalSpent = monthlyExpenses;

  const overallBudget = currentBudget?.overallMonthlyBudget || 0;
  const remaining = Math.max(0, overallBudget - totalSpent);
  const percentUsed = overallBudget > 0 ? Math.min(100, Math.round((totalSpent / overallBudget) * 100)) : 0;
  const isOver = overallBudget > 0 && totalSpent > overallBudget;

  return (
    <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Target className="w-5 h-5 text-[#F05010]" />
          <div>
            <h3 className="font-display text-base sm:text-lg font-extrabold text-[var(--text-primary)]">
              Monthly Budget
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)] block">
              {selectedMonth} Target
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-[#F05010]" />
          <span>{overallBudget > 0 ? 'Edit Limits' : 'Set Budget'}</span>
        </button>
      </div>

      {overallBudget === 0 ? (
        <div className="text-center py-6 space-y-2">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">
            No spending budget set for this month.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#F05010] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs hover:opacity-90"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Set Monthly Budget</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-disabled)] block">
                Spent vs Budget
              </span>
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tabular-nums">
                {formatINR(totalSpent)}{' '}
                <span className="text-sm sm:text-base font-semibold text-[var(--text-secondary)]">
                  / {formatINR(overallBudget)}
                </span>
              </span>
            </div>

            <div className="text-right">
              <span
                className={`text-xs font-extrabold ${
                  isOver ? 'text-red-500' : percentUsed >= 90 ? 'text-amber-500' : 'text-emerald-500'
                }`}
              >
                {isOver ? `Over by ${formatINR(totalSpent - overallBudget)}` : `${formatINR(remaining)} left`}
              </span>
              <span className="text-[10px] text-[var(--text-disabled)] font-bold block">
                {percentUsed}% used
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3.5 rounded-full bg-[var(--bg-input)] overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOver ? 'bg-red-500' : percentUsed >= 85 ? 'bg-amber-500' : 'bg-[#F05010]'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>
      )}

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedMonth={selectedMonth}
        initialBudget={currentBudget}
        onSave={saveBudget}
      />
    </div>
  );
};

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  initialBudget: any;
  onSave: (data: any) => Promise<any>;
}

const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  initialBudget,
  onSave,
}) => {
  const [overall, setOverall] = useState(
    initialBudget?.overallMonthlyBudget ? String(initialBudget.overallMonthlyBudget) : ''
  );
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>(() => {
    const res: Record<string, string> = {};
    if (initialBudget?.categoryBudgets) {
      Object.entries(initialBudget.categoryBudgets).forEach(([k, v]) => {
        res[k] = String(v);
      });
    }
    return res;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const overallNum = Number(overall);
    if (isNaN(overallNum) || overallNum < 0) return;

    const catNums: Record<string, number> = {};
    Object.entries(categoryLimits).forEach(([cat, val]) => {
      const num = Number(val);
      if (!isNaN(num) && num > 0) catNums[cat] = num;
    });

    setIsSubmitting(true);
    try {
      await onSave({
        yearMonth: selectedMonth,
        overallMonthlyBudget: overallNum,
        categoryBudgets: catNums,
        thresholds: [50, 75, 90, 100],
        rolloverEnabled: false,
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
      title={`Budget for ${selectedMonth}`}
      subtitle="Configure spending thresholds and category caps"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Overall Monthly Limit (₹) *
          </label>
          <input
            type="number"
            step="any"
            min="0"
            required
            placeholder="e.g. 25000"
            value={overall}
            onChange={(e) => setOverall(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-lg font-bold text-[var(--text-primary)] focus:outline-none tabular-nums"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Category Caps (Optional)
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {ALL_CATEGORIES.map((cat) => (
              <div key={cat} className="space-y-1">
                <span className="text-[11px] font-bold text-[var(--text-secondary)]">{cat}</span>
                <input
                  type="number"
                  placeholder="No limit"
                  value={categoryLimits[cat] || ''}
                  onChange={(e) =>
                    setCategoryLimits((prev) => ({ ...prev, [cat]: e.target.value }))
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Budget
          </Button>
        </div>
      </form>
    </Modal>
  );
};

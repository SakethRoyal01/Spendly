import React from 'react';
import type { SavingsPot } from '../../types/finance';
import { formatINR } from '../../utils/currency';
import { formatDateShort } from '../../utils/dates';
import { PiggyBank, Laptop, Plane, Smartphone, Shield, Target, Plus, ArrowDownLeft, MoreVertical } from 'lucide-react';

interface SavingsPotCardProps {
  pot: SavingsPot;
  onEdit: (pot: SavingsPot) => void;
  onContribute: (pot: SavingsPot) => void;
  onWithdraw: (pot: SavingsPot) => void;
  onUseForExpense: (pot: SavingsPot) => void;
}

export const SavingsPotCard: React.FC<SavingsPotCardProps> = ({
  pot,
  onEdit,
  onContribute,
  onWithdraw,
  onUseForExpense,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Laptop':
        return <Laptop className="w-5 h-5 text-[#F05010]" />;
      case 'Plane':
        return <Plane className="w-5 h-5 text-blue-500" />;
      case 'Smartphone':
        return <Smartphone className="w-5 h-5 text-purple-500" />;
      case 'Shield':
        return <Shield className="w-5 h-5 text-emerald-500" />;
      case 'Target':
        return <Target className="w-5 h-5 text-amber-500" />;
      default:
        return <PiggyBank className="w-5 h-5 text-[#F05010]" />;
    }
  };

  const hasTarget = pot.targetAmount !== null && pot.targetAmount > 0;
  const progress = hasTarget
    ? Math.min(100, Math.round((pot.currentAmount / pot.targetAmount!) * 100))
    : null;
  const remaining = hasTarget ? Math.max(0, pot.targetAmount! - pot.currentAmount) : null;

  return (
    <div className="bg-[var(--bg-surface)] rounded-3xl p-6 border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between space-y-5 transition-all hover:border-[var(--border-active)]">
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center p-2.5 shadow-xs"
            style={{ backgroundColor: `${pot.color}15`, border: `1px solid ${pot.color}30` }}
          >
            {getIcon(pot.icon)}
          </div>
          <div>
            <h3 className="font-display text-base font-extrabold text-[var(--text-primary)]">
              {pot.name}
            </h3>
            {pot.targetDate && (
              <span className="text-[10px] font-bold text-[var(--text-disabled)] uppercase tracking-wider block">
                Target: {formatDateShort(pot.targetDate)}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onEdit(pot)}
          className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
          title="Pot settings"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Progress & Balances */}
      <div>
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tabular-nums">
            {formatINR(pot.currentAmount)}
          </span>
          {hasTarget && (
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              Goal: {formatINR(pot.targetAmount!)}
            </span>
          )}
        </div>

        {/* Custom Progress Bar */}
        {hasTarget && progress !== null && (
          <div className="mt-3 space-y-1.5">
            <div className="w-full h-3 rounded-full bg-[var(--bg-input)] overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-[#F05010] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)]">
              <span>{progress}% saved</span>
              <span>{remaining! > 0 ? `${formatINR(remaining!)} to go` : 'Goal reached! 🎉'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2">
        <button
          type="button"
          onClick={() => onContribute(pot)}
          className="flex-1 py-2 px-3 rounded-xl bg-[#F05010] hover:bg-[#d94408] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Add Funds</span>
        </button>

        <button
          type="button"
          onClick={() => onWithdraw(pot)}
          className="py-2 px-3 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-bold transition-all cursor-pointer"
          title="Withdraw back to a wallet"
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onUseForExpense(pot)}
          className="py-2 px-3 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[#F05010] text-xs font-bold transition-all cursor-pointer"
          title="Spend directly from this savings goal"
        >
          Pay Expense
        </button>
      </div>
    </div>
  );
};


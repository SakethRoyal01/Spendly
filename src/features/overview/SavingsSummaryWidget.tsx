import React from 'react';
import { useFinance } from '../../core/finance/useFinance';
import { formatINR } from '../../shared/utils/currency';
import { PiggyBank, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SavingsSummaryWidget: React.FC = () => {
  const { savingsPots, totalSavingsBalance } = useFinance();
  const navigate = useNavigate();

  return (
    <div className="bg-[var(--bg-surface)] rounded-3xl p-6 border border-[var(--border-subtle)] shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <PiggyBank className="w-5 h-5 text-[#F05010]" />
          <div>
            <h3 className="font-display text-base font-extrabold text-[var(--text-primary)]">
              Savings & Goals
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)] block">
              Internal Allocations
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/savings')}
          className="flex items-center gap-1 text-xs font-bold text-[#F05010] hover:underline cursor-pointer"
        >
          <span>View Goals</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-disabled)] block">
          Total Saved
        </span>
        <div className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1 tracking-tight tabular-nums">
          {formatINR(totalSavingsBalance)}
        </div>
      </div>

      {/* Mini Goals Progress */}
      {savingsPots.length === 0 ? (
        <div className="p-3.5 rounded-2xl bg-[var(--bg-input)] text-xs text-[var(--text-secondary)] text-center">
          No active savings goals. Create one in Savings!
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          {savingsPots.slice(0, 2).map((pot) => {
            const hasTarget = pot.targetAmount && pot.targetAmount > 0;
            const pct = hasTarget ? Math.min(100, Math.round((pot.currentAmount / pot.targetAmount!) * 100)) : null;

            return (
              <div
                key={pot.id}
                onClick={() => navigate('/savings')}
                className="p-3 rounded-2xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--text-primary)]">{pot.name}</span>
                  <span className="font-display font-extrabold text-[#F05010]">
                    {formatINR(pot.currentAmount)}
                  </span>
                </div>
                {pct !== null && (
                  <div className="w-full h-2 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#F05010]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

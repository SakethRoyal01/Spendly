import React, { useState } from 'react';
import { useFinance } from '../../core/finance/useFinance';
import { SavingsPotCard } from './SavingsPotCard';
import { SavingsFormModal } from './SavingsFormModal';
import { ContributeModal } from './ContributeModal';
import { WithdrawModal } from './WithdrawModal';
import { SavingsReminderBanner } from './SavingsReminderBanner';
import { ExpenseFormModal } from '../expenses/ExpenseFormModal';
import type { SavingsPot } from '../../types/finance';
import { formatINR } from '../../shared/utils/currency';
import { motion } from 'framer-motion';
import { Plus, PiggyBank, Target } from 'lucide-react';

export const Savings: React.FC = () => {
  const {
    savingsPots,
    accounts,
    totalSavingsBalance,
    createSavingsPot,
    updateSavingsPot,
    contributeToSavings,
    withdrawFromSavings,
  } = useFinance();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPot, setEditingPot] = useState<SavingsPot | null>(null);
  const [contributePot, setContributePot] = useState<SavingsPot | null>(null);
  const [withdrawPot, setWithdrawPot] = useState<SavingsPot | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const handleSavePot = async (data: {
    name: string;
    description?: string;
    targetAmount: number | null;
    targetDate: string | null;
    icon: string;
    color: string;
    priority: 'low' | 'medium' | 'high';
  }) => {
    if (editingPot) {
      await updateSavingsPot(editingPot.id, data);
    } else {
      await createSavingsPot(data);
    }
  };

  const totalTarget = savingsPots.reduce((sum, p) => sum + (p.targetAmount || 0), 0);
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSavingsBalance / totalTarget) * 100)) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#F05010] block">
            Savings & Goals
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-0.5">
            Savings Pots
          </h1>
          <p className="text-xs font-semibold text-[var(--text-secondary)] mt-1">
            Allocate money into dedicated targets, emergency funds, and future milestones
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingPot(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#F05010] text-white text-xs font-bold transition-all cursor-pointer shadow-xs hover:opacity-90 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[var(--bg-surface)] rounded-3xl p-6 border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--text-disabled)] block">
            Total Saved
          </span>
          <div className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] mt-1 tracking-tight">
            {formatINR(totalSavingsBalance)}
          </div>
          <span className="text-xs font-semibold text-[var(--text-secondary)] mt-1 block">
            Across {savingsPots.length} {savingsPots.length === 1 ? 'goal' : 'goals'}
          </span>
        </div>

        <div className="bg-[var(--bg-surface)] rounded-3xl p-6 border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--text-disabled)] block">
            Target Milestones
          </span>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1 tracking-tight">
            {totalTarget > 0 ? formatINR(totalTarget) : 'Flexible'}
          </div>
          <span className="text-xs font-semibold text-[var(--text-secondary)] mt-1 block">
            {overallProgress !== null ? `${overallProgress}% overall milestone progress` : 'Open-ended savings'}
          </span>
        </div>

        <div className="bg-[var(--bg-surface)] rounded-3xl p-6 border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--text-disabled)] block">
            Net Worth Protection
          </span>
          <div className="flex items-center gap-2 mt-1">
            <PiggyBank className="w-6 h-6 text-[#F05010]" />
            <span className="font-display text-lg font-bold text-[var(--text-primary)]">
              Internal Allocation
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] mt-1 block">
            Moving funds to savings does not reduce your total net worth.
          </span>
        </div>
      </div>

      {/* Savings Reminder Check-In */}
      <SavingsReminderBanner
        onRecordExpense={() => setIsExpenseModalOpen(true)}
        onDismiss={() => {}}
      />

      {/* Savings Pots Grid */}
      {savingsPots.length === 0 ? (
        <div className="bg-[var(--bg-surface)] rounded-3xl p-12 border border-[var(--border-subtle)] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-input)] flex items-center justify-center mx-auto text-[#F05010]">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-display text-lg font-extrabold text-[var(--text-primary)]">
              No Savings Goals Created Yet
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mt-1">
              Create pots for an Emergency Fund, Travel, Tech upgrades, or long-term dreams to start tracking your allocations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-[#F05010] text-white text-xs font-bold transition-all cursor-pointer shadow-xs hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {savingsPots.map((pot) => (
            <SavingsPotCard
              key={pot.id}
              pot={pot}
              onEdit={(p) => {
                setEditingPot(p);
                setIsAddModalOpen(true);
              }}
              onContribute={(p) => setContributePot(p)}
              onWithdraw={(p) => setWithdrawPot(p)}
              onUseForExpense={() => setIsExpenseModalOpen(true)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <SavingsFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSavePot}
        initialPot={editingPot}
      />

      <ContributeModal
        isOpen={Boolean(contributePot)}
        onClose={() => setContributePot(null)}
        pot={contributePot}
        accounts={accounts}
        onContribute={async (data) => {
          await contributeToSavings(data);
        }}
      />

      <WithdrawModal
        isOpen={Boolean(withdrawPot)}
        onClose={() => setWithdrawPot(null)}
        pot={withdrawPot}
        accounts={accounts}
        onWithdraw={async (data) => {
          await withdrawFromSavings(data);
        }}
      />

      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
    </motion.div>
  );
};

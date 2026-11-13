import React, { useState } from 'react';
import { PiggyBank, ArrowRight } from 'lucide-react';

interface SavingsReminderBannerProps {
  onRecordExpense: () => void;
  onDismiss: () => void;
}

export const SavingsReminderBanner: React.FC<SavingsReminderBannerProps> = ({
  onRecordExpense,
  onDismiss,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-[var(--bg-surface)] border border-[#F05010]/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-[#F05010]/15 flex items-center justify-center shrink-0 mt-0.5">
          <PiggyBank className="w-5 h-5 text-[#F05010]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F05010]">
              Savings Check-In
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F05010] animate-pulse" />
          </div>
          <h4 className="font-display text-sm font-extrabold text-[var(--text-primary)] mt-0.5">
            Did you spend from any savings goal recently?
          </h4>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
            If you made an offline purchase or spent money from your emergency or travel fund, record it now so your goal progress stays accurate.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={() => {
            setIsDismissed(true);
            onDismiss();
          }}
          className="px-3.5 py-2 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-secondary)] transition-colors cursor-pointer"
        >
          No, all good
        </button>

        <button
          type="button"
          onClick={onRecordExpense}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F05010] hover:bg-[#d94408] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <span>Record Spending</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

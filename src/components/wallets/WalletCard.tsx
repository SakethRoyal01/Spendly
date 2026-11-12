import React from 'react';
import type { Account } from '../../types/finance';
import { formatINR } from '../../utils/currency';
import {
  Wallet,
  Landmark,
  CreditCard,
  Banknote,
  MoreVertical,
  ArrowRightLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

interface WalletCardProps {
  account: Account;
  onSelect?: (account: Account) => void;
  onEdit: (account: Account) => void;
  onTransfer: (account: Account) => void;
  onDeposit: (account: Account) => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  account,
  onSelect,
  onEdit,
  onTransfer,
  onDeposit,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Banknote className="w-5 h-5 text-emerald-500" />;
      case 'bank':
      case 'savings_account':
        return <Landmark className="w-5 h-5 text-blue-500" />;
      case 'credit':
        return <CreditCard className="w-5 h-5 text-purple-500" />;
      default:
        return <Wallet className="w-5 h-5 text-[#F05010]" />;
    }
  };

  const isLow = account.currentBalance < 500 && account.currentBalance >= 0;
  const isNegative = account.currentBalance < 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(account)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(account);
        }
      }}
      className="bg-[var(--bg-surface)] rounded-3xl p-6 border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between space-y-5 transition-all hover:border-[#F05010] hover:shadow-md active:scale-[0.99] cursor-pointer group text-left select-none"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center p-2.5 shadow-xs transition-transform group-hover:scale-105"
            style={{ backgroundColor: `${account.color}15`, border: `1px solid ${account.color}30` }}
          >
            {getIcon(account.type)}
          </div>
          <div>
            <h3 className="font-display text-base font-extrabold text-[var(--text-primary)] group-hover:text-[#F05010] transition-colors">
              {account.name}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)] block">
              {account.type.replace('_', ' ')}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(account);
          }}
          className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
          title="Account settings"
          aria-label="Account settings"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Balance Display */}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-disabled)] block">
          Current Balance
        </span>
        <div
          className={`font-display text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight tabular-nums ${
            isNegative ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-[var(--text-primary)]'
          }`}
        >
          {formatINR(account.currentBalance)}
        </div>
        <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] mt-1 font-medium">
          <span>Opening: {formatINR(account.openingBalance)}</span>
          {isNegative && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-bold text-[10px] uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3" />
              Negative Balance
            </span>
          )}
        </div>
      </div>

      {/* Click-through affordance hint */}
      <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] group-hover:text-[#F05010] pt-1 transition-colors">
        <span>View Activity & Insights</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeposit(account);
          }}
          className="flex-1 py-2 px-3 rounded-xl bg-[var(--bg-input)] hover:bg-[#F05010] hover:text-white text-[var(--text-primary)] text-xs font-bold transition-all text-center cursor-pointer"
        >
          Add Money
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTransfer(account);
          }}
          className="flex items-center justify-center p-2 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] cursor-pointer"
          title="Transfer to another wallet"
          aria-label="Transfer to another wallet"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

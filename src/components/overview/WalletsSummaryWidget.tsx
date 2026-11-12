import React from 'react';
import { useFinance } from '../../hooks/useFinance';
import { formatINR } from '../../utils/currency';
import { Wallet, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WalletsSummaryWidget: React.FC = () => {
  const { accounts, totalWalletBalance } = useFinance();
  const navigate = useNavigate();

  return (
    <div className="bg-[var(--bg-surface)] rounded-3xl p-6 border border-[var(--border-subtle)] shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Wallet className="w-5 h-5 text-[#F05010]" />
          <div>
            <h3 className="font-display text-base font-extrabold text-[var(--text-primary)]">
              Wallets & Balances
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)] block">
              Virtual Liquidity
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/wallets')}
          className="flex items-center gap-1 text-xs font-bold text-[#F05010] hover:underline cursor-pointer"
        >
          <span>Manage</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-disabled)] block">
          Total Liquid Balance
        </span>
        <div className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1 tracking-tight tabular-nums">
          {formatINR(totalWalletBalance)}
        </div>
      </div>

      {/* Mini Account Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
        {accounts.slice(0, 3).map((acc) => (
          <div
            key={acc.id}
            onClick={() => navigate(`/wallets?account=${acc.id}`)}
            className="p-3 rounded-2xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer space-y-1 group"
          >
            <span className="text-[11px] font-bold text-[var(--text-secondary)] group-hover:text-[#F05010] block truncate transition-colors">
              {acc.name}
            </span>
            <span
              className={`font-display text-sm font-extrabold ${
                acc.currentBalance < 0 ? 'text-red-500' : 'text-[var(--text-primary)]'
              } block tabular-nums`}
            >
              {formatINR(acc.currentBalance)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

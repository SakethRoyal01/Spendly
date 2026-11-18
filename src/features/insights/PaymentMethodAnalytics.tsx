import React, { useMemo } from 'react';
import { useFinance } from '../../core/finance/useFinance';
import { formatINR } from '../../shared/utils/currency';
import { CreditCard, Banknote, Smartphone, Landmark, HelpCircle } from 'lucide-react';

export const PaymentMethodAnalytics: React.FC = () => {
  const { transactions, selectedMonth } = useFinance();

  const monthExpenses = useMemo(() => {
    return transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(selectedMonth)
    );
  }, [transactions, selectedMonth]);

  // Aggregate amounts by payment method, attributing hybrid splits to their respective source method
  const methodStats = useMemo(() => {
    const stats: Record<string, { total: number; count: number }> = {
      Cash: { total: 0, count: 0 },
      UPI: { total: 0, count: 0 },
      'Not specified': { total: 0, count: 0 },
      'Debit Card': { total: 0, count: 0 },
      'Credit Card': { total: 0, count: 0 },
      'Bank Transfer': { total: 0, count: 0 },
      Other: { total: 0, count: 0 },
    };

    let totalAll = 0;

    monthExpenses.forEach((tx) => {
      totalAll += tx.amount;

      if (tx.paymentMethod === 'Hybrid' && tx.splits && tx.splits.length > 0) {
        // Distribute split portions accurately
        tx.splits.forEach((split) => {
          const m = split.paymentMethod || 'Other';
          const cur = stats[m] || { total: 0, count: 0 };
          stats[m] = {
            total: cur.total + split.amount,
            count: cur.count + 1,
          };
        });
      } else {
        const m = tx.paymentMethod || 'Not specified';
        const cur = stats[m] || { total: 0, count: 0 };
        stats[m] = {
          total: cur.total + tx.amount,
          count: cur.count + 1,
        };
      }
    });

    return { stats, totalAll };
  }, [monthExpenses]);

  const getIcon = (method: string) => {
    switch (method) {
      case 'Cash':
        return <Banknote className="w-4 h-4 text-emerald-500" />;
      case 'UPI':
        return <Smartphone className="w-4 h-4 text-[#F05010]" />;
      case 'Not specified':
        return <HelpCircle className="w-4 h-4 text-[#F05010]" />;
      case 'Bank Transfer':
        return <Landmark className="w-4 h-4 text-blue-500" />;
      default:
        return <CreditCard className="w-4 h-4 text-purple-500" />;
    }
  };

  if (monthExpenses.length === 0) return null;

  return (
    <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F05010] block">
            Payment Channels
          </span>
          <h3 className="font-display text-base sm:text-lg font-extrabold text-[var(--text-primary)]">
            Payment Method Analytics
          </h3>
        </div>
        <span className="text-xs font-bold text-[var(--text-secondary)]">{selectedMonth}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.entries(methodStats.stats)
          .filter(([, data]) => data.total > 0)
          .map(([method, data]) => {
            const pct =
              methodStats.totalAll > 0
                ? Math.round((data.total / methodStats.totalAll) * 100)
                : 0;

            return (
              <div
                key={method}
                className="p-3.5 rounded-2xl bg-[var(--bg-input)] flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getIcon(method)}
                    <span className="text-xs font-bold text-[var(--text-primary)]">{method}</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-[var(--text-disabled)]">
                    {pct}%
                  </span>
                </div>

                <div>
                  <span className="font-display text-base font-extrabold text-[var(--text-primary)] tabular-nums block">
                    {formatINR(data.total)}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                    {data.count} {data.count === 1 ? 'allocation' : 'allocations'}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

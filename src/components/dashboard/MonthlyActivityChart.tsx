import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { useExpenses } from '../../hooks/useExpenses';
import { useFinance } from '../../hooks/useFinance';
import { calculateDailySpendingSeries, calculateCategoryBreakdown } from '../../utils/calculations';
import { formatINR, formatCompactINR } from '../../utils/currency';
import { formatMonthYear, formatDateMedium } from '../../utils/dates';
import { BarChart3, TrendingUp, Layers } from 'lucide-react';
import { CategoryBadge } from '../ui/Badge';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { date: string; amount: number; count: number } }>;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#121615] border border-[#27322e] p-3 rounded-xl shadow-xl text-xs">
        <div className="text-zinc-400 font-medium mb-1">{formatDateMedium(data.date)}</div>
        <div className="text-sm font-bold text-white tabular-nums">
          {formatINR(data.amount)}
        </div>
        <div className="text-[11px] text-emerald-400 mt-0.5">
          {data.count} {data.count === 1 ? 'transaction' : 'transactions'}
        </div>
      </div>
    );
  }
  return null;
};

export const MonthlyActivityChart: React.FC = () => {
  const { expenses, selectedMonth, selectedDate, setSelectedDate } = useExpenses();
  const { incomes, changeTransactions } = useFinance();

  const chartData = calculateDailySpendingSeries(expenses, selectedMonth, incomes, changeTransactions);
  const categoryBreakdown = calculateCategoryBreakdown(
    expenses.filter((e) => e.date.startsWith(selectedMonth))
  );

  const monthTotal = chartData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-[#121615] border border-[#1e2623] rounded-2xl p-5">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-zinc-100 text-sm sm:text-base">
              Monthly Spending Activity
            </h3>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Daily expense distribution for {formatMonthYear(selectedMonth)}
          </p>
        </div>

        {monthTotal > 0 && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>Total:</span>
            <span className="font-bold text-emerald-400 tabular-nums">
              {formatINR(monthTotal)}
            </span>
          </div>
        )}
      </div>

      {/* Chart Content */}
      {monthTotal === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#1e2623] rounded-xl bg-[#0c0f0e]">
          <TrendingUp className="w-10 h-10 text-zinc-700 mb-3" />
          <h4 className="text-sm font-medium text-zinc-300">No expenses recorded for this month</h4>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            As you log daily transactions for {formatMonthYear(selectedMonth)}, your spending
            patterns will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  stroke="#52525b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1e2623' }}
                />
                <YAxis
                  stroke="#52525b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1e2623' }}
                  tickFormatter={(val) => formatCompactINR(val)}
                />
                <Tooltip
                  content={<CustomChartTooltip />}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Bar
                  dataKey="amount"
                  radius={[4, 4, 0, 0]}
                  onClick={(entry: unknown) => {
                    const item = entry as { date?: string };
                    if (item && item.date) {
                      setSelectedDate(item.date);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {chartData.map((entry) => {
                    const isSelected = entry.date === selectedDate;
                    return (
                      <Cell
                        key={`cell-${entry.date}`}
                        fill={
                          isSelected
                            ? '#34d399'
                            : entry.amount > 0
                            ? '#059669'
                            : '#1a2320'
                        }
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown row */}
          {categoryBreakdown.length > 0 && (
            <div className="pt-4 border-t border-[#1b2220]">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Category Distribution
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {categoryBreakdown.slice(0, 4).map((cat) => (
                  <div
                    key={cat.category}
                    className="p-2.5 rounded-xl bg-[#0e1211] border border-[#1b2220] flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <CategoryBadge category={cat.category} size="sm" />
                      <span className="text-[11px] font-semibold text-zinc-400 tabular-nums">
                        {cat.percentage}%
                      </span>
                    </div>
                    <div className="text-xs font-bold text-zinc-200 tabular-nums">
                      {formatINR(cat.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

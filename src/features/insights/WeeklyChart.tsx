import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { WeekDayPoint } from '../../shared/utils/calculations';
import { formatINR } from '../../shared/utils/currency';
import { formatDateShort } from '../../shared/utils/dates';

interface WeeklyChartProps {
  days: WeekDayPoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: WeekDayPoint }>;
}

const CustomWeeklyTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const net = data.netCashFlow ?? (data.income ? data.income - data.amount : -data.amount);
  const income = data.income ?? 0;
  const expense = data.expense ?? data.amount;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-3.5 shadow-xl text-xs space-y-1.5 min-w-[190px]">
      <div className="flex items-center justify-between gap-3">
        <span className="font-extrabold text-[var(--text-primary)]">
          {data.fullDayName}
        </span>
        <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
          {formatDateShort(data.date)}
        </span>
      </div>

      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-disabled)] block">
          Daily Net Cash Flow
        </span>
        <div className="flex items-baseline gap-2 pt-0.5">
          <span
            className={`font-display text-base font-extrabold tabular-nums ${
              net > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : net < 0
                ? 'text-[#F05010]'
                : 'text-[var(--text-primary)]'
            }`}
          >
            {net > 0 ? `+${formatINR(net)}` : formatINR(Math.abs(net))}
          </span>
          {data.count > 0 && (
            <span className="text-[10px] text-[var(--text-secondary)] font-medium">
              ({data.count} {data.count === 1 ? 'entry' : 'entries'})
            </span>
          )}
        </div>
      </div>

      <div className="pt-1.5 border-t border-[var(--border-subtle)] space-y-0.5 text-[11px] font-semibold">
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
          <span>Received (Addition):</span>
          <span className="tabular-nums font-bold">+{formatINR(income)}</span>
        </div>
        <div className="flex items-center justify-between text-[#F05010]">
          <span>Spent (Spending):</span>
          <span className="tabular-nums font-bold">{formatINR(expense)}</span>
        </div>
      </div>

      {net !== 0 && (
        <span
          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
            net > 0
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-[#F05010]/15 text-[#F05010]'
          }`}
        >
          {net > 0 ? '+ Net Inflow' : 'Net Outflow'}
        </span>
      )}
    </div>
  );
};

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ days }) => {
  const maxNet = Math.max(
    ...days.map((d) => Math.abs(d.netCashFlow ?? d.amount)),
    100
  );

  // Normalize data for chart display: if amount is 0, provide a tiny visual baseline (2% of max)
  const chartData = days.map((d) => {
    const net = d.netCashFlow ?? (d.income ? d.income - d.amount : -d.amount);
    const absNet = Math.abs(net);
    return {
      ...d,
      netCashFlow: net,
      displayAmount: absNet > 0 ? absNet : maxNet * 0.02,
      isZero: absNet === 0,
    };
  });

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
        >
          <XAxis
            dataKey="dayName"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
            }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: 'var(--text-disabled)',
              fontSize: 11,
              fontWeight: 500,
            }}
            tickFormatter={(val) => `₹${val}`}
            domain={[0, 'auto']}
          />
          <Tooltip
            content={<CustomWeeklyTooltip />}
            cursor={{ fill: 'var(--bg-input)', opacity: 0.5, radius: 12 }}
          />
          <Bar dataKey="displayAmount" radius={[10, 10, 10, 10]} maxBarSize={48}>
            {chartData.map((entry) => {
              let fill = 'var(--bg-input)';
              if ((entry.netCashFlow ?? 0) > 0) {
                fill = '#10b981'; // Emerald green for net inflow
              } else if ((entry.netCashFlow ?? 0) < 0) {
                fill = '#F05010'; // Brand orange for net outflow
              }

              return (
                <Cell
                  key={entry.date}
                  fill={fill}
                  className="transition-colors duration-200 cursor-pointer"
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

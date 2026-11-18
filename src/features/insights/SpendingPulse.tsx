import React, { useState } from 'react';
import type { DaySpendingData } from '../../shared/utils/calculations';
import { formatINR } from '../../shared/utils/currency';
import { motion } from 'framer-motion';

interface SpendingPulseProps {
  series: DaySpendingData[];
  totalAmount: number;
  periodLabel: string;
}

export const SpendingPulse: React.FC<SpendingPulseProps> = ({
  series,
  totalAmount,
  periodLabel,
}) => {
  const [hoveredDay, setHoveredDay] = useState<DaySpendingData | null>(null);

  const maxNet = Math.max(
    ...series.map((s) => Math.abs(s.netCashFlow ?? s.amount)),
    1
  );
  const count = series.length;
  const radius = 88;
  const cx = 130;
  const cy = 130;

  const hoveredNet = hoveredDay
    ? hoveredDay.netCashFlow ?? (hoveredDay.income ? hoveredDay.income - hoveredDay.amount : -hoveredDay.amount)
    : 0;

  return (
    <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs flex flex-col items-center select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F05010] block">
            Signature Visualization
          </span>
          <h3 className="font-display text-base sm:text-lg font-extrabold text-[var(--text-primary)]">
            Daily Net Cash Flow Pulse
          </h3>
        </div>
        <span className="text-xs font-bold text-[var(--text-secondary)]">{periodLabel}</span>
      </div>

      <div className="relative flex items-center justify-center my-4">
        <svg viewBox="0 0 260 260" className="w-64 h-64 sm:w-72 sm:h-72">
          {/* Outer track circle */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="var(--bg-input)"
            strokeWidth="18"
            className="opacity-70"
          />

          {/* Radial Segment Rays */}
          {series.map((day, idx) => {
            const angle = (idx / count) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const net = day.netCashFlow ?? (day.income ? day.income - day.amount : -day.amount);
            const absNet = Math.abs(net);
            const intensity = absNet > 0 ? Math.min(1, Math.max(0.2, absNet / maxNet)) : 0;

            const r1 = radius - 8;
            const r2 = radius + 8 + (absNet > 0 ? intensity * 18 : 0);

            const x1 = cx + r1 * Math.cos(rad);
            const y1 = cy + r1 * Math.sin(rad);
            const x2 = cx + r2 * Math.cos(rad);
            const y2 = cy + r2 * Math.sin(rad);

            const isHovered = hoveredDay?.day === day.day;

            return (
              <g
                key={day.date}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={
                    isHovered
                      ? '#FFFFFF'
                      : net > 0
                      ? '#10b981'
                      : net < 0
                      ? '#F05010'
                      : 'var(--text-disabled)'
                  }
                  strokeWidth={isHovered ? '4' : '2.5'}
                  strokeOpacity={absNet > 0 ? Math.max(0.4, intensity) : 0.25}
                  strokeLinecap="round"
                  className="transition-all duration-150"
                />
              </g>
            );
          })}

          {/* Center Hub */}
          <circle
            cx={cx}
            cy={cy}
            r="54"
            fill="var(--bg-surface)"
            stroke="var(--border-subtle)"
            strokeWidth="2"
            className="filter drop-shadow-xs"
          />
        </svg>

        {/* Center Dynamic Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
          {hoveredDay ? (
            <motion.div
              key={hoveredDay.date}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.1 }}
            >
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-disabled)] block">
                Day {hoveredDay.day}
              </span>
              <span
                className={`font-display text-lg font-extrabold block tabular-nums ${
                  hoveredNet > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : hoveredNet < 0
                    ? 'text-[#F05010]'
                    : 'text-[var(--text-primary)]'
                }`}
              >
                {hoveredNet > 0
                  ? `+${formatINR(hoveredNet)}`
                  : formatINR(Math.abs(hoveredNet))}
              </span>
              <span className="text-[9px] font-semibold text-[var(--text-secondary)] block">
                +{formatINR(hoveredDay.income ?? 0)} In • {formatINR(hoveredDay.expense ?? hoveredDay.amount)} Out
              </span>
            </motion.div>
          ) : (
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-disabled)] block">
                Net Cash Flow
              </span>
              <span
                className={`font-display text-xl sm:text-2xl font-extrabold block tabular-nums ${
                  totalAmount > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : totalAmount < 0
                    ? 'text-[#F05010]'
                    : 'text-[var(--text-primary)]'
                }`}
              >
                {totalAmount > 0
                  ? `+${formatINR(totalAmount)}`
                  : formatINR(Math.abs(totalAmount))}
              </span>
              <span className="text-[9px] font-semibold text-[var(--text-secondary)] block">
                {series.length} days cycle
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="text-[11px] font-semibold text-[var(--text-secondary)] text-center">
        Hover over radial ticks to inspect daily net cash flow. Emerald indicates net inflow; orange indicates net outflow.
      </div>
    </div>
  );
};

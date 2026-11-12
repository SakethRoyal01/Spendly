import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategorySummary } from '../../utils/calculations';
import type { Expense, ExpenseCategory } from '../../types/expense';
import { CATEGORIES_CONFIG } from '../../utils/categories';
import { formatINR } from '../../utils/currency';
import { formatDateShort } from '../../utils/dates';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, X } from 'lucide-react';

interface CategoryBreakdownChartProps {
  summaries: CategorySummary[];
  totalExpense: number;
  periodExpenses: Expense[];
}

// Blockit-inspired tonal color palette for categories
const CATEGORY_COLORS = [
  '#F05010', // Top category: strong orange accent
  '#E89878', // Second: soft orange
  '#484848', // Charcoal
  '#787068', // Muted slate
  '#A8A8A8', // Grey
  '#686058', // Warm brown
  '#8E8880', // Soft taupe
  '#B8B0A8', // Light beige
  '#505050', // Medium charcoal
];

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  summaries,
  totalExpense,
  periodExpenses,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  if (summaries.length === 0 || totalExpense === 0) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-3xl p-8 border border-[var(--border-subtle)] text-center">
        <p className="text-sm font-semibold text-[var(--text-disabled)]">
          No expenses recorded for this period.
        </p>
      </div>
    );
  }

  const activeCategorySummary = selectedCategory
    ? summaries.find((s) => s.category === selectedCategory)
    : null;

  // Filter transactions when category is clicked
  const filteredTransactions = selectedCategory
    ? periodExpenses.filter((e) => e.category === selectedCategory)
    : [];

  return (
    <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--text-disabled)] block">
            Distribution
          </span>
          <h3 className="font-display text-lg sm:text-xl font-extrabold text-[var(--text-primary)] mt-0.5">
            Category Breakdown
          </h3>
        </div>

        {selectedCategory && (
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear filter</span>
          </button>
        )}
      </div>

      {/* Donut Chart & Category Legend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Donut Graphic */}
        <div className="relative w-full h-56 sm:h-64 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={summaries}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                cornerRadius={6}
                onClick={(entry) => {
                  const cat = (entry as unknown as { category: ExpenseCategory }).category;
                  setSelectedCategory((prev) => (prev === cat ? null : cat));
                }}
                className="cursor-pointer"
              >
                {summaries.map((entry, index) => {
                  const isSelected = selectedCategory === entry.category;
                  const baseColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                  return (
                    <Cell
                      key={entry.category}
                      fill={baseColor}
                      stroke="var(--bg-surface)"
                      strokeWidth={isSelected ? 4 : 2}
                      className="transition-transform duration-200 outline-none"
                    />
                  );
                })}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload as CategorySummary;
                  return (
                    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-2.5 shadow-xl text-xs space-y-0.5">
                      <p className="font-bold text-[var(--text-primary)]">{data.category}</p>
                      <p className="font-display font-extrabold text-[#F05010]">
                        {formatINR(data.amount)} ({data.percentage}%)
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Donut Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-disabled)]">
              {activeCategorySummary ? activeCategorySummary.category : 'Total'}
            </span>
            <span className="font-display text-lg sm:text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {formatINR(activeCategorySummary ? activeCategorySummary.amount : totalExpense)}
            </span>
            <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
              {activeCategorySummary
                ? `${activeCategorySummary.percentage}% of total`
                : `${summaries.length} categories`}
            </span>
          </div>
        </div>

        {/* Category List & Percentage Breakdown */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {summaries.map((cat, index) => {
            const isSelected = selectedCategory === cat.category;
            const meta = CATEGORIES_CONFIG[cat.category];
            const Icon = meta?.icon || ArrowUpRight;
            const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

            return (
              <button
                type="button"
                key={cat.category}
                onClick={() => setSelectedCategory((prev) => (prev === cat.category ? null : cat.category))}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[#F05010] text-white shadow-xs'
                    : 'bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: isSelected ? '#FFFFFF' : color }}
                  />
                  <Icon className="w-4 h-4 shrink-0 opacity-80" />
                  <span className="text-xs font-bold truncate">{cat.category}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[11px] font-semibold ${isSelected ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                    {cat.percentage}%
                  </span>
                  <span className="font-display text-xs font-bold tabular-nums">
                    {formatINR(cat.amount)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtered Transactions List for Selected Category */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="pt-4 border-t border-[var(--border-subtle)] space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {selectedCategory} Transactions ({filteredTransactions.length})
              </span>
              <span className="text-xs font-bold text-[#F05010]">
                {formatINR(activeCategorySummary?.amount || 0)}
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-input)] text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-[var(--text-primary)] block truncate">
                      {tx.description || tx.category}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      {formatDateShort(tx.date)}
                    </span>
                  </div>
                  <span className="font-display font-bold text-[var(--text-primary)] shrink-0 tabular-nums">
                    {formatINR(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

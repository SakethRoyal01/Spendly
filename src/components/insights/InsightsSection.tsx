// import React, { useState, useMemo } from 'react';
// import { useFinance } from '../../hooks/useFinance';
// import {
//   calculateWeeklyReport,
//   calculateMonthlyReport,
//   calculateCategoryBreakdownForRange,
// } from '../../utils/calculations';
// import { getCurrentMonthString, getMonthWithOffset, getWeekInterval } from '../../utils/dates';
// import { formatINR } from '../../utils/currency';
// import { RotaryDial, type RotaryOption } from './RotaryDial';
// import { WeeklyChart } from './WeeklyChart';
// import { MonthlyChart } from './MonthlyChart';
// import { CategoryBreakdownChart } from './CategoryBreakdownChart';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   TrendingUp,
//   TrendingDown,
//   Sparkles,
//   Info,
// } from 'lucide-react';

// type ReportMode = 'weekly' | 'monthly';

// export const InsightsSection: React.FC = () => {
//   const { expenses, incomes } = useFinance();
//   const [reportMode, setReportMode] = useState<ReportMode>('weekly');

//   // Period offsets (0 = current, -1 = last, etc.)
//   const [weekOffset, setWeekOffset] = useState<number>(0);
//   const [monthOffset, setMonthOffset] = useState<number>(0);

//   // Generate Rotary dial options
//   const weekOptions: RotaryOption[] = useMemo(() => {
//     const offsets = [-4, -3, -2, -1, 0, 1];
//     return offsets.map((offset) => {
//       const interval = getWeekInterval(new Date(), offset);
//       let shortLabel: string;
//       let fullLabel: string;

//       if (offset === 0) {
//         shortLabel = 'Now';
//         fullLabel = 'This Week';
//       } else if (offset === -1) {
//         shortLabel = '-1w';
//         fullLabel = 'Last Week';
//       } else if (offset === 1) {
//         shortLabel = '+1w';
//         fullLabel = 'Next Week';
//       } else {
//         shortLabel = `${offset}w`;
//         fullLabel = `${Math.abs(offset)} Weeks Ago`;
//       }

//       return {
//         offset,
//         shortLabel,
//         fullLabel,
//         subLabel: interval.formattedRange,
//       };
//     });
//   }, []);

//   const monthOptions: RotaryOption[] = useMemo(() => {
//     const currentMonth = getCurrentMonthString();
//     const offsets = [-4, -3, -2, -1, 0, 1];

//     return offsets.map((offset) => {
//       const targetMonth = getMonthWithOffset(currentMonth, offset);
//       let shortLabel: string;
//       let fullLabel: string;

//       if (offset === 0) {
//         shortLabel = 'Now';
//         fullLabel = 'This Month';
//       } else if (offset === -1) {
//         shortLabel = '-1m';
//         fullLabel = 'Last Month';
//       } else if (offset === 1) {
//         shortLabel = '+1m';
//         fullLabel = 'Next Month';
//       } else {
//         shortLabel = `${offset}m`;
//         fullLabel = `${Math.abs(offset)} Months Ago`;
//       }

//       // Format month label nicely: "Nov 2026"
//       const date = new Date(`${targetMonth}-01`);
//       const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

//       return {
//         offset,
//         shortLabel,
//         fullLabel,
//         subLabel: monthStr,
//       };
//     });
//   }, []);

//   // Compute Weekly Report Data with daily net cash flow
//   const weeklyReport = useMemo(() => {
//     return calculateWeeklyReport(expenses, new Date(), weekOffset, incomes);
//   }, [expenses, incomes, weekOffset]);

//   // Compute Monthly Report Data with daily net cash flow
//   const currentMonth = getCurrentMonthString();
//   const selectedYearMonth = useMemo(() => {
//     return getMonthWithOffset(currentMonth, monthOffset);
//   }, [currentMonth, monthOffset]);

//   const monthlyReport = useMemo(() => {
//     return calculateMonthlyReport(expenses, selectedYearMonth, incomes);
//   }, [expenses, incomes, selectedYearMonth]);

//   // Date range for Category breakdown
//   const categoryPeriodData = useMemo(() => {
//     if (reportMode === 'weekly') {
//       const interval = getWeekInterval(new Date(), weekOffset);
//       const filtered = expenses.filter(
//         (e) => e.date >= interval.startDateStr && e.date <= interval.endDateStr
//       );
//       const { summaries, totalExpense } = calculateCategoryBreakdownForRange(
//         expenses,
//         interval.startDateStr,
//         interval.endDateStr
//       );
//       return { summaries, totalExpense, periodExpenses: filtered };
//     } else {
//       const startStr = `${selectedYearMonth}-01`;
//       const endStr = `${selectedYearMonth}-31`;
//       const filtered = expenses.filter(
//         (e) => e.date >= startStr && e.date <= endStr
//       );
//       const { summaries, totalExpense } = calculateCategoryBreakdownForRange(
//         expenses,
//         startStr,
//         endStr
//       );
//       return { summaries, totalExpense, periodExpenses: filtered };
//     }
//   }, [reportMode, weekOffset, selectedYearMonth, expenses]);

//   const currentNetCashFlow = reportMode === 'weekly' ? weeklyReport.netCashFlow : monthlyReport.netCashFlow;
//   const currentIncome = reportMode === 'weekly' ? weeklyReport.totalIncome : monthlyReport.totalIncome;
//   const currentExpense = reportMode === 'weekly' ? weeklyReport.totalExpense : monthlyReport.totalExpense;
//   const currentAvgNet = reportMode === 'weekly' ? weeklyReport.averageDailyNetCashFlow : monthlyReport.averageDailyNetCashFlow;

//   return (
//     <div className="space-y-8">
//       {/* 1. Header & Segmented WEEKLY | MONTHLY Control */}
//       <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
//         <div>
//           <div className="flex items-center gap-2">
//             <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#F05010]">
//               Analytics
//             </span>
//             <Sparkles className="w-3.5 h-3.5 text-[#F05010]" />
//           </div>
//           <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mt-0.5">
//             Financial Insights
//           </h2>
//           <p className="text-xs font-semibold text-[var(--text-secondary)] mt-1">
//             Daily net cash flow, income additions, spending outflows, and category distribution
//           </p>
//         </div>

//         {/* Tactile Segmented Selector: WEEKLY | MONTHLY */}
//         <div className="p-1 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] flex items-center gap-1 self-start sm:self-auto shadow-xs">
//           <button
//             type="button"
//             onClick={() => setReportMode('weekly')}
//             className={`px-4 py-2 rounded-xl text-xs font-display font-extrabold tracking-wide uppercase transition-all cursor-pointer ${reportMode === 'weekly'
//               ? 'bg-[#F05010] text-white shadow-xs'
//               : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
//               }`}
//           >
//             Weekly
//           </button>
//           <button
//             type="button"
//             onClick={() => setReportMode('monthly')}
//             className={`px-4 py-2 rounded-xl text-xs font-display font-extrabold tracking-wide uppercase transition-all cursor-pointer ${reportMode === 'monthly'
//               ? 'bg-[#F05010] text-white shadow-xs'
//               : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
//               }`}
//           >
//             Monthly
//           </button>
//         </div>
//       </div>

//       {/* 2. Interactive Controls Grid: Rotary Dial + Quick Metrics Tile */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
//         {/* Rotary Period Dial (Occupies 1 column) */}
//         <div className="md:col-span-1">
//           <RotaryDial
//             options={reportMode === 'weekly' ? weekOptions : monthOptions}
//             currentOffset={reportMode === 'weekly' ? weekOffset : monthOffset}
//             onChangeOffset={reportMode === 'weekly' ? setWeekOffset : setMonthOffset}
//             title={reportMode === 'weekly' ? 'Week Dial' : 'Month Dial'}
//           />
//         </div>

//         {/* Overview Tiles (Occupies 2 columns) */}
//         <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
//           {/* Tile 1: Net Cash Flow in Period */}
//           <div className="bg-[var(--bg-surface)] rounded-3xl p-6 border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between">
//             <div>
//               <div className="flex items-center justify-between">
//                 <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--text-disabled)] block">
//                   {reportMode === 'weekly' ? 'Weekly Net Cash Flow' : 'Monthly Net Cash Flow'}
//                 </span>
//                 <span className="text-[10px] font-bold text-[var(--text-secondary)]">
//                   Received − Spent
//                 </span>
//               </div>
//               <div
//                 className={`font-display text-3xl sm:text-4xl font-extrabold mt-2 tracking-tight tabular-nums ${currentNetCashFlow > 0
//                   ? 'text-emerald-600 dark:text-emerald-400'
//                   : currentNetCashFlow < 0
//                     ? 'text-[#F05010]'
//                     : 'text-[var(--text-primary)]'
//                   }`}
//               >
//                 {currentNetCashFlow > 0
//                   ? `+${formatINR(currentNetCashFlow)}`
//                   : formatINR(Math.abs(currentNetCashFlow))}
//               </div>

//               {/* Breakdown of Received vs Spent */}
//               <div className="flex items-center gap-2.5 mt-2 text-xs font-bold">
//                 <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
//                   +{formatINR(currentIncome)} In
//                 </span>
//                 <span className="text-[var(--text-disabled)]">•</span>
//                 <span className="text-[#F05010] tabular-nums">
//                   {formatINR(currentExpense)} Out
//                 </span>
//               </div>
//             </div>

//             {/* Comparison pill */}
//             <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2">
//               {(() => {
//                 const comp = reportMode === 'weekly' ? weeklyReport.comparison : monthlyReport.comparison;
//                 const prevLabel = reportMode === 'weekly' ? 'prior week' : 'prior month';

//                 if (!comp.hasPreviousData) {
//                   return (
//                     <span className="text-[11px] font-semibold text-[var(--text-disabled)] flex items-center gap-1.5">
//                       <Info className="w-3.5 h-3.5 shrink-0" />
//                       <span>No prior records to compare</span>
//                     </span>
//                   );
//                 }

//                 if (comp.percentChange === null) {
//                   return (
//                     <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
//                       First recorded activity
//                     </span>
//                   );
//                 }

//                 const isHigher = comp.percentChange > 0;
//                 const isLower = comp.percentChange < 0;

//                 return (
//                   <div className="flex items-center gap-1.5 text-xs font-bold">
//                     <span
//                       className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${isLower
//                         ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
//                         : isHigher
//                           ? 'bg-[#F05010]/15 text-[#F05010]'
//                           : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'
//                         }`}
//                     >
//                       {isLower ? (
//                         <TrendingDown className="w-3.5 h-3.5" />
//                       ) : (
//                         <TrendingUp className="w-3.5 h-3.5" />
//                       )}
//                       <span>
//                         {Math.abs(comp.percentChange)}%
//                       </span>
//                     </span>
//                     <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
//                       spending {isLower ? 'less than' : isHigher ? 'more than' : 'same as'} {prevLabel}
//                     </span>
//                   </div>
//                 );
//               })()}
//             </div>
//           </div>

//           {/* Tile 2: Daily Average Net Flow & Peak Day */}
//           <div className="bg-[var(--bg-surface)] rounded-3xl p-6 border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between space-y-4">
//             <div>
//               <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--text-disabled)] block">
//                 Daily Average Net Flow
//               </span>
//               <div
//                 className={`font-display text-2xl sm:text-3xl font-extrabold mt-1.5 tabular-nums ${currentAvgNet > 0
//                   ? 'text-emerald-600 dark:text-emerald-400'
//                   : currentAvgNet < 0
//                     ? 'text-[#F05010]'
//                     : 'text-[var(--text-primary)]'
//                   }`}
//               >
//                 {currentAvgNet > 0
//                   ? `+${formatINR(currentAvgNet)}`
//                   : formatINR(Math.abs(currentAvgNet))}
//               </div>
//               <span className="text-[11px] font-medium text-[var(--text-secondary)] mt-0.5 block">
//                 Average daily net flow over period
//               </span>
//             </div>

//             <div className="pt-3 border-t border-[var(--border-subtle)]">
//               <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-disabled)] block">
//                 Peak Spend Day
//               </span>
//               {reportMode === 'weekly' ? (
//                 weeklyReport.highestDay ? (
//                   <div className="flex items-center justify-between text-xs font-bold mt-1">
//                     <span className="text-[var(--text-primary)]">{weeklyReport.highestDay.dayName}</span>
//                     <span className="text-[#F05010] font-display tabular-nums">{formatINR(weeklyReport.highestDay.amount)}</span>
//                   </div>
//                 ) : (
//                   <span className="text-xs text-[var(--text-disabled)] italic mt-1 block">No spending recorded</span>
//                 )
//               ) : monthlyReport.highestDay ? (
//                 <div className="flex items-center justify-between text-xs font-bold mt-1">
//                   <span className="text-[var(--text-primary)]">Day {monthlyReport.highestDay.dayNumber}</span>
//                   <span className="text-[#F05010] font-display tabular-nums">{formatINR(monthlyReport.highestDay.amount)}</span>
//                 </div>
//               ) : (
//                 <span className="text-xs text-[var(--text-disabled)] italic mt-1 block">No spending recorded</span>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* 3. Interactive Chart Section */}
//       <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs space-y-4">
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
//           <div>
//             <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F05010] block">
//               Pattern Visualization
//             </span>
//             <h3 className="font-display text-lg sm:text-xl font-extrabold text-[var(--text-primary)] mt-0.5">
//               {reportMode === 'weekly'
//                 ? `Daily Net Cash Flow — ${weeklyReport.dateRangeLabel}`
//                 : `Daily Net Cash Flow — ${monthlyReport.monthLabel}`}
//             </h3>
//           </div>

//           <div className="flex items-center gap-3 text-xs font-semibold text-[var(--text-secondary)]">
//             <span className="flex items-center gap-1.5">
//               <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
//               <span>+ Net Inflow</span>
//             </span>
//             <span className="flex items-center gap-1.5">
//               <span className="w-2.5 h-2.5 rounded-full bg-[#F05010]" />
//               <span>Net Outflow</span>
//             </span>
//           </div>
//         </div>

//         <AnimatePresence mode="wait">
//           {reportMode === 'weekly' ? (
//             <motion.div
//               key={`weekly-${weekOffset}`}
//               initial={{ opacity: 0, y: 6 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -6 }}
//               transition={{ duration: 0.18 }}
//             >
//               <WeeklyChart days={weeklyReport.days} />
//             </motion.div>
//           ) : (
//             <motion.div
//               key={`monthly-${monthOffset}`}
//               initial={{ opacity: 0, y: 6 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -6 }}
//               transition={{ duration: 0.18 }}
//             >
//               <MonthlyChart
//                 series={monthlyReport.series}
//                 averageDailySpending={monthlyReport.averageDailySpending}
//                 averageDailyNetCashFlow={monthlyReport.averageDailyNetCashFlow}
//               />
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       {/* 4. Category Spending Breakdown with Interactive Donut */}
//       <CategoryBreakdownChart
//         summaries={categoryPeriodData.summaries}
//         totalExpense={categoryPeriodData.totalExpense}
//         periodExpenses={categoryPeriodData.periodExpenses}
//       />
//     </div>
//   );
// };


import React, { useMemo } from 'react';
import { useFinance } from '../../hooks/useFinance';
import { formatINR } from '../../utils/currency';
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Info,
  Receipt,
} from 'lucide-react';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

/* ----------------------------- helpers ----------------------------- */

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKeyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

const shiftMonth = (key: string, offset: number) => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

const daysInMonth = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

const monthShort = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short' });
};

const parseYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const pick = (o: unknown, k: string): unknown => (o as Record<string, unknown>)[k];
const amountOf = (o: unknown) => Number(pick(o, 'amount')) || 0;
const dateOf = (o: unknown) => String(pick(o, 'date') ?? '');
const categoryOf = (o: unknown) => String(pick(o, 'category') ?? 'Other');
const labelOf = (o: unknown) =>
  String(
    pick(o, 'note') ||
    pick(o, 'description') ||
    pick(o, 'title') ||
    pick(o, 'name') ||
    categoryOf(o)
  );

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type InsightTone = 'good' | 'warn' | 'info';
interface Insight {
  tone: InsightTone;
  title: string;
  detail: string;
}

/* ----------------------------- component ----------------------------- */

export const InsightsSection: React.FC = () => {
  const { expenses, incomes, changeTransactions } = useFinance();

  const data = useMemo(() => {
    const now = new Date();
    const thisKey = monthKeyOf(now);
    const today = now.getDate();
    const dim = daysInMonth(thisKey);
    const daysLeft = dim - today; // days after today

    // ---- aggregate by month ----
    const byMonth: Record<string, { income: number; expense: number; cats: Record<string, number> }> = {};
    const ensure = (k: string) =>
      (byMonth[k] ??= { income: 0, expense: 0, cats: {} });

    for (const e of expenses) {
      const d = dateOf(e);
      if (d.length < 7) continue;
      const m = ensure(d.slice(0, 7));
      const a = amountOf(e);
      m.expense += a;
      const c = categoryOf(e);
      m.cats[c] = (m.cats[c] ?? 0) + a;
    }
    // Deduct change from monthly spending
    for (const ch of changeTransactions) {
      const d = dateOf(ch);
      if (d.length < 7) continue;
      const m = ensure(d.slice(0, 7));
      m.expense = Math.max(0, m.expense - amountOf(ch));
    }
    for (const i of incomes) {
      const d = dateOf(i);
      if (d.length < 7) continue;
      ensure(d.slice(0, 7)).income += amountOf(i);
    }

    const cur = ensure(thisKey);

    // ---- last 6 months for trend ----
    const trend = [-5, -4, -3, -2, -1, 0].map((off) => {
      const key = shiftMonth(thisKey, off);
      const m = byMonth[key] ?? { income: 0, expense: 0, cats: {} };
      return { key, label: monthShort(key), income: m.income, expense: m.expense, net: m.income - m.expense };
    });

    // ---- baseline = average of previous 3 months that have spending ----
    const prevKeys = [-3, -2, -1]
      .map((o) => shiftMonth(thisKey, o))
      .filter((k) => (byMonth[k]?.expense ?? 0) > 0);
    const baseline =
      prevKeys.length > 0
        ? prevKeys.reduce((s, k) => s + byMonth[k].expense, 0) / prevKeys.length
        : 0;

    // ---- projection (needs a few days of data to be meaningful) ----
    const projected = today >= 3 ? (cur.expense / today) * dim : null;

    // ---- budget guide: what's left of a "usual month" ----
    const remaining = baseline > 0 ? baseline - cur.expense : null;
    const perDayAllowed =
      remaining !== null && remaining > 0 ? remaining / (daysLeft + 1) : null;

    // ---- category: so far vs usual-by-this-day ----
    const prevCatAvg: Record<string, number> = {};
    for (const k of prevKeys) {
      for (const [c, v] of Object.entries(byMonth[k].cats)) {
        prevCatAvg[c] = (prevCatAvg[c] ?? 0) + v / prevKeys.length;
      }
    }
    const allCats = new Set([...Object.keys(cur.cats), ...Object.keys(prevCatAvg)]);
    const categories = [...allCats]
      .map((c) => {
        const spent = cur.cats[c] ?? 0;
        const usualFull = prevCatAvg[c] ?? 0;
        const usualByNow = usualFull * (today / dim);
        const diff = spent - usualByNow;
        const pct = usualByNow > 0 ? (diff / usualByNow) * 100 : null;
        return { name: c, spent, usualFull, usualByNow, diff, pct };
      })
      .filter((c) => c.spent > 0)
      .sort((a, b) => b.spent - a.spent);

    // ---- weekday pattern, last 90 days ----
    const weekdaySum = Array(7).fill(0) as number[];
    const weekdayCount = Array(7).fill(0) as number[];
    const start = new Date(now);
    start.setDate(start.getDate() - 89);
    for (let i = 0; i < 90; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      weekdayCount[d.getDay()] += 1;
    }
    const startStr = ymd(start);
    const todayStr = ymd(now);
    let weekdayData = 0;
    for (const e of expenses) {
      const d = dateOf(e);
      if (d >= startStr && d <= todayStr) {
        weekdaySum[parseYmd(d).getDay()] += amountOf(e);
        weekdayData += 1;
      }
    }
    const weekdayAvg = weekdaySum.map((s, i) => (weekdayCount[i] ? s / weekdayCount[i] : 0));
    const weekdayMax = Math.max(...weekdayAvg);
    const weekdayHasData = weekdayData >= 7;

    // ---- biggest expenses this month ----
    const monthStart = `${thisKey}-01`;
    const monthEnd = `${thisKey}-31`;
    const biggest = expenses
      .filter((e) => dateOf(e) >= monthStart && dateOf(e) <= monthEnd)
      .sort((a, b) => amountOf(b) - amountOf(a))
      .slice(0, 5);
    const biggestTotal = biggest.reduce((s, e) => s + amountOf(e), 0);

    // ---- savings ----
    const saved = cur.income - cur.expense;
    const savingsRate = cur.income > 0 ? (saved / cur.income) * 100 : null;

    // ---- plain-language insights ----
    const insights: Insight[] = [];

    if (projected !== null && baseline > 0) {
      const diff = projected - baseline;
      const pct = Math.abs(Math.round((diff / baseline) * 100));
      if (diff > baseline * 0.1) {
        insights.push({
          tone: 'warn',
          title: `On pace to spend ${formatINR(Math.round(projected))} this month`,
          detail: `That's ${pct}% above your usual ${formatINR(Math.round(baseline))}. Slow down for the next ${daysLeft} days to close the gap.`,
        });
      } else if (diff < -baseline * 0.1) {
        insights.push({
          tone: 'good',
          title: `On pace to spend ${formatINR(Math.round(projected))} this month`,
          detail: `That's ${pct}% below your usual ${formatINR(Math.round(baseline))}. Keep going.`,
        });
      } else {
        insights.push({
          tone: 'info',
          title: `On pace to spend ${formatINR(Math.round(projected))} this month`,
          detail: `Right in line with your usual ${formatINR(Math.round(baseline))}.`,
        });
      }
    } else if (projected !== null) {
      insights.push({
        tone: 'info',
        title: `On pace to spend ${formatINR(Math.round(projected))} this month`,
        detail: 'Add a couple more months of data to see how this compares to your usual.',
      });
    }

    const risers = categories
      .filter((c) => c.pct !== null && c.pct > 30 && c.diff >= 500)
      .sort((a, b) => b.diff - a.diff);
    if (risers[0] && today >= 5) {
      const c = risers[0];
      insights.push({
        tone: 'warn',
        title: `${c.name} is running high`,
        detail: `${formatINR(Math.round(c.spent))} so far, about ${formatINR(Math.round(c.diff))} more than you'd normally have spent by day ${today}.`,
      });
    }

    const newCat = categories.find((c) => c.usualFull === 0 && c.spent >= 500 && prevKeys.length > 0);
    if (newCat) {
      insights.push({
        tone: 'info',
        title: `New spending in ${newCat.name}`,
        detail: `${formatINR(Math.round(newCat.spent))} this month, and nothing in this category in the last ${prevKeys.length} month${prevKeys.length > 1 ? 's' : ''}.`,
      });
    }

    const topCat = categories[0];
    if (topCat && cur.expense > 0) {
      const share = Math.round((topCat.spent / cur.expense) * 100);
      if (share >= 40) {
        insights.push({
          tone: 'info',
          title: `${share}% of your spending is ${topCat.name}`,
          detail: 'One category is driving most of your month, so that is where small cuts matter most.',
        });
      }
    }

    if (savingsRate !== null) {
      if (savingsRate >= 20) {
        insights.push({
          tone: 'good',
          title: `You've kept ${Math.round(savingsRate)}% of your income`,
          detail: `${formatINR(Math.round(saved))} saved so far this month.`,
        });
      } else if (savingsRate < 0) {
        insights.push({
          tone: 'warn',
          title: "You've spent more than you've received",
          detail: `Spending is ${formatINR(Math.round(Math.abs(saved)))} above income this month.`,
        });
      } else if (savingsRate < 10 && cur.income > 0) {
        insights.push({
          tone: 'warn',
          title: `Only ${Math.max(0, Math.round(savingsRate))}% of income is left`,
          detail: 'A common target is to keep 20% or more.',
        });
      }
    } else if (cur.expense > 0) {
      insights.push({
        tone: 'info',
        title: 'No income recorded this month',
        detail: 'Add your income to see savings rate and net cash flow.',
      });
    }

    if (weekdayHasData && weekdayMax > 0) {
      const topIdx = weekdayAvg.indexOf(weekdayMax);
      const overall = weekdayAvg.reduce((s, v) => s + v, 0) / 7;
      if (overall > 0 && weekdayMax > overall * 1.4) {
        insights.push({
          tone: 'info',
          title: `${WEEKDAYS[topIdx]} is your costliest day`,
          detail: `You spend about ${formatINR(Math.round(weekdayMax))} on a typical ${WEEKDAYS[topIdx]}, ${Math.round(weekdayMax / overall)}x your daily average.`,
        });
      }
    }

    return {
      today,
      dim,
      daysLeft,
      cur,
      trend,
      baseline,
      prevCount: prevKeys.length,
      projected,
      remaining,
      perDayAllowed,
      categories,
      weekdayAvg,
      weekdayMax,
      weekdayHasData,
      biggest,
      biggestTotal,
      saved,
      savingsRate,
      insights,
    };
  }, [expenses, incomes]);

  const hasAnyData = expenses.length > 0 || incomes.length > 0;

  if (!hasAnyData) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-3xl p-10 border border-[var(--border-subtle)] text-center">
        <h2 className="font-display text-xl font-extrabold text-[var(--text-primary)]">
          No insights yet
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-sm mx-auto">
          Add a few expenses and your income. Insights show up once there is something to compare.
        </p>
      </div>
    );
  }

  const {
    cur,
    today,
    dim,
    daysLeft,
    baseline,
    prevCount,
    projected,
    remaining,
    perDayAllowed,
    categories,
    trend,
    weekdayAvg,
    weekdayMax,
    weekdayHasData,
    biggest,
    biggestTotal,
    saved,
    savingsRate,
    insights,
  } = data;

  const monthName = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const trendMax = Math.max(1, ...trend.flatMap((t) => [t.income, t.expense]));
  const monthProgress = Math.round((today / dim) * 100);

  const toneStyles: Record<InsightTone, { wrap: string; icon: React.ReactNode }> = {
    good: {
      wrap: 'border-emerald-500/30 bg-emerald-500/10',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
    },
    warn: {
      wrap: 'border-[#F05010]/30 bg-[#F05010]/10',
      icon: <AlertTriangle className="w-4 h-4 text-[#F05010] shrink-0 mt-0.5" />,
    },
    info: {
      wrap: 'border-[var(--border-subtle)] bg-[var(--bg-input)]',
      icon: <Info className="w-4 h-4 text-[var(--text-secondary)] shrink-0 mt-0.5" />,
    },
  };

  const card = 'bg-[var(--bg-surface)] rounded-3xl p-6 border border-[var(--border-subtle)] shadow-xs';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Insights
        </h2>
        <p className="text-xs font-semibold text-[var(--text-secondary)] mt-1">
          {monthName} · day {today} of {dim}
        </p>
      </div>

      {/* 1. The answer: how is this month going? */}
      <div className={`${card} space-y-5`}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Spent this month</span>
            <div className="font-display text-4xl sm:text-5xl font-extrabold tabular-nums tracking-tight text-[var(--text-primary)] mt-1">
              {formatINR(cur.expense)}
            </div>
            <div className="text-xs font-semibold text-[var(--text-secondary)] mt-1.5 tabular-nums">
              {formatINR(cur.income)} received ·{' '}
              <span
                className={
                  saved >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-[#F05010]'
                }
              >
                {saved >= 0 ? `${formatINR(saved)} left` : `${formatINR(Math.abs(saved))} over`}
              </span>
              {savingsRate !== null && ` (${Math.round(savingsRate)}% saved)`}
            </div>
          </div>

          {projected !== null && (
            <div className="sm:text-right">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Projected by month end</span>
              <div className="font-display text-2xl font-extrabold tabular-nums text-[var(--text-primary)] mt-1">
                {formatINR(Math.round(projected))}
              </div>
              {baseline > 0 && (
                <div className="text-xs font-semibold text-[var(--text-secondary)] mt-1 tabular-nums">
                  Usual: {formatINR(Math.round(baseline))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress vs usual month */}
        {baseline > 0 && (
          <div>
            <div className="relative h-3 rounded-full bg-[var(--bg-input)] overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${cur.expense > baseline ? 'bg-[#F05010]' : 'bg-emerald-500'
                  }`}
                style={{ width: `${Math.min(100, (cur.expense / baseline) * 100)}%` }}
              />
              {/* where you "should" be today */}
              <div
                className="absolute inset-y-0 w-0.5 bg-[var(--text-primary)]"
                style={{ left: `${monthProgress}%` }}
                title="Today"
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-[var(--text-secondary)] mt-1.5">
              <span>
                {Math.round((cur.expense / baseline) * 100)}% of a usual month used, {monthProgress}% of the month gone
              </span>
              <span className="tabular-nums">
                {remaining !== null && remaining > 0
                  ? `${formatINR(Math.round(remaining))} to go`
                  : 'Over usual'}
              </span>
            </div>
          </div>
        )}

        {perDayAllowed !== null && (
          <div className="rounded-2xl bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)]">
            To stay within a usual month, spend up to{' '}
            <span className="font-display font-extrabold tabular-nums">
              {formatINR(Math.round(perDayAllowed))}
            </span>{' '}
            a day for the next {daysLeft + 1} day{daysLeft + 1 === 1 ? '' : 's'}.
          </div>
        )}
        {baseline === 0 && (
          <p className="text-xs text-[var(--text-secondary)]">
            Once you have a previous month of spending, this shows how you compare to your usual.
          </p>
        )}
      </div>

      {/* 2. What to pay attention to */}
      {insights.length > 0 && (
        <div className={card}>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-[#F05010]" />
            <h3 className="font-display text-lg font-extrabold text-[var(--text-primary)]">
              What stands out
            </h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((ins, i) => (
              <li
                key={i}
                className={`flex gap-3 rounded-2xl border p-4 ${toneStyles[ins.tone].wrap}`}
              >
                {toneStyles[ins.tone].icon}
                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">{ins.title}</div>
                  <div className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">
                    {ins.detail}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Where the money went, compared with usual */}
      <div className={card}>
        <h3 className="font-display text-lg font-extrabold text-[var(--text-primary)]">
          Where your money went
        </h3>

        <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5 mb-4">
          {prevCount > 0
            ? `Compared with what you'd usually have spent by day ${today} (average of your last ${prevCount} month${prevCount > 1 ? 's' : ''}).`
            : 'Compared with previous months once you have them.'}
        </p>

        {categories.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            No spending recorded this month.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {(() => {
              const chartColors = [
                '#F59E0B',
                '#10B981',
                '#6366F1',
                '#EC4899',
                '#06B6D4',
                '#F97316',
                '#8B5CF6',
              ];

              const chartData = categories.slice(0, 7).map((c, i) => ({
                name: c.name,
                value: c.spent,
                color: chartColors[i % chartColors.length],
              }));

              return (
                <>
                  <div className="relative w-full max-w-[220px] aspect-square shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius="65%"
                          outerRadius="95%"
                          paddingAngle={3}
                          stroke="none"
                          cornerRadius={5}
                        >
                          {chartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatINR(Math.round(Number(value)))}
                          contentStyle={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Total spent
                      </span>
                      <span className="font-display text-xl font-extrabold text-[var(--text-primary)] tabular-nums">
                        {formatINR(Math.round(cur.expense))}
                      </span>
                    </div>
                  </div>

                  <ul className="w-full min-w-0 space-y-3">
                    {categories.slice(0, 7).map((c, i) => {
                      const share = cur.expense > 0
                        ? (c.spent / cur.expense) * 100
                        : 0;

                      const up = c.pct !== null && c.pct > 15 && c.diff >= 200;
                      const down = c.pct !== null && c.pct < -15 && c.diff <= -200;

                      return (
                        <li key={c.name} className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                              style={{ backgroundColor: chartColors[i % chartColors.length] }}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                                {c.name}
                              </p>
                              <p className="text-[11px] font-medium text-[var(--text-secondary)] tabular-nums">
                                {Math.round(share)}% of spending
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm font-display font-extrabold text-[var(--text-primary)] tabular-nums">
                              {formatINR(Math.round(c.spent))}
                            </p>
                            {c.pct !== null && (up || down) && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${up ? 'text-[#F05010]' : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                {up
                                  ? <TrendingUp className="w-3 h-3" />
                                  : <TrendingDown className="w-3 h-3" />}
                                {Math.abs(Math.round(c.pct))}% {up ? 'higher' : 'lower'}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* 4 + 5. Biggest expenses and weekday pattern */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Biggest expenses */}
        <div className={card}>
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#F05010]" />
            <h3 className="font-display text-lg font-extrabold text-[var(--text-primary)]">
              Biggest expenses
            </h3>
          </div>
          {biggest.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] mt-3">Nothing recorded this month.</p>
          ) : (
            <>
              <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5 mb-3 tabular-nums">
                These {biggest.length} make up {cur.expense > 0 ? Math.round((biggestTotal / cur.expense) * 100) : 0}% of this month's spending.
              </p>
              <ul className="divide-y divide-[var(--border-subtle)]">
                {biggest.map((e, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[var(--text-primary)] truncate">
                        {labelOf(e)}
                      </div>
                      <div className="text-[11px] font-medium text-[var(--text-secondary)]">
                        {categoryOf(e)} ·{' '}
                        {parseYmd(dateOf(e)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <span className="font-display font-extrabold tabular-nums text-[var(--text-primary)] shrink-0">
                      {formatINR(amountOf(e))}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Weekday pattern */}
        <div className={card}>
          <h3 className="font-display text-lg font-extrabold text-[var(--text-primary)]">
            Which days you spend most
          </h3>
          <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5 mb-4">
            Average spend per weekday over the last 90 days.
          </p>
          {!weekdayHasData ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Not enough data yet. Keep logging and this will fill in.
            </p>
          ) : (
            <div className="flex items-end justify-between gap-2 h-40">
              {weekdayAvg.map((v, i) => {
                const isMax = v === weekdayMax && v > 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                    <span className="text-[10px] font-bold tabular-nums text-[var(--text-secondary)]">
                      {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}
                    </span>
                    <div
                      className={`w-full rounded-t-lg ${isMax ? 'bg-[#F05010]' : 'bg-[var(--text-secondary)]/40'}`}
                      style={{ height: `${weekdayMax > 0 ? Math.max(4, (v / weekdayMax) * 100) : 4}%` }}
                    />
                    <span
                      className={`text-[11px] font-bold ${isMax ? 'text-[#F05010]' : 'text-[var(--text-secondary)]'}`}
                    >
                      {WEEKDAYS[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 6. Six month trend */}
      <div className={card}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-display text-lg font-extrabold text-[var(--text-primary)]">
            Last 6 months
          </h3>
          <div className="flex items-center gap-4 text-xs font-semibold text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Received
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F05010]" /> Spent
            </span>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2 sm:gap-4 mt-5">
          {trend.map((t, i) => {
            const isCurrent = i === trend.length - 1;
            return (
              <div key={t.key} className="flex flex-col items-center">
                <div className="flex items-end justify-center gap-1 h-32 w-full">
                  <div
                    className="w-1/2 max-w-[22px] rounded-t-md bg-emerald-500"
                    style={{ height: `${t.income > 0 ? Math.max(3, (t.income / trendMax) * 100) : 0}%` }}
                    title={`Received ${formatINR(t.income)}`}
                  />
                  <div
                    className="w-1/2 max-w-[22px] rounded-t-md bg-[#F05010]"
                    style={{ height: `${t.expense > 0 ? Math.max(3, (t.expense / trendMax) * 100) : 0}%` }}
                    title={`Spent ${formatINR(t.expense)}`}
                  />
                </div>
                <span
                  className={`text-[11px] font-bold mt-2 ${isCurrent ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
                >
                  {t.label}
                </span>
                <span
                  className={`text-[10px] font-bold tabular-nums mt-0.5 ${t.net > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : t.net < 0
                      ? 'text-[#F05010]'
                      : 'text-[var(--text-disabled)]'
                    }`}
                >
                  {t.income === 0 && t.expense === 0
                    ? '–'
                    : `${t.net > 0 ? '+' : t.net < 0 ? '−' : ''}${formatINR(Math.abs(Math.round(t.net)))}`}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] font-medium text-[var(--text-secondary)] mt-4">
          The number under each month is what you kept (received minus spent). The current month is still in progress.
        </p>
      </div>
    </div>
  );
};  
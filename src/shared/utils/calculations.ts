import type { Expense, ExpenseCategory, MonthlyStats } from '../../types';
import {
  getTodayDateString,
  getElapsedDaysInMonth,
  getWeekInterval,
  getPreviousMonth,
  formatMonthYear,
} from './dates';
import { parse, getDaysInMonth, format, subWeeks, eachDayOfInterval } from 'date-fns';

/**
 * Calculates net spending for a specific date (YYYY-MM-DD), deducting returned Change
 */
export function calculateDailyTotal(
  expenses: Expense[],
  date: string,
  changeTransactions: Array<{ date: string; amount: number }> = []
): number {
  const gross = expenses
    .filter((e) => e.date === date)
    .reduce((sum, e) => sum + e.amount, 0);
  const change = changeTransactions
    .filter((c) => c.date === date)
    .reduce((sum, c) => sum + c.amount, 0);
  return Math.max(0, Math.round((gross - change) * 100) / 100);
}

/**
 * Calculates net spending for a specific month (YYYY-MM), deducting returned Change
 */
export function calculateMonthlyTotal(
  expenses: Expense[],
  yearMonth: string,
  changeTransactions: Array<{ date: string; amount: number }> = []
): number {
  const gross = expenses
    .filter((e) => e.date.startsWith(yearMonth))
    .reduce((sum, e) => sum + e.amount, 0);
  const change = changeTransactions
    .filter((c) => c.date.startsWith(yearMonth))
    .reduce((sum, c) => sum + c.amount, 0);
  return Math.max(0, Math.round((gross - change) * 100) / 100);
}

/**
 * Calculates today's total net spending (Change deducted)
 */
export function calculateTodayTotal(
  expenses: Expense[],
  changeTransactions: Array<{ date: string; amount: number }> = []
): number {
  const today = getTodayDateString();
  return calculateDailyTotal(expenses, today, changeTransactions);
}

/**
 * Calculates average daily spending for a given month (Change deducted):
 * monthly net total / elapsed days in that month
 */
export function calculateAverageDailySpending(
  expenses: Expense[],
  yearMonth: string,
  changeTransactions: Array<{ date: string; amount: number }> = []
): number {
  const monthlyTotal = calculateMonthlyTotal(expenses, yearMonth, changeTransactions);
  if (monthlyTotal <= 0) return 0;

  const elapsedDays = getElapsedDaysInMonth(yearMonth);
  if (elapsedDays <= 0) return 0;

  return Math.round((monthlyTotal / elapsedDays) * 100) / 100;
}

/**
 * Computes complete monthly summary metrics with Change deducted from amount spent
 */
export function calculateMonthlyStats(
  expenses: Expense[],
  yearMonth: string,
  changeTransactions: Array<{ date: string; amount: number }> = []
): MonthlyStats {
  const totalExpense = calculateMonthlyTotal(expenses, yearMonth, changeTransactions);
  const monthExpenses = expenses.filter((e) => e.date.startsWith(yearMonth));
  const transactionCount = monthExpenses.length;
  const todayExpense = calculateTodayTotal(expenses, changeTransactions);
  const averageDailySpending = calculateAverageDailySpending(expenses, yearMonth, changeTransactions);

  return {
    totalExpense: Math.round(totalExpense * 100) / 100,
    transactionCount,
    todayExpense: Math.round(todayExpense * 100) / 100,
    averageDailySpending,
  };
}

export interface DaySpendingData {
  date: string;
  day: number;
  label: string;
  amount: number;
  count: number;
  income?: number;
  expense?: number;
  netCashFlow?: number;
}

/**
 * Generates daily spending and daily net cash flow series for the charts in Recharts
 */
export function calculateDailySpendingSeries(
  expenses: Expense[],
  yearMonth: string,
  incomes: Array<{ date: string; amount: number }> = [],
  changeTransactions: Array<{ date: string; amount: number }> = []
): DaySpendingData[] {
  const monthDate = parse(`${yearMonth}-01`, 'yyyy-MM-dd', new Date());
  const totalDays = getDaysInMonth(monthDate);

  // Group month expenses by date
  const expensesByDate = new Map<string, { amount: number; count: number }>();
  expenses
    .filter((e) => e.date.startsWith(yearMonth))
    .forEach((e) => {
      const current = expensesByDate.get(e.date) || { amount: 0, count: 0 };
      expensesByDate.set(e.date, {
        amount: current.amount + e.amount,
        count: current.count + 1,
      });
    });

  // Group month change transactions by date (deducted from spending)
  const changeByDate = new Map<string, { amount: number; count: number }>();
  changeTransactions
    .filter((c) => c.date.startsWith(yearMonth))
    .forEach((c) => {
      const current = changeByDate.get(c.date) || { amount: 0, count: 0 };
      changeByDate.set(c.date, {
        amount: current.amount + c.amount,
        count: current.count + 1,
      });
    });

  // Group month incomes by date
  const incomesByDate = new Map<string, { amount: number; count: number }>();
  incomes
    .filter((i) => i.date.startsWith(yearMonth))
    .forEach((i) => {
      const current = incomesByDate.get(i.date) || { amount: 0, count: 0 };
      incomesByDate.set(i.date, {
        amount: current.amount + i.amount,
        count: current.count + 1,
      });
    });

  const series: DaySpendingData[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const dateStr = `${yearMonth}-${dayStr}`;
    const expEntry = expensesByDate.get(dateStr) || { amount: 0, count: 0 };
    const chgEntry = changeByDate.get(dateStr) || { amount: 0, count: 0 };
    const incEntry = incomesByDate.get(dateStr) || { amount: 0, count: 0 };

    const netExpense = Math.max(0, Math.round((expEntry.amount - chgEntry.amount) * 100) / 100);
    const income = Math.round(incEntry.amount * 100) / 100;
    const netCashFlow = Math.round((income - netExpense) * 100) / 100;

    series.push({
      date: dateStr,
      day: d,
      label: `${d}`,
      amount: netExpense,
      count: expEntry.count + chgEntry.count + incEntry.count,
      income,
      expense: netExpense,
      netCashFlow,
    });
  }

  return series;
}

export interface CategorySummary {
  category: ExpenseCategory;
  amount: number;
  count: number;
  percentage: number;
}

/**
 * Computes breakdown by category with percentages
 */
export function calculateCategoryBreakdown(expenses: Expense[]): CategorySummary[] {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const catMap = new Map<ExpenseCategory, { amount: number; count: number }>();

  expenses.forEach((e) => {
    const current = catMap.get(e.category) || { amount: 0, count: 0 };
    catMap.set(e.category, {
      amount: current.amount + e.amount,
      count: current.count + 1,
    });
  });

  const summaries: CategorySummary[] = [];
  catMap.forEach((data, category) => {
    summaries.push({
      category,
      amount: Math.round(data.amount * 100) / 100,
      count: data.count,
      percentage: total > 0 ? Math.round((data.amount / total) * 1000) / 10 : 0,
    });
  });

  return summaries.sort((a, b) => b.amount - a.amount);
}

export interface WeekDayPoint {
  date: string;
  dayName: string; // "Mon", "Tue", etc.
  fullDayName: string; // "Monday", etc.
  amount: number;
  count: number;
  isHighest: boolean;
  isLowest: boolean;
  income?: number;
  expense?: number;
  netCashFlow?: number;
}

export interface PeriodComparison {
  previousTotal: number;
  difference: number;
  percentChange: number | null;
  hasPreviousData: boolean;
  previousNetCashFlow?: number;
  netCashFlowDifference?: number;
}

export interface WeeklyReportData {
  totalExpense: number;
  totalIncome: number;
  netCashFlow: number;
  averageDailySpending: number;
  averageDailyNetCashFlow: number;
  transactionCount: number;
  highestDay: { dayName: string; date: string; amount: number; netCashFlow: number } | null;
  lowestDay: { dayName: string; date: string; amount: number; netCashFlow: number } | null;
  days: WeekDayPoint[];
  dateRangeLabel: string;
  comparison: PeriodComparison;
}

/**
 * Computes weekly analytics data for Monday through Sunday with daily net cash flow
 */
export function calculateWeeklyReport(
  expenses: Expense[],
  referenceDate: Date = new Date(),
  offsetWeeks: number = 0,
  incomes: Array<{ date: string; amount: number }> = []
): WeeklyReportData {
  const { startDate, endDate, startDateStr, endDateStr, formattedRange } = getWeekInterval(
    referenceDate,
    offsetWeeks
  );

  // Group current week expenses by date
  const expDayMap = new Map<string, { amount: number; count: number }>();
  let totalExpense = 0;
  let expCount = 0;

  expenses.forEach((e) => {
    if (e.date >= startDateStr && e.date <= endDateStr) {
      totalExpense += e.amount;
      expCount += 1;
      const cur = expDayMap.get(e.date) || { amount: 0, count: 0 };
      expDayMap.set(e.date, {
        amount: cur.amount + e.amount,
        count: cur.count + 1,
      });
    }
  });

  // Group current week incomes by date
  const incDayMap = new Map<string, { amount: number; count: number }>();
  let totalIncome = 0;
  let incCount = 0;

  incomes.forEach((i) => {
    if (i.date >= startDateStr && i.date <= endDateStr) {
      totalIncome += i.amount;
      incCount += 1;
      const cur = incDayMap.get(i.date) || { amount: 0, count: 0 };
      incDayMap.set(i.date, {
        amount: cur.amount + i.amount,
        count: cur.count + 1,
      });
    }
  });

  totalExpense = Math.round(totalExpense * 100) / 100;
  totalIncome = Math.round(totalIncome * 100) / 100;
  const netCashFlow = Math.round((totalIncome - totalExpense) * 100) / 100;
  const averageDailySpending = Math.round((totalExpense / 7) * 100) / 100;
  const averageDailyNetCashFlow = Math.round((netCashFlow / 7) * 100) / 100;
  const transactionCount = expCount + incCount;

  // Generate 7 days (Mon-Sun)
  const weekDays = eachDayOfInterval({ start: startDate, end: endDate });
  let maxAmount = -1;
  let minAmount = Infinity;

  const rawPoints = weekDays.map((d) => {
    const dStr = format(d, 'yyyy-MM-dd');
    const expData = expDayMap.get(dStr) || { amount: 0, count: 0 };
    const incData = incDayMap.get(dStr) || { amount: 0, count: 0 };
    const expense = Math.round(expData.amount * 100) / 100;
    const income = Math.round(incData.amount * 100) / 100;
    const dayNet = Math.round((income - expense) * 100) / 100;
    const count = expData.count + incData.count;

    if (expense > maxAmount) maxAmount = expense;
    if (expense < minAmount) minAmount = expense;

    return {
      date: dStr,
      dayName: format(d, 'EEE'),
      fullDayName: format(d, 'EEEE'),
      amount: expense,
      income,
      expense,
      netCashFlow: dayNet,
      count,
    };
  });

  const days: WeekDayPoint[] = rawPoints.map((p) => ({
    ...p,
    isHighest: p.amount > 0 && p.amount === maxAmount,
    isLowest: p.amount === minAmount,
  }));

  const highest = days.find((d) => d.isHighest && d.amount > 0);
  const highestDay = highest
    ? { dayName: highest.fullDayName, date: highest.date, amount: highest.amount, netCashFlow: highest.netCashFlow ?? 0 }
    : null;

  const lowest = days.find((d) => d.isLowest);
  const lowestDay = lowest
    ? { dayName: lowest.fullDayName, date: lowest.date, amount: lowest.amount, netCashFlow: lowest.netCashFlow ?? 0 }
    : null;

  // Previous week comparison (preceding 7 days)
  const prevStartDate = subWeeks(startDate, 1);
  const prevEndDate = subWeeks(endDate, 1);
  const prevStartStr = format(prevStartDate, 'yyyy-MM-dd');
  const prevEndStr = format(prevEndDate, 'yyyy-MM-dd');

  let prevExpense = 0;
  let prevIncome = 0;
  let hasPreviousData = false;

  expenses.forEach((e) => {
    if (e.date >= prevStartStr && e.date <= prevEndStr) {
      hasPreviousData = true;
      prevExpense += e.amount;
    }
  });

  incomes.forEach((i) => {
    if (i.date >= prevStartStr && i.date <= prevEndStr) {
      hasPreviousData = true;
      prevIncome += i.amount;
    }
  });

  prevExpense = Math.round(prevExpense * 100) / 100;
  prevIncome = Math.round(prevIncome * 100) / 100;
  const prevNetCashFlow = Math.round((prevIncome - prevExpense) * 100) / 100;
  const difference = Math.round((totalExpense - prevExpense) * 100) / 100;
  const netCashFlowDifference = Math.round((netCashFlow - prevNetCashFlow) * 100) / 100;
  const percentChange =
    hasPreviousData && prevExpense > 0
      ? Math.round(((totalExpense - prevExpense) / prevExpense) * 100)
      : null;

  return {
    totalExpense,
    totalIncome,
    netCashFlow,
    averageDailySpending,
    averageDailyNetCashFlow,
    transactionCount,
    highestDay,
    lowestDay,
    days,
    dateRangeLabel: formattedRange,
    comparison: {
      previousTotal: prevExpense,
      difference,
      percentChange,
      hasPreviousData,
      previousNetCashFlow: prevNetCashFlow,
      netCashFlowDifference,
    },
  };
}

export interface MonthlyReportData {
  totalExpense: number;
  totalIncome: number;
  netCashFlow: number;
  averageDailySpending: number;
  averageDailyNetCashFlow: number;
  transactionCount: number;
  highestDay: { dayNumber: number; date: string; amount: number; netCashFlow: number } | null;
  series: DaySpendingData[];
  monthLabel: string;
  yearMonth: string;
  comparison: PeriodComparison;
}

/**
 * Computes monthly analytics data for selected month with daily net cash flow
 */
export function calculateMonthlyReport(
  expenses: Expense[],
  yearMonth: string,
  incomes: Array<{ date: string; amount: number }> = []
): MonthlyReportData {
  const monthExpenses = expenses.filter((e) => e.date.startsWith(yearMonth));
  const monthIncomes = incomes.filter((i) => i.date.startsWith(yearMonth));
  const totalExpense = Math.round(monthExpenses.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;
  const totalIncome = Math.round(monthIncomes.reduce((sum, i) => sum + i.amount, 0) * 100) / 100;
  const netCashFlow = Math.round((totalIncome - totalExpense) * 100) / 100;
  const transactionCount = monthExpenses.length + monthIncomes.length;
  const averageDailySpending = calculateAverageDailySpending(expenses, yearMonth);
  const series = calculateDailySpendingSeries(expenses, yearMonth, incomes);
  const averageDailyNetCashFlow = Math.round((netCashFlow / Math.max(series.length, 1)) * 100) / 100;

  // Highest spending day in month
  let highestDay: { dayNumber: number; date: string; amount: number; netCashFlow: number } | null = null;
  let maxSpend = 0;
  series.forEach((s) => {
    if (s.amount > maxSpend) {
      maxSpend = s.amount;
      highestDay = { dayNumber: s.day, date: s.date, amount: s.amount, netCashFlow: s.netCashFlow ?? 0 };
    }
  });

  // Previous month comparison
  const prevYearMonth = getPreviousMonth(yearMonth);
  const prevExpenses = expenses.filter((e) => e.date.startsWith(prevYearMonth));
  const prevIncomes = incomes.filter((i) => i.date.startsWith(prevYearMonth));
  const hasPreviousData = prevExpenses.length > 0 || prevIncomes.length > 0;
  const prevExpense = Math.round(prevExpenses.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;
  const prevIncome = Math.round(prevIncomes.reduce((sum, i) => sum + i.amount, 0) * 100) / 100;
  const prevNetCashFlow = Math.round((prevIncome - prevExpense) * 100) / 100;
  const difference = Math.round((totalExpense - prevExpense) * 100) / 100;
  const netCashFlowDifference = Math.round((netCashFlow - prevNetCashFlow) * 100) / 100;
  const percentChange =
    hasPreviousData && prevExpense > 0
      ? Math.round(((totalExpense - prevExpense) / prevExpense) * 100)
      : null;

  return {
    totalExpense,
    totalIncome,
    netCashFlow,
    averageDailySpending,
    averageDailyNetCashFlow,
    transactionCount,
    highestDay,
    series,
    monthLabel: formatMonthYear(yearMonth),
    yearMonth,
    comparison: {
      previousTotal: prevExpense,
      difference,
      percentChange,
      hasPreviousData,
      previousNetCashFlow: prevNetCashFlow,
      netCashFlowDifference,
    },
  };
}

/**
 * Computes category breakdown for a specific date range
 */
export function calculateCategoryBreakdownForRange(
  expenses: Expense[],
  startDateStr: string,
  endDateStr: string
): {
  summaries: CategorySummary[];
  totalExpense: number;
  mostExpensiveCategory: CategorySummary | null;
} {
  const rangeExpenses = expenses.filter((e) => e.date >= startDateStr && e.date <= endDateStr);
  const summaries = calculateCategoryBreakdown(rangeExpenses);
  const totalExpense = summaries.reduce((s, c) => s + c.amount, 0);
  const mostExpensiveCategory = summaries.length > 0 ? summaries[0] : null;

  return {
    summaries,
    totalExpense: Math.round(totalExpense * 100) / 100,
    mostExpensiveCategory,
  };
}

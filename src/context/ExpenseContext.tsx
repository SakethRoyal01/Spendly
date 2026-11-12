import React, { useMemo, useCallback } from 'react';
import type { Expense, CreateExpenseInput, UpdateExpenseInput, MonthlyStats } from '../types/expense';
import { exportExpensesToCSV } from '../utils/csv';
import { calculateDailyTotal, calculateMonthlyStats } from '../utils/calculations';
import { ExpenseContext } from './expenseContextInstance';
import type { ToastNotification, ExpenseContextType } from './expenseContextInstance';
import { useFinance } from '../hooks/useFinance';

export type { ToastNotification, ExpenseContextType };

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const finance = useFinance();

  const selectedDateExpenses = useMemo(() => {
    return finance.expenses.filter((e) => e.date === finance.selectedDate);
  }, [finance.expenses, finance.selectedDate]);

  const selectedDateTotal = useMemo(() => {
    return calculateDailyTotal(finance.expenses, finance.selectedDate, finance.changeTransactions);
  }, [finance.expenses, finance.selectedDate, finance.changeTransactions]);

  const selectedMonthExpenses = useMemo(() => {
    return finance.expenses.filter((e) => e.date.startsWith(finance.selectedMonth));
  }, [finance.expenses, finance.selectedMonth]);

  const monthlyStats: MonthlyStats = useMemo(() => {
    return calculateMonthlyStats(finance.expenses, finance.selectedMonth, finance.changeTransactions);
  }, [finance.expenses, finance.selectedMonth, finance.changeTransactions]);

  const dateSpendingMap = useMemo(() => {
    const map = new Map<string, number>();
    finance.expenses.forEach((e) => {
      map.set(e.date, (map.get(e.date) || 0) + e.amount);
    });
    finance.changeTransactions.forEach((c) => {
      const cur = map.get(c.date) || 0;
      map.set(c.date, Math.max(0, cur - c.amount));
    });
    return map;
  }, [finance.expenses, finance.changeTransactions]);

  const exportCSV = useCallback(() => {
    exportExpensesToCSV(finance.expenses, `spendly-expenses-${finance.selectedMonth}`);
  }, [finance.expenses, finance.selectedMonth]);

  const addExpenseCompat = useCallback(
    async (input: CreateExpenseInput): Promise<Expense> => {
      const created = await finance.addExpense({
        userId: input.userId ?? null,
        type: 'expense',
        amount: input.amount,
        category: input.category,
        description: input.description,
        date: input.date,
        paymentMethod: 'Cash',
      });
      return {
        id: created.id,
        userId: created.userId,
        amount: created.amount,
        category: created.category as any,
        description: created.description,
        date: created.date,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
    },
    [finance]
  );

  const updateExpenseCompat = useCallback(
    async (id: string, updates: UpdateExpenseInput): Promise<Expense> => {
      const updated = await finance.updateTransaction(id, updates);
      return {
        id: updated.id,
        userId: updated.userId,
        amount: updated.amount,
        category: updated.category as any,
        description: updated.description,
        date: updated.date,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    },
    [finance]
  );

  const deleteExpenseCompat = useCallback(
    async (id: string): Promise<boolean> => {
      return finance.deleteTransaction(id);
    },
    [finance]
  );

  const clearAllExpenses = useCallback(async (): Promise<void> => {
    await finance.clearAllData();
  }, [finance]);

  return (
    <ExpenseContext.Provider
      value={{
        expenses: finance.expenses,
        isLoading: finance.isLoading,
        selectedDate: finance.selectedDate,
        selectedMonth: finance.selectedMonth,
        setSelectedDate: finance.setSelectedDate,
        setSelectedMonth: finance.setSelectedMonth,
        addExpense: addExpenseCompat,
        updateExpense: updateExpenseCompat,
        deleteExpense: deleteExpenseCompat,
        clearAllExpenses,
        exportCSV,
        monthlyStats,
        selectedDateExpenses,
        selectedDateTotal,
        selectedMonthExpenses,
        dateSpendingMap,
        toasts: finance.toasts,
        removeToast: finance.removeToast,
        showToast: finance.showToast,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

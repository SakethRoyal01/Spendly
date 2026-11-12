import { createContext } from 'react';
import type { Expense, CreateExpenseInput, UpdateExpenseInput, MonthlyStats } from '../types/expense';

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}

export interface ExpenseContextType {
  expenses: Expense[];
  isLoading: boolean;
  selectedDate: string;
  selectedMonth: string;
  setSelectedDate: (date: string) => void;
  setSelectedMonth: (month: string) => void;
  addExpense: (input: CreateExpenseInput) => Promise<Expense>;
  updateExpense: (id: string, updates: UpdateExpenseInput) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<boolean>;
  clearAllExpenses: () => Promise<void>;
  exportCSV: () => void;
  monthlyStats: MonthlyStats;
  selectedDateExpenses: Expense[];
  selectedDateTotal: number;
  selectedMonthExpenses: Expense[];
  dateSpendingMap: Map<string, number>;
  toasts: ToastNotification[];
  removeToast: (id: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);


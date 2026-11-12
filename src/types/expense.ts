export type ExpenseCategory =
  | 'Food'
  | 'Travel'
  | 'Shopping'
  | 'Education'
  | 'Entertainment'
  | 'Bills'
  | 'Health'
  | 'Other';

export interface Expense {
  id: string;
  userId: string | null;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type CreateExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateExpenseInput = Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>;

export interface ExpenseFilter {
  category?: string;
  month?: string; // YYYY-MM
  date?: string; // YYYY-MM-DD
  searchQuery?: string;
}

export interface MonthlyStats {
  totalExpense: number;
  transactionCount: number;
  todayExpense: number;
  averageDailySpending: number;
}

export interface CategoryInfo {
  name: ExpenseCategory;
  label: string;
  icon: string;
  color: string;
  bgLight: string;
  borderColor: string;
}


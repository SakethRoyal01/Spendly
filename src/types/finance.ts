import type { ExpenseCategory } from './expense';

export type AccountType = 'cash' | 'bank' | 'savings_account' | 'credit' | 'custom';

export type PaymentMethod =
  | 'Cash'
  | 'UPI'
  | 'Hybrid'
  | 'Not specified'
  | 'Bank Transfer'
  | 'Debit Card'
  | 'Credit Card'
  | 'Other';

export const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'UPI',
  'Hybrid',
  'Not specified',
  'Bank Transfer',
  'Debit Card',
  'Credit Card',
  'Other',
];

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number; // in rupees
  currentBalance: number; // in rupees (reconciled)
  currency: string; // 'INR'
  color: string;
  description?: string;
  isArchived: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export type CreateAccountInput = Omit<Account, 'id' | 'currentBalance' | 'isArchived' | 'createdAt' | 'updatedAt'> & {
  initialBalance?: number;
};

export type UpdateAccountInput = Partial<Omit<Account, 'id' | 'currentBalance' | 'createdAt' | 'updatedAt'>>;

export interface TransactionSplit {
  id: string;
  transactionId?: string;
  sourceAccountId: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export type IncomeCategory =
  | 'Salary'
  | 'Freelance'
  | 'Stipend'
  | 'Allowance'
  | 'Investment'
  | 'Gifts'
  | 'Refund'
  | 'Change'
  | 'Other';

export const ALL_INCOME_CATEGORIES: IncomeCategory[] = [
  'Salary',
  'Freelance',
  'Stipend',
  'Allowance',
  'Investment',
  'Gifts',
  'Refund',
  'Change',
  'Other',
];

export interface Transaction {
  id: string;
  userId: string | null;
  type: 'expense' | 'income';
  isChange?: boolean; // True if this represents returned change from a payment (not counted as income)
  amount: number;
  category: ExpenseCategory | IncomeCategory | string;
  description: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  sourceAccountId?: string | null; // For single-source expense
  destinationAccountId?: string | null; // For income / change
  splits?: TransactionSplit[]; // For Hybrid / Split payments
  savingsPotId?: string | null; // If funded directly from savings (Option A)
  note?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/**
 * Universal helper to identify if a transaction represents returned Change.
 * Change is returned from a payment and directly deducts from amount spent.
 */
export function isChangeTransaction(t: {
  isChange?: boolean;
  category?: string;
  description?: string;
  type?: string;
}): boolean {
  if (t.isChange === true) return true;
  if (t.category === 'Change') return true;
  if (typeof t.description === 'string' && t.description.toLowerCase().trim() === 'change') return true;
  if (typeof t.description === 'string' && t.description.toLowerCase().includes('change')) return true;
  return false;
}

export type CreateTransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  isChange?: boolean;
};
export type UpdateTransactionInput = Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>> & {
  createdAt?: string;
  isChange?: boolean;
};

export interface LedgerEntry {
  id: string;
  date: string; // YYYY-MM-DD
  type:
    | 'expense'
    | 'income'
    | 'transfer'
    | 'savings_contribution'
    | 'savings_withdrawal'
    | 'reversal';
  referenceId: string; // transactionId, transferId, savingsContributionId, etc.
  accountId: string;
  amount: number; // positive = credit/inflow, negative = debit/outflow
  description: string;
  createdAt: string;
}

export interface Transfer {
  id: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export interface SavingsPot {
  id: string;
  name: string;
  description?: string;
  targetAmount: number | null; // optional target
  currentAmount: number;
  targetDate: string | null; // optional deadline YYYY-MM-DD
  icon: string;
  color: string;
  priority: 'low' | 'medium' | 'high';
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateSavingsPotInput = Omit<SavingsPot, 'id' | 'currentAmount' | 'isArchived' | 'createdAt' | 'updatedAt'>;
export type UpdateSavingsPotInput = Partial<Omit<SavingsPot, 'id' | 'currentAmount' | 'createdAt' | 'updatedAt'>>;

export interface SavingsContribution {
  id: string;
  potId: string;
  sourceAccountId: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export interface SavingsWithdrawal {
  id: string;
  potId: string;
  destinationAccountId: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  yearMonth: string; // YYYY-MM
  overallMonthlyBudget: number;
  categoryBudgets: Record<string, number>;
  thresholds: number[]; // e.g. [50, 75, 90, 100]
  rolloverEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  sourceAccountId: string;
  paymentMethod: PaymentMethod;
  frequency: RecurringFrequency;
  startDate: string;
  nextDueDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringOccurrence {
  id: string;
  recurringId: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'skipped';
  transactionId?: string;
  processedAt?: string;
}

export interface FinancialNotification {
  id: string;
  type:
    | 'budget_threshold'
    | 'recurring_due'
    | 'savings_reminder'
    | 'low_balance'
    | 'unusual_spending';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  isDismissed: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  currency: string;
  allowOverdraft: boolean;
  defaultAccountId?: string;
  notificationsEnabled: boolean;
  savingsReminderEnabled: boolean;
  savingsReminderFrequency: 'daily' | 'weekly' | 'monthly';
  lastSavingsReminderDate?: string;
  reducedMotion: boolean;
}

export interface FullBackupData {
  version: string;
  exportedAt: string;
  accounts: Account[];
  transactions: Transaction[];
  transfers: Transfer[];
  ledgerEntries: LedgerEntry[];
  savingsPots: SavingsPot[];
  savingsContributions: SavingsContribution[];
  savingsWithdrawals: SavingsWithdrawal[];
  budgets: Budget[];
  recurring: RecurringTransaction[];
  occurrences: RecurringOccurrence[];
  preferences: UserPreferences;
}

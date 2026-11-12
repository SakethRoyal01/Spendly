import { createContext } from 'react';
import type {
  Account,
  CreateAccountInput,
  UpdateAccountInput,
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  Transfer,
  SavingsPot,
  CreateSavingsPotInput,
  UpdateSavingsPotInput,
  SavingsContribution,
  SavingsWithdrawal,
  Budget,
  RecurringTransaction,
  FinancialNotification,
  UserPreferences,
  FullBackupData,
  LedgerEntry,
} from '../types/finance';
import type { Expense } from '../types/expense';
import type { ContributeInput, WithdrawInput, TransferInput } from '../services/repositories/interfaces/FinanceRepository';

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}

export interface FinanceContextType {
  // State
  accounts: Account[];
  transactions: Transaction[];
  transfers: Transfer[];
  ledgerEntries: LedgerEntry[];
  expenses: Expense[];
  incomes: Transaction[];
  changeTransactions: Transaction[];
  savingsPots: SavingsPot[];
  budgets: Budget[];
  currentBudget: Budget | null;
  recurring: RecurringTransaction[];
  notifications: FinancialNotification[];
  unreadNotificationCount: number;
  preferences: UserPreferences;
  selectedDate: string;
  selectedMonth: string;
  isLoading: boolean;
  toasts: ToastNotification[];

  // Calculated Metrics
  totalWalletBalance: number;
  totalSavingsBalance: number;
  totalNetWorth: number;
  monthlyIncome: number;
  monthlyChange: number;
  grossMonthlyExpenses: number;
  monthlyExpenses: number;
  monthlySavingsContribution: number;
  monthlyNetCashFlow: number;
  dailyIncome: number;
  dailyChange: number;
  grossDailyExpenses: number;
  dailyExpenses: number;
  dailyNetCashFlow: number;
  unspecifiedExpenses: Transaction[];
  unspecifiedCount: number;

  // Actions
  setSelectedDate: (date: string) => void;
  setSelectedMonth: (month: string) => void;
  addExpense: (input: CreateTransactionInput) => Promise<Transaction>;
  addIncome: (input: CreateTransactionInput) => Promise<Transaction>;
  updateTransaction: (id: string, updates: UpdateTransactionInput) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<boolean>;
  createAccount: (input: CreateAccountInput) => Promise<Account>;
  updateAccount: (id: string, updates: UpdateAccountInput) => Promise<Account>;
  archiveAccount: (id: string) => Promise<boolean>;
  transferBetweenAccounts: (input: TransferInput) => Promise<Transfer>;
  createSavingsPot: (input: CreateSavingsPotInput) => Promise<SavingsPot>;
  updateSavingsPot: (id: string, updates: UpdateSavingsPotInput) => Promise<SavingsPot>;
  archiveSavingsPot: (id: string) => Promise<boolean>;
  contributeToSavings: (input: ContributeInput) => Promise<SavingsContribution>;
  withdrawFromSavings: (input: WithdrawInput) => Promise<SavingsWithdrawal>;
  saveBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Budget>;
  createRecurring: (input: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<RecurringTransaction>;
  updateRecurring: (id: string, updates: Partial<RecurringTransaction>) => Promise<RecurringTransaction>;
  markOccurrencePaid: (recurringId: string, dueDate: string, paymentMethod?: string) => Promise<Transaction>;
  skipOccurrence: (recurringId: string, dueDate: string) => Promise<boolean>;
  markNotificationRead: (id: string) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<UserPreferences>;
  exportFullBackup: () => Promise<FullBackupData>;
  importFullBackup: (backup: FullBackupData) => Promise<boolean>;
  clearAllData: () => Promise<boolean>;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;
}

export const FinanceContext = createContext<FinanceContextType | undefined>(undefined);


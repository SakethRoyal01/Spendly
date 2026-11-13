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
  RecurringOccurrence,
  FinancialNotification,
  UserPreferences,
  FullBackupData,
  LedgerEntry,
} from '../../types/finance';

export interface ContributeInput {
  potId: string;
  sourceAccountId: string;
  amount: number;
  date: string;
  note?: string;
}

export interface WithdrawInput {
  potId: string;
  destinationAccountId: string;
  amount: number;
  date: string;
  note?: string;
}

export interface TransferInput {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  date: string;
  note?: string;
}

export interface FinanceRepository {
  // Accounts (Wallets)
  getAccounts(): Promise<Account[]>;
  getAccountById(id: string): Promise<Account | null>;
  createAccount(input: CreateAccountInput): Promise<Account>;
  updateAccount(id: string, updates: UpdateAccountInput): Promise<Account>;
  archiveAccount(id: string): Promise<boolean>;

  // Transactions (Expenses & Incomes)
  getTransactions(): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | null>;
  createExpense(input: CreateTransactionInput): Promise<Transaction>;
  createIncome(input: CreateTransactionInput): Promise<Transaction>;
  updateTransaction(id: string, updates: UpdateTransactionInput): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;

  // Transfers
  getTransfers(): Promise<Transfer[]>;
  createTransfer(input: TransferInput): Promise<Transfer>;

  // Savings Pots & Goals
  getSavingsPots(): Promise<SavingsPot[]>;
  createSavingsPot(input: CreateSavingsPotInput): Promise<SavingsPot>;
  updateSavingsPot(id: string, updates: UpdateSavingsPotInput): Promise<SavingsPot>;
  archiveSavingsPot(id: string): Promise<boolean>;
  contributeToSavings(input: ContributeInput): Promise<SavingsContribution>;
  withdrawFromSavings(input: WithdrawInput): Promise<SavingsWithdrawal>;

  // Budgets
  getBudgets(): Promise<Budget[]>;
  getBudgetByMonth(yearMonth: string): Promise<Budget | null>;
  saveBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget>;

  // Recurring Payments
  getRecurring(): Promise<RecurringTransaction[]>;
  getOccurrences(): Promise<RecurringOccurrence[]>;
  createRecurring(input: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecurringTransaction>;
  updateRecurring(id: string, updates: Partial<RecurringTransaction>): Promise<RecurringTransaction>;
  markOccurrencePaid(recurringId: string, dueDate: string, paymentMethod?: string): Promise<Transaction>;
  skipOccurrence(recurringId: string, dueDate: string): Promise<boolean>;

  // Notifications
  getNotifications(): Promise<FinancialNotification[]>;
  markNotificationRead(id: string): Promise<void>;
  dismissNotification(id: string): Promise<void>;
  checkAndGenerateAlerts(): Promise<FinancialNotification[]>;

  // Preferences & Settings
  getPreferences(): Promise<UserPreferences>;
  updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences>;

  // Ledger & Reconciliation
  getLedgerEntries(): Promise<LedgerEntry[]>;
  reconcileBalances(): Promise<{ reconciledAccounts: number; discrepanciesFound: number }>;

  // Backup & Import
  exportFullBackup(): Promise<FullBackupData>;
  importFullBackup(backup: FullBackupData): Promise<boolean>;
  clearAllData(): Promise<boolean>;
}

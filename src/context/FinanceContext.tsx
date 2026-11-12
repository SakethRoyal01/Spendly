import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { isChangeTransaction } from '../types/finance';
import type { Expense } from '../types/expense';
import type { ContributeInput, WithdrawInput, TransferInput } from '../services/repositories/interfaces/FinanceRepository';
import { localFinanceRepository } from '../services/repositories/local/LocalFinanceRepository';
import { getTodayDateString, getCurrentMonthString } from '../utils/dates';
import { addRupees, subtractRupees, formatINR } from '../utils/currency';
import { FinanceContext, type ToastNotification } from './financeContextInstance';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [savingsPots, setSavingsPots] = useState<SavingsPot[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [notifications, setNotifications] = useState<FinancialNotification[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    currency: 'INR',
    allowOverdraft: true,
    notificationsEnabled: true,
    savingsReminderEnabled: true,
    savingsReminderFrequency: 'weekly',
    reducedMotion: false,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDateState] = useState<string>(getTodayDateString());
  const [selectedMonth, setSelectedMonthState] = useState<string>(getCurrentMonthString());
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setSelectedDate = useCallback((date: string) => {
    setSelectedDateState(date);
    const dateMonth = date.substring(0, 7);
    setSelectedMonthState((prev) => (prev !== dateMonth ? dateMonth : prev));
  }, []);

  const setSelectedMonth = useCallback((month: string) => {
    setSelectedMonthState(month);
  }, []);

  // Primary data loader
  const refreshData = useCallback(async () => {
    try {
      await localFinanceRepository.initialize();
      const [
        accs,
        txs,
        trfs,
        ledgers,
        pots,
        bgts,
        recs,
        notifs,
        prefs,
      ] = await Promise.all([
        localFinanceRepository.getAccounts(),
        localFinanceRepository.getTransactions(),
        localFinanceRepository.getTransfers(),
        localFinanceRepository.getLedgerEntries(),
        localFinanceRepository.getSavingsPots(),
        localFinanceRepository.getBudgets(),
        localFinanceRepository.getRecurring(),
        localFinanceRepository.getNotifications(),
        localFinanceRepository.getPreferences(),
      ]);

      setAccounts(accs);
      setTransactions(txs);
      setTransfers(trfs);
      setLedgerEntries(ledgers);
      setSavingsPots(pots);
      setBudgets(bgts);
      setRecurring(recs);
      setNotifications(notifs);
      setPreferences(prefs);

      // Check alerts
      const updatedNotifs = await localFinanceRepository.checkAndGenerateAlerts();
      setNotifications(updatedNotifs);
    } catch (err) {
      console.error('Failed to load financial records:', err);
      showToast('Error reading records from storage', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Derived expense records for backward compatibility (strictly non-change)
  const expenses: Expense[] = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense' && !isChangeTransaction(t))
      .map((t) => ({
        id: t.id,
        userId: t.userId,
        amount: t.amount,
        category: t.category as any,
        description: t.description,
        date: t.date,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
  }, [transactions]);

  // Real earned income only (Salary, Freelance, Gifts, etc. from Wallet section)
  // Explicitly excludes Change transactions so true income analytics stay pure
  const incomes: Transaction[] = useMemo(() => {
    return transactions.filter(
      (t) => t.type === 'income' && !isChangeTransaction(t)
    );
  }, [transactions]);

  // Payment Change transactions (cash or funds returned from expense payments)
  // These directly reduce the amount spent (outflow)
  const changeTransactions: Transaction[] = useMemo(() => {
    return transactions.filter((t) => isChangeTransaction(t));
  }, [transactions]);

  const currentBudget = useMemo(() => {
    return budgets.find((b) => b.yearMonth === selectedMonth) || null;
  }, [budgets, selectedMonth]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead && !n.isDismissed).length;
  }, [notifications]);

  // Financial Metrics
  const totalWalletBalance = useMemo(() => {
    return accounts.reduce((sum, a) => addRupees(sum, a.currentBalance), 0);
  }, [accounts]);

  const totalSavingsBalance = useMemo(() => {
    return savingsPots.reduce((sum, p) => addRupees(sum, p.currentAmount), 0);
  }, [savingsPots]);

  const totalNetWorth = useMemo(() => {
    return addRupees(totalWalletBalance, totalSavingsBalance);
  }, [totalWalletBalance, totalSavingsBalance]);

  const monthlyIncome = useMemo(() => {
    return incomes
      .filter((t) => t.date.startsWith(selectedMonth))
      .reduce((sum, t) => addRupees(sum, t.amount), 0);
  }, [incomes, selectedMonth]);

  const monthlyChange = useMemo(() => {
    return changeTransactions
      .filter((t) => t.date.startsWith(selectedMonth))
      .reduce((sum, t) => addRupees(sum, t.amount), 0);
  }, [changeTransactions, selectedMonth]);

  const grossMonthlyExpenses = useMemo(() => {
    return expenses
      .filter((t) => t.date.startsWith(selectedMonth))
      .reduce((sum, t) => addRupees(sum, t.amount), 0);
  }, [expenses, selectedMonth]);

  // Effective Net Spending (Total Outflow): Change is deducted from the amount spent!
  const monthlyExpenses = useMemo(() => {
    return Math.max(0, subtractRupees(grossMonthlyExpenses, monthlyChange));
  }, [grossMonthlyExpenses, monthlyChange]);

  const monthlySavingsContribution = useMemo(() => {
    return 0; // tracked via savings history
  }, []);

  // Net Cash Flow: Real Earned Inflow − Net Outflow (Gross Expenses - Change)
  // Balanced equation: Real Inflow − Total Outflow = Net Cash Flow!
  const monthlyNetCashFlow = useMemo(() => {
    return subtractRupees(monthlyIncome, monthlyExpenses);
  }, [monthlyIncome, monthlyExpenses]);

  const dailyIncome = useMemo(() => {
    return incomes
      .filter((t) => t.date === selectedDate)
      .reduce((sum, t) => addRupees(sum, t.amount), 0);
  }, [incomes, selectedDate]);

  const dailyChange = useMemo(() => {
    return changeTransactions
      .filter((t) => t.date === selectedDate)
      .reduce((sum, t) => addRupees(sum, t.amount), 0);
  }, [changeTransactions, selectedDate]);

  const grossDailyExpenses = useMemo(() => {
    return expenses
      .filter((t) => t.date === selectedDate)
      .reduce((sum, t) => addRupees(sum, t.amount), 0);
  }, [expenses, selectedDate]);

  // Effective Net Spending for the day: Change is deducted from the amount spent!
  const dailyExpenses = useMemo(() => {
    return Math.max(0, subtractRupees(grossDailyExpenses, dailyChange));
  }, [grossDailyExpenses, dailyChange]);

  const dailyNetCashFlow = useMemo(() => {
    return subtractRupees(dailyIncome, dailyExpenses);
  }, [dailyIncome, dailyExpenses]);

  const unspecifiedExpenses = useMemo(() => {
    return transactions.filter(
      (t) => t.type === 'expense' && (!t.paymentMethod || t.paymentMethod === 'Not specified')
    );
  }, [transactions]);

  const unspecifiedCount = unspecifiedExpenses.length;

  // Helper to trigger professional negative balance notifications when an expense crosses zero
  const checkAndNotifyNegativeBalances = useCallback(
    (accountsBefore: Account[], accountsAfter: Account[]) => {
      const prevMap = new Map(accountsBefore.map((a) => [a.id, a.currentBalance]));

      accountsAfter.forEach((acc) => {
        const prev = prevMap.get(acc.id);
        if (prev !== undefined && prev >= 0 && acc.currentBalance < 0) {
          const formatted = formatINR(acc.currentBalance);
          if (acc.type === 'cash') {
            showToast(
              `Cash Wallet balance is now negative (${formatted}). Please review your available funds.`,
              'info'
            );
          } else {
            showToast(
              `${acc.name} balance is now negative (${formatted}). Please review your available funds.`,
              'info'
            );
          }
        }
      });
    },
    [showToast]
  );

  // Actions
  const addExpense = useCallback(
    async (input: CreateTransactionInput): Promise<Transaction> => {
      try {
        const accountsBefore = await localFinanceRepository.getAccounts();
        const created = await localFinanceRepository.createExpense(input, undefined, input.createdAt);
        const accountsAfter = await localFinanceRepository.getAccounts();

        await refreshData();
        showToast(`Expense of ₹${created.amount} added`);

        checkAndNotifyNegativeBalances(accountsBefore, accountsAfter);
        return created;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to record expense';
        showToast(msg, 'error');
        throw err;
      }
    },
    [refreshData, showToast, checkAndNotifyNegativeBalances]
  );

  const addIncome = useCallback(
    async (input: CreateTransactionInput): Promise<Transaction> => {
      try {
        const isChange = Boolean(input.isChange || input.category === 'Change');
        const created = await localFinanceRepository.createIncome(input, undefined, input.createdAt);
        await refreshData();
        if (isChange) {
          showToast(`Change of ₹${created.amount} recorded to wallet (not counted as income)`);
        } else {
          showToast(`Income of ₹${created.amount} recorded`);
        }
        return created;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to record transaction';
        showToast(msg, 'error');
        throw err;
      }
    },
    [refreshData, showToast]
  );

  const updateTransaction = useCallback(
    async (id: string, updates: UpdateTransactionInput): Promise<Transaction> => {
      try {
        const accountsBefore = await localFinanceRepository.getAccounts();
        const updated = await localFinanceRepository.updateTransaction(id, updates);
        const accountsAfter = await localFinanceRepository.getAccounts();

        await refreshData();
        showToast('Transaction updated successfully');

        checkAndNotifyNegativeBalances(accountsBefore, accountsAfter);
        return updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update transaction';
        showToast(msg, 'error');
        throw err;
      }
    },
    [refreshData, showToast, checkAndNotifyNegativeBalances]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await localFinanceRepository.deleteTransaction(id);
        await refreshData();
        showToast('Transaction deleted and balances adjusted');
        return res;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete transaction';
        showToast(msg, 'error');
        throw err;
      }
    },
    [refreshData, showToast]
  );

  const createAccount = useCallback(
    async (input: CreateAccountInput): Promise<Account> => {
      const created = await localFinanceRepository.createAccount(input);
      await refreshData();
      showToast(`Wallet "${created.name}" created`);
      return created;
    },
    [refreshData, showToast]
  );

  const updateAccount = useCallback(
    async (id: string, updates: UpdateAccountInput): Promise<Account> => {
      const updated = await localFinanceRepository.updateAccount(id, updates);
      await refreshData();
      showToast('Wallet updated successfully');
      return updated;
    },
    [refreshData, showToast]
  );

  const archiveAccount = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await localFinanceRepository.archiveAccount(id);
        await refreshData();
        showToast('Wallet archived');
        return res;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to archive wallet';
        showToast(msg, 'error');
        throw err;
      }
    },
    [refreshData, showToast]
  );

  const transferBetweenAccounts = useCallback(
    async (input: TransferInput): Promise<Transfer> => {
      try {
        const res = await localFinanceRepository.createTransfer(input);
        await refreshData();
        showToast(`Transferred ₹${res.amount} between accounts`);
        return res;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Transfer failed';
        showToast(msg, 'error');
        throw err;
      }
    },
    [refreshData, showToast]
  );

  const createSavingsPot = useCallback(
    async (input: CreateSavingsPotInput): Promise<SavingsPot> => {
      const created = await localFinanceRepository.createSavingsPot(input);
      await refreshData();
      showToast(`Savings goal "${created.name}" created`);
      return created;
    },
    [refreshData, showToast]
  );

  const updateSavingsPot = useCallback(
    async (id: string, updates: UpdateSavingsPotInput): Promise<SavingsPot> => {
      const updated = await localFinanceRepository.updateSavingsPot(id, updates);
      await refreshData();
      showToast('Savings pot updated');
      return updated;
    },
    [refreshData, showToast]
  );

  const archiveSavingsPot = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await localFinanceRepository.archiveSavingsPot(id);
        await refreshData();
        showToast('Savings pot archived');
        return res;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to archive pot';
        showToast(msg, 'error');
        throw err;
      }
    },
    [refreshData, showToast]
  );

  const contributeToSavings = useCallback(
    async (input: ContributeInput): Promise<SavingsContribution> => {
      try {
        const res = await localFinanceRepository.contributeToSavings(input);
        await refreshData();
        showToast(`Added ₹${res.amount} to savings`);
        return res;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Contribution failed';
        showToast(msg, 'error');
        throw err;
      }
    },
    [refreshData, showToast]
  );

  const withdrawFromSavings = useCallback(
    async (input: WithdrawInput): Promise<SavingsWithdrawal> => {
      try {
        const res = await localFinanceRepository.withdrawFromSavings(input);
        await refreshData();
        showToast(`Withdrew ₹${res.amount} from savings to wallet`);
        return res;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Withdrawal failed';
        showToast(msg, 'error');
        throw err;
      }
    },
    [refreshData, showToast]
  );

  const saveBudget = useCallback(
    async (input: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> => {
      const saved = await localFinanceRepository.saveBudget(input);
      await refreshData();
      showToast('Budget saved successfully');
      return saved;
    },
    [refreshData, showToast]
  );

  const createRecurring = useCallback(
    async (input: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecurringTransaction> => {
      const created = await localFinanceRepository.createRecurring(input);
      await refreshData();
      showToast(`Recurring schedule "${created.description}" created`);
      return created;
    },
    [refreshData, showToast]
  );

  const updateRecurring = useCallback(
    async (id: string, updates: Partial<RecurringTransaction>): Promise<RecurringTransaction> => {
      const updated = await localFinanceRepository.updateRecurring(id, updates);
      await refreshData();
      showToast('Recurring payment updated');
      return updated;
    },
    [refreshData, showToast]
  );

  const markOccurrencePaid = useCallback(
    async (recurringId: string, dueDate: string, paymentMethod?: string): Promise<Transaction> => {
      try {
        const tx = await localFinanceRepository.markOccurrencePaid(recurringId, dueDate, paymentMethod);
        await refreshData();
        showToast(`Recorded recurring payment of ₹${tx.amount}`);
        return tx;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to record recurring payment';
        showToast(msg, 'error');
        throw err;
      }
    },
    [refreshData, showToast]
  );

  const skipOccurrence = useCallback(
    async (recurringId: string, dueDate: string): Promise<boolean> => {
      const res = await localFinanceRepository.skipOccurrence(recurringId, dueDate);
      await refreshData();
      showToast('Occurrence skipped');
      return res;
    },
    [refreshData, showToast]
  );

  const markNotificationRead = useCallback(
    async (id: string): Promise<void> => {
      await localFinanceRepository.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    },
    []
  );

  const dismissNotification = useCallback(
    async (id: string): Promise<void> => {
      await localFinanceRepository.dismissNotification(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isDismissed: true } : n)));
    },
    []
  );

  const updatePreferences = useCallback(
    async (updates: Partial<UserPreferences>): Promise<UserPreferences> => {
      const updated = await localFinanceRepository.updatePreferences(updates);
      setPreferences(updated);
      showToast('Preferences updated');
      return updated;
    },
    [showToast]
  );

  const exportFullBackup = useCallback(async (): Promise<FullBackupData> => {
    return localFinanceRepository.exportFullBackup();
  }, []);

  const importFullBackup = useCallback(
    async (backup: FullBackupData): Promise<boolean> => {
      try {
        const res = await localFinanceRepository.importFullBackup(backup);
        await refreshData();
        showToast('Backup restored successfully');
        return res;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to restore backup';
        showToast(msg, 'error');
        throw err;
      }
    },
    [refreshData, showToast]
  );

  const clearAllData = useCallback(async (): Promise<boolean> => {
    const res = await localFinanceRepository.clearAllData();
    await refreshData();
    showToast('All financial data cleared', 'info');
    return res;
  }, [refreshData, showToast]);

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        transactions,
        transfers,
        ledgerEntries,
        expenses,
        incomes,
        changeTransactions,
        savingsPots,
        budgets,
        currentBudget,
        recurring,
        notifications,
        unreadNotificationCount,
        preferences,
        selectedDate,
        selectedMonth,
        isLoading,
        toasts,
        totalWalletBalance,
        totalSavingsBalance,
        totalNetWorth,
        monthlyIncome,
        monthlyChange,
        grossMonthlyExpenses,
        monthlyExpenses,
        monthlySavingsContribution,
        monthlyNetCashFlow,
        dailyIncome,
        dailyChange,
        grossDailyExpenses,
        dailyExpenses,
        dailyNetCashFlow,
        unspecifiedExpenses,
        unspecifiedCount,
        setSelectedDate,
        setSelectedMonth,
        addExpense,
        addIncome,
        updateTransaction,
        deleteTransaction,
        createAccount,
        updateAccount,
        archiveAccount,
        transferBetweenAccounts,
        createSavingsPot,
        updateSavingsPot,
        archiveSavingsPot,
        contributeToSavings,
        withdrawFromSavings,
        saveBudget,
        createRecurring,
        updateRecurring,
        markOccurrencePaid,
        skipOccurrence,
        markNotificationRead,
        dismissNotification,
        updatePreferences,
        exportFullBackup,
        importFullBackup,
        clearAllData,
        showToast,
        removeToast,
        refreshData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};


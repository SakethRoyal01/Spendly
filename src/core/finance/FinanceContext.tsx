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
} from '../../types/finance';
import { isChangeTransaction } from '../../types/finance';
import type { Expense, ExpenseCategory, MonthlyStats } from '../../types/expense';
import type { ContributeInput, WithdrawInput, TransferInput } from '../repositories/FinanceRepository';
import { financeRepository } from '../repositories/AuthenticatedFinanceRepository';
import { getTodayDateString, getCurrentMonthString } from '../../shared/utils/dates';
import { addRupees, subtractRupees, formatINR } from '../../shared/utils/currency';
import { calculateDailyTotal, calculateMonthlyStats } from '../../shared/utils/calculations';
import { exportExpensesToCSV } from '../../shared/utils/csv';
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
      await financeRepository.initialize();
      const [
        accs,
        txs,
        trfs,
        pots,
        bdgs,
        rcr,
        notifs,
        prefs,
        ledger,
      ] = await Promise.all([
        financeRepository.getAccounts(),
        financeRepository.getTransactions(),
        financeRepository.getTransfers(),
        financeRepository.getSavingsPots(),
        financeRepository.getBudgets(),
        financeRepository.getRecurring(),
        financeRepository.getNotifications(),
        financeRepository.getPreferences(),
        financeRepository.getLedgerEntries(),
      ]);

      setAccounts(accs);
      setTransactions(txs);
      setTransfers(trfs);
      setSavingsPots(pots);
      setBudgets(bdgs);
      setRecurring(rcr);
      setNotifications(notifs);
      setPreferences(prefs);
      setLedgerEntries(ledger);
    } catch (err) {
      console.error('[FinanceContext] Failed to load data:', err);
      showToast('Failed to load financial data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        await refreshData();
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [refreshData]);

  // Derived datasets
  // Filter true expenses (excluding accidental change entries categorized as expense)
  const expenses: Expense[] = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense' && !isChangeTransaction(t))
      .map((t) => ({
        id: t.id,
        userId: t.userId,
        amount: t.amount,
        category: (t.category as ExpenseCategory) || 'Other',
        description: t.description,
        date: t.date,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
  }, [transactions]);

  // Real incomes (Salary, Freelance, etc.) — strictly excludes Change!
  const incomes = useMemo(() => {
    return transactions.filter((t) => t.type === 'income' && !isChangeTransaction(t));
  }, [transactions]);

  // Returned Change transactions (from 'Change' option) — directly deducts from amount spent!
  const changeTransactions = useMemo(() => {
    return transactions.filter((t) => isChangeTransaction(t));
  }, [transactions]);

  const currentBudget = useMemo(() => {
    return budgets.find((b) => b.yearMonth === selectedMonth) || null;
  }, [budgets, selectedMonth]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead && !n.isDismissed).length;
  }, [notifications]);

  // Metrics
  const totalWalletBalance = useMemo(() => {
    return accounts.filter((a) => !a.isArchived).reduce((sum, a) => addRupees(sum, a.currentBalance), 0);
  }, [accounts]);

  const totalSavingsBalance = useMemo(() => {
    return savingsPots.filter((p) => !p.isArchived).reduce((sum, p) => addRupees(sum, p.currentAmount), 0);
  }, [savingsPots]);

  const totalNetWorth = useMemo(() => {
    return addRupees(totalWalletBalance, totalSavingsBalance);
  }, [totalWalletBalance, totalSavingsBalance]);

  // Total Inflow: Sum of verified income sources (strictly excludes Change)
  const monthlyIncome = useMemo(() => {
    return incomes
      .filter((t) => t.date.startsWith(selectedMonth))
      .reduce((sum, t) => addRupees(sum, t.amount), 0);
  }, [incomes, selectedMonth]);

  // Total Change received back for the selected month
  const monthlyChange = useMemo(() => {
    return changeTransactions
      .filter((t) => t.date.startsWith(selectedMonth))
      .reduce((sum, t) => addRupees(sum, t.amount), 0);
  }, [changeTransactions, selectedMonth]);

  // Gross monthly expenses before subtracting change
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

  // Calendar & Month Analytics
  const selectedDateExpenses = useMemo(() => {
    return expenses.filter((e) => e.date === selectedDate);
  }, [expenses, selectedDate]);

  const selectedDateTotal = useMemo(() => {
    return calculateDailyTotal(expenses, selectedDate, changeTransactions);
  }, [expenses, selectedDate, changeTransactions]);

  const selectedMonthExpenses = useMemo(() => {
    return expenses.filter((e) => e.date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const monthlyStats: MonthlyStats = useMemo(() => {
    return calculateMonthlyStats(expenses, selectedMonth, changeTransactions);
  }, [expenses, selectedMonth, changeTransactions]);

  const dateSpendingMap = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      map.set(e.date, (map.get(e.date) || 0) + e.amount);
    });
    changeTransactions.forEach((c) => {
      const cur = map.get(c.date) || 0;
      map.set(c.date, Math.max(0, cur - c.amount));
    });
    return map;
  }, [expenses, changeTransactions]);

  const exportCSV = useCallback(() => {
    exportExpensesToCSV(expenses, `spendly-expenses-${selectedMonth}`);
  }, [expenses, selectedMonth]);

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
        const accountsBefore = await financeRepository.getAccounts();
        const created = await financeRepository.createExpense(input, undefined, input.createdAt);
        const accountsAfter = await financeRepository.getAccounts();

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
        const created = await financeRepository.createIncome(input, undefined, input.createdAt);
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
        const accountsBefore = await financeRepository.getAccounts();
        const updated = await financeRepository.updateTransaction(id, updates);
        const accountsAfter = await financeRepository.getAccounts();

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
        const res = await financeRepository.deleteTransaction(id);
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

  const deleteExpense = useCallback(
    async (id: string): Promise<boolean> => {
      return deleteTransaction(id);
    },
    [deleteTransaction]
  );

  const createAccount = useCallback(
    async (input: CreateAccountInput): Promise<Account> => {
      const created = await financeRepository.createAccount(input);
      await refreshData();
      showToast(`Wallet "${created.name}" created`);
      return created;
    },
    [refreshData, showToast]
  );

  const updateAccount = useCallback(
    async (id: string, updates: UpdateAccountInput): Promise<Account> => {
      const updated = await financeRepository.updateAccount(id, updates);
      await refreshData();
      showToast('Wallet updated successfully');
      return updated;
    },
    [refreshData, showToast]
  );

  const archiveAccount = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await financeRepository.archiveAccount(id);
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
        const res = await financeRepository.createTransfer(input);
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
      const created = await financeRepository.createSavingsPot(input);
      await refreshData();
      showToast(`Savings goal "${created.name}" created`);
      return created;
    },
    [refreshData, showToast]
  );

  const updateSavingsPot = useCallback(
    async (id: string, updates: UpdateSavingsPotInput): Promise<SavingsPot> => {
      const updated = await financeRepository.updateSavingsPot(id, updates);
      await refreshData();
      showToast('Savings pot updated');
      return updated;
    },
    [refreshData, showToast]
  );

  const archiveSavingsPot = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await financeRepository.archiveSavingsPot(id);
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
        const res = await financeRepository.contributeToSavings(input);
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
        const res = await financeRepository.withdrawFromSavings(input);
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
      const saved = await financeRepository.saveBudget(input);
      await refreshData();
      showToast('Budget saved successfully');
      return saved;
    },
    [refreshData, showToast]
  );

  const createRecurring = useCallback(
    async (input: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecurringTransaction> => {
      const created = await financeRepository.createRecurring(input);
      await refreshData();
      showToast(`Recurring schedule "${created.description}" created`);
      return created;
    },
    [refreshData, showToast]
  );

  const updateRecurring = useCallback(
    async (id: string, updates: Partial<RecurringTransaction>): Promise<RecurringTransaction> => {
      const updated = await financeRepository.updateRecurring(id, updates);
      await refreshData();
      showToast('Recurring payment updated');
      return updated;
    },
    [refreshData, showToast]
  );

  const markOccurrencePaid = useCallback(
    async (recurringId: string, dueDate: string, paymentMethod?: string): Promise<Transaction> => {
      try {
        const tx = await financeRepository.markOccurrencePaid(recurringId, dueDate, paymentMethod);
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
      const res = await financeRepository.skipOccurrence(recurringId, dueDate);
      await refreshData();
      showToast('Occurrence skipped');
      return res;
    },
    [refreshData, showToast]
  );

  const markNotificationRead = useCallback(
    async (id: string): Promise<void> => {
      await financeRepository.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    },
    []
  );

  const dismissNotification = useCallback(
    async (id: string): Promise<void> => {
      await financeRepository.dismissNotification(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isDismissed: true } : n)));
    },
    []
  );

  const updatePreferences = useCallback(
    async (updates: Partial<UserPreferences>): Promise<UserPreferences> => {
      const updated = await financeRepository.updatePreferences(updates);
      setPreferences(updated);
      showToast('Preferences updated');
      return updated;
    },
    [showToast]
  );

  const exportFullBackup = useCallback(async (): Promise<FullBackupData> => {
    return financeRepository.exportFullBackup();
  }, []);

  const importFullBackup = useCallback(
    async (backup: FullBackupData): Promise<boolean> => {
      try {
        const res = await financeRepository.importFullBackup(backup);
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
    const res = await financeRepository.clearAllData();
    await refreshData();
    showToast('All financial data cleared', 'info');
    return res;
  }, [refreshData, showToast]);

  const clearAllExpenses = useCallback(async (): Promise<void> => {
    await clearAllData();
  }, [clearAllData]);

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
        monthlyStats,
        selectedDateExpenses,
        selectedDateTotal,
        selectedMonthExpenses,
        dateSpendingMap,
        setSelectedDate,
        setSelectedMonth,
        addExpense,
        addIncome,
        updateTransaction,
        deleteTransaction,
        deleteExpense,
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
        clearAllExpenses,
        exportCSV,
        showToast,
        removeToast,
        refreshData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

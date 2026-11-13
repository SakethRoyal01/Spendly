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
  PaymentMethod,
} from '../../types/finance';
import { isChangeTransaction } from '../../types/finance';
import type {
  FinanceRepository,
  ContributeInput,
  WithdrawInput,
  TransferInput,
} from './FinanceRepository';
import { safeStorage } from '../storage/storage';
import { toPaise, toRupees, addRupees, subtractRupees } from '../../shared/utils/currency';
import { getTodayDateString, getCurrentMonthString } from '../../shared/utils/dates';
import type { Expense, ExpenseCategory } from '../../types/expense';

const KEYS = {
  ACCOUNTS: 'spendly_accounts_v2',
  TRANSACTIONS: 'spendly_transactions_v2',
  TRANSFERS: 'spendly_transfers_v2',
  LEDGER: 'spendly_ledger_v2',
  SAVINGS: 'spendly_savings_v2',
  SAVINGS_CONTRIBUTIONS: 'spendly_savings_contributions_v2',
  SAVINGS_WITHDRAWALS: 'spendly_savings_withdrawals_v2',
  BUDGETS: 'spendly_budgets_v2',
  RECURRING: 'spendly_recurring_v2',
  OCCURRENCES: 'spendly_occurrences_v2',
  NOTIFICATIONS: 'spendly_notifications_v2',
  PREFERENCES: 'spendly_preferences_v2',
  LEGACY_EXPENSES: 'spendly_expenses_v1',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  currency: 'INR',
  allowOverdraft: true,
  notificationsEnabled: true,
  savingsReminderEnabled: true,
  savingsReminderFrequency: 'weekly',
  reducedMotion: false,
};

export class LocalFinanceRepository implements FinanceRepository {
  private initialized = false;

  private generateId(prefix: string = ''): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return (
      (prefix ? prefix + '_' : '') +
      Math.random().toString(36).substring(2, 9) +
      Date.now().toString(36)
    );
  }

  /**
   * Initializes default accounts and safely migrates legacy expenses if present
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // 1. Check or initialize accounts
    let accounts = safeStorage.get<Account[]>(KEYS.ACCOUNTS, []);
    if (!accounts || accounts.length === 0) {
      const now = new Date().toISOString();
      const defaultCash: Account = {
        id: this.generateId('acc_cash'),
        name: 'Cash Wallet',
        type: 'cash',
        openingBalance: 0,
        currentBalance: 0,
        currency: 'INR',
        color: '#F05010',
        description: 'Physical cash on hand',
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };

      const defaultBank: Account = {
        id: this.generateId('acc_bank'),
        name: 'Main Bank Account',
        type: 'bank',
        openingBalance: 0,
        currentBalance: 0,
        currency: 'INR',
        color: '#484848',
        description: 'Primary checking/salary account',
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };

      accounts = [defaultCash, defaultBank];
      safeStorage.set(KEYS.ACCOUNTS, accounts);
    }

    // 2. Check if legacy expenses need migration to transactions & ledger
    const legacyExpenses = safeStorage.get<Expense[]>(KEYS.LEGACY_EXPENSES, []);
    let transactions = safeStorage.get<Transaction[]>(KEYS.TRANSACTIONS, []);
    let ledger = safeStorage.get<LedgerEntry[]>(KEYS.LEDGER, []);

    if (legacyExpenses.length > 0 && transactions.length === 0) {
      const defaultCashAcc = accounts.find((a) => a.type === 'cash') || accounts[0];
      const migratedTransactions: Transaction[] = [];
      const migratedLedger: LedgerEntry[] = [];

      let totalDeductions = 0;

      for (const exp of legacyExpenses) {
        const tx: Transaction = {
          id: exp.id,
          userId: exp.userId,
          type: 'expense',
          amount: exp.amount,
          category: exp.category,
          description: exp.description,
          date: exp.date,
          paymentMethod: 'Cash',
          sourceAccountId: defaultCashAcc.id,
          createdAt: exp.createdAt,
          updatedAt: exp.updatedAt || exp.createdAt,
        };
        migratedTransactions.push(tx);

        migratedLedger.push({
          id: this.generateId('led'),
          date: exp.date,
          type: 'expense',
          referenceId: exp.id,
          accountId: defaultCashAcc.id,
          amount: -exp.amount,
          description: exp.description || exp.category,
          createdAt: exp.createdAt,
        });

        totalDeductions = addRupees(totalDeductions, exp.amount);
      }

      transactions = migratedTransactions;
      ledger = migratedLedger;

      // Adjust cash account balance
      defaultCashAcc.currentBalance = subtractRupees(defaultCashAcc.openingBalance, totalDeductions);
      safeStorage.set(KEYS.ACCOUNTS, accounts);
      safeStorage.set(KEYS.TRANSACTIONS, transactions);
      safeStorage.set(KEYS.LEDGER, ledger);
    }

    // 3. Self-healing: Check if any Change transactions were saved as expenses
    // Change returned from payments must be an inflow to the wallet and deducted from expenses
    if (transactions.length > 0) {
      let txModified = false;
      let ledgerModified = false;
      const defaultCashAcc = accounts.find((a) => a.type === 'cash') || accounts[0];

      const updatedTxs = transactions.map((t) => {
        const isChange = isChangeTransaction(t);
        if (isChange && t.type === 'expense') {
          txModified = true;
          // Invert ledger entry from -amount (deduction) to +amount (inflow credit)
          const entryIdx = ledger.findIndex((l) => l.referenceId === t.id);
          if (entryIdx !== -1) {
            ledger[entryIdx].type = 'income';
            ledger[entryIdx].amount = Math.abs(t.amount);
            ledgerModified = true;
          }
          return {
            ...t,
            type: 'income' as const,
            isChange: true,
            category: 'Change',
            destinationAccountId: t.sourceAccountId || defaultCashAcc?.id || null,
          };
        }
        return t;
      });

      if (txModified) {
        transactions = updatedTxs;
        safeStorage.set(KEYS.TRANSACTIONS, transactions);
        if (ledgerModified) {
          safeStorage.set(KEYS.LEDGER, ledger);
        }
        this.syncLegacyExpenses(transactions);

        // Reconcile accounts so cash balance accurately reflects change returned
        for (const acc of accounts) {
          const accEntries = ledger.filter((l) => l.accountId === acc.id);
          const totalMovementsPaise = accEntries.reduce((sum, l) => sum + toPaise(l.amount), 0);
          acc.currentBalance = toRupees(toPaise(acc.openingBalance) + totalMovementsPaise);
          acc.updatedAt = new Date().toISOString();
        }
        safeStorage.set(KEYS.ACCOUNTS, accounts);
      }
    }

    this.initialized = true;
  }

  // --- ACCOUNTS (WALLETS) ---

  async getAccounts(): Promise<Account[]> {
    await this.initialize();
    return safeStorage.get<Account[]>(KEYS.ACCOUNTS, []).filter((a) => !a.isArchived);
  }

  async getAllAccounts(): Promise<Account[]> {
    await this.initialize();
    return safeStorage.get<Account[]>(KEYS.ACCOUNTS, []);
  }

  async getAccountById(id: string): Promise<Account | null> {
    const accounts = await this.getAllAccounts();
    return accounts.find((a) => a.id === id) || null;
  }

  async createAccount(input: CreateAccountInput): Promise<Account> {
    await this.initialize();
    const accounts = await this.getAllAccounts();

    const opening = input.openingBalance !== undefined ? Math.round(Number(input.openingBalance) * 100) / 100 : 0;
    const now = new Date().toISOString();

    const newAccount: Account = {
      id: this.generateId('acc'),
      name: input.name.trim(),
      type: input.type,
      openingBalance: opening,
      currentBalance: opening,
      currency: input.currency || 'INR',
      color: input.color || '#484848',
      description: input.description?.trim(),
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [...accounts, newAccount];
    safeStorage.set(KEYS.ACCOUNTS, updated);
    return newAccount;
  }

  async updateAccount(id: string, updates: UpdateAccountInput): Promise<Account> {
    await this.initialize();
    const accounts = await this.getAllAccounts();
    const index = accounts.findIndex((a) => a.id === id);
    if (index === -1) throw new Error(`Account with id "${id}" not found`);

    const existing = accounts[index];
    const now = new Date().toISOString();

    let openingDiff = 0;
    if (updates.openingBalance !== undefined) {
      const newOpening = Math.round(Number(updates.openingBalance) * 100) / 100;
      openingDiff = subtractRupees(newOpening, existing.openingBalance);
      existing.openingBalance = newOpening;
    }

    const updatedAccount: Account = {
      ...existing,
      ...updates,
      currentBalance: addRupees(existing.currentBalance, openingDiff),
      updatedAt: now,
    };

    accounts[index] = updatedAccount;
    safeStorage.set(KEYS.ACCOUNTS, accounts);
    return updatedAccount;
  }

  async archiveAccount(id: string): Promise<boolean> {
    await this.initialize();
    const accounts = await this.getAllAccounts();
    const index = accounts.findIndex((a) => a.id === id);
    if (index === -1) return false;

    // Check if account has non-zero balance
    if (accounts[index].currentBalance !== 0) {
      throw new Error('Cannot archive account with non-zero balance. Please transfer or adjust funds first.');
    }

    accounts[index].isArchived = true;
    accounts[index].updatedAt = new Date().toISOString();
    safeStorage.set(KEYS.ACCOUNTS, accounts);
    return true;
  }

  // --- TRANSACTIONS (EXPENSES & INCOMES) ---

  async getTransactions(): Promise<Transaction[]> {
    await this.initialize();
    const txs = safeStorage.get<Transaction[]>(KEYS.TRANSACTIONS, []);
    return txs.sort((a, b) => {
      const dDiff = b.date.localeCompare(a.date);
      if (dDiff !== 0) return dDiff;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const txs = await this.getTransactions();
    return txs.find((t) => t.id === id) || null;
  }

  async createExpense(
    input: CreateTransactionInput,
    customId?: string,
    customCreatedAt?: string
  ): Promise<Transaction> {
    await this.initialize();

    // If input is actually a Change transaction, route cleanly to createIncome as Change
    if (isChangeTransaction(input)) {
      return this.createIncome(
        {
          ...input,
          type: 'income',
          isChange: true,
          category: 'Change',
          destinationAccountId: input.sourceAccountId || input.destinationAccountId,
        },
        customId,
        customCreatedAt
      );
    }

    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Expense amount must be greater than 0');
    }

    const accounts = await this.getAllAccounts();
    const ledger = safeStorage.get<LedgerEntry[]>(KEYS.LEDGER, []);
    const pots = safeStorage.get<SavingsPot[]>(KEYS.SAVINGS, []);
    const now = new Date().toISOString();
    const txId = customId || this.generateId('tx');

    const newLedgerEntries: LedgerEntry[] = [];
    const isUnspecified = !input.paymentMethod || input.paymentMethod === 'Not specified';

    // Case 0: Payment method not specified
    if (isUnspecified) {
      // An unspecified payment method:
      // - Does NOT deduct anything from Cash Wallet or Bank Account.
      // - Does NOT create ledger entries.
      // - Is saved normally and included in daily/monthly totals and spending reports.
    }
    // Case 1: Funded directly from a Savings Pot (Option A)
    else if (input.savingsPotId) {
      const potIdx = pots.findIndex((p) => p.id === input.savingsPotId);
      if (potIdx === -1) throw new Error('Selected savings pot not found');

      pots[potIdx].currentAmount = subtractRupees(pots[potIdx].currentAmount, amount);
      pots[potIdx].updatedAt = now;
      safeStorage.set(KEYS.SAVINGS, pots);
    }
    // Case 2: Hybrid / Split payment across multiple accounts
    else if (input.paymentMethod === 'Hybrid' && input.splits && input.splits.length > 0) {
      const splitSumPaise = input.splits.reduce((sum, s) => sum + toPaise(s.amount), 0);
      if (splitSumPaise !== toPaise(amount)) {
        throw new Error(
          `Split amounts total (₹${toRupees(splitSumPaise)}) must exactly equal the total expense amount (₹${amount})`
        );
      }

      // Check split sources exist
      for (const split of input.splits) {
        if (split.amount <= 0) {
          throw new Error('Each split amount must be greater than 0');
        }
        const acc = accounts.find((a) => a.id === split.sourceAccountId);
        if (!acc) throw new Error(`Source account for split not found: ${split.sourceAccountId}`);

        // Note: Wallet and bank account balances are permitted to become negative on expenses.
        // Never block an expense because of insufficient funds.
      }

      // Apply deductions
      for (const split of input.splits) {
        const accIdx = accounts.findIndex((a) => a.id === split.sourceAccountId);
        accounts[accIdx].currentBalance = subtractRupees(accounts[accIdx].currentBalance, split.amount);
        accounts[accIdx].updatedAt = now;

        newLedgerEntries.push({
          id: this.generateId('led'),
          date: input.date,
          type: 'expense',
          referenceId: txId,
          accountId: split.sourceAccountId,
          amount: -split.amount,
          description: input.description || String(input.category),
          createdAt: now,
        });
      }
    }
    // Case 3: Single source payment (Cash, UPI from Bank, Bank Transfer, Card, etc.)
    else {
      let sourceAccId = input.sourceAccountId;
      if (!sourceAccId) {
        // Fallback to default or matching account
        const fallback = input.paymentMethod === 'Cash'
          ? accounts.find((a) => a.type === 'cash')
          : accounts.find((a) => a.type === 'bank') || accounts[0];
        sourceAccId = fallback?.id;
      }

      if (!sourceAccId) throw new Error('A source payment account must be selected');

      const accIdx = accounts.findIndex((a) => a.id === sourceAccId);
      if (accIdx === -1) throw new Error('Selected source account not found');

      // Note: Wallet and bank account balances are permitted to become negative on expenses.
      // Never block an expense because of insufficient funds.
      accounts[accIdx].currentBalance = subtractRupees(accounts[accIdx].currentBalance, amount);
      accounts[accIdx].updatedAt = now;

      newLedgerEntries.push({
        id: this.generateId('led'),
        date: input.date,
        type: 'expense',
        referenceId: txId,
        accountId: sourceAccId,
        amount: -amount,
        description: input.description || String(input.category),
        createdAt: now,
      });
    }

    const newTx: Transaction = {
      id: txId,
      userId: input.userId ?? null,
      type: 'expense',
      amount: Math.round(amount * 100) / 100,
      category: input.category,
      description: (input.description || '').trim(),
      date: input.date,
      paymentMethod: isUnspecified ? 'Not specified' : (input.paymentMethod || 'Not specified'),
      sourceAccountId: isUnspecified ? null : (input.sourceAccountId || (newLedgerEntries[0]?.accountId ?? null)),
      splits: isUnspecified ? undefined : input.splits,
      savingsPotId: isUnspecified ? null : (input.savingsPotId || null),
      note: input.note?.trim(),
      createdAt: customCreatedAt || now,
      updatedAt: now,
    };

    // Save state
    const transactions = await this.getTransactions();
    safeStorage.set(KEYS.TRANSACTIONS, [newTx, ...transactions]);
    safeStorage.set(KEYS.ACCOUNTS, accounts);
    safeStorage.set(KEYS.LEDGER, [...ledger, ...newLedgerEntries]);

    // Also mirror into legacy expenses key for full backward compatibility
    this.syncLegacyExpenses([newTx, ...transactions]);

    return newTx;
  }

  async createIncome(
    input: CreateTransactionInput,
    customId?: string,
    customCreatedAt?: string
  ): Promise<Transaction> {
    await this.initialize();
    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Income amount must be greater than 0');
    }

    const accounts = await this.getAllAccounts();
    const ledger = safeStorage.get<LedgerEntry[]>(KEYS.LEDGER, []);
    const now = new Date().toISOString();
    const txId = customId || this.generateId('tx');

    let destAccId = input.destinationAccountId;
    if (!destAccId) {
      if (input.paymentMethod === 'Cash') {
        const cashAcc = accounts.find((a) => a.type === 'cash') || accounts[0];
        destAccId = cashAcc?.id;
      } else {
        const bankAcc = accounts.find((a) => a.type === 'bank') || accounts[0];
        destAccId = bankAcc?.id;
      }
    }
    if (!destAccId) throw new Error('A destination account must be selected for income');

    const accIdx = accounts.findIndex((a) => a.id === destAccId);
    if (accIdx === -1) throw new Error('Selected destination account not found');

    accounts[accIdx].currentBalance = addRupees(accounts[accIdx].currentBalance, amount);
    accounts[accIdx].updatedAt = now;

    const ledgerEntry: LedgerEntry = {
      id: this.generateId('led'),
      date: input.date,
      type: 'income',
      referenceId: txId,
      accountId: destAccId,
      amount: amount,
      description: input.description || String(input.category),
      createdAt: now,
    };

    const newTx: Transaction = {
      id: txId,
      userId: input.userId ?? null,
      type: 'income',
      isChange: Boolean(input.isChange || input.category === 'Change'),
      amount: Math.round(amount * 100) / 100,
      category: input.category,
      description: (input.description || '').trim(),
      date: input.date,
      paymentMethod: input.paymentMethod || 'Bank Transfer',
      destinationAccountId: destAccId,
      note: input.note?.trim(),
      createdAt: customCreatedAt || now,
      updatedAt: now,
    };

    const transactions = await this.getTransactions();
    safeStorage.set(KEYS.TRANSACTIONS, [newTx, ...transactions]);
    safeStorage.set(KEYS.ACCOUNTS, accounts);
    safeStorage.set(KEYS.LEDGER, [...ledger, ledgerEntry]);

    return newTx;
  }

  async updateTransaction(id: string, updates: UpdateTransactionInput): Promise<Transaction> {
    await this.initialize();
    const existing = await this.getTransactionById(id);
    if (!existing) throw new Error(`Transaction with id "${id}" not found`);

    // Reverse existing financial effects cleanly
    await this.reverseTransactionEffects(existing);

    // Apply updated transaction
    const merged: CreateTransactionInput = {
      userId: existing.userId,
      type: updates.type || existing.type,
      isChange: updates.isChange !== undefined ? updates.isChange : existing.isChange,
      amount: updates.amount !== undefined ? updates.amount : existing.amount,
      category: updates.category || existing.category,
      description: updates.description !== undefined ? updates.description : existing.description,
      date: updates.date || existing.date,
      paymentMethod: updates.paymentMethod !== undefined ? updates.paymentMethod : existing.paymentMethod,
      sourceAccountId: updates.sourceAccountId !== undefined ? updates.sourceAccountId : existing.sourceAccountId,
      destinationAccountId: updates.destinationAccountId !== undefined ? updates.destinationAccountId : existing.destinationAccountId,
      splits: updates.splits !== undefined ? updates.splits : existing.splits,
      savingsPotId: updates.savingsPotId !== undefined ? updates.savingsPotId : existing.savingsPotId,
      note: updates.note !== undefined ? updates.note : existing.note,
    };

    // Remove the old transaction entry first so recreation replaces it cleanly with the same id
    const txs = (await this.getTransactions()).filter((t) => t.id !== id);
    safeStorage.set(KEYS.TRANSACTIONS, txs);

    let updatedTx: Transaction;
    if (merged.type === 'income') {
      updatedTx = await this.createIncome(merged, existing.id, existing.createdAt);
    } else {
      updatedTx = await this.createExpense(merged, existing.id, existing.createdAt);
    }

    return updatedTx;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    await this.initialize();
    const existing = await this.getTransactionById(id);
    if (!existing) return false;

    // Reverse financial deductions or additions atomically
    await this.reverseTransactionEffects(existing);

    const txs = (await this.getTransactions()).filter((t) => t.id !== id);
    safeStorage.set(KEYS.TRANSACTIONS, txs);

    this.syncLegacyExpenses(txs);
    return true;
  }

  private async reverseTransactionEffects(tx: Transaction): Promise<void> {
    const accounts = await this.getAllAccounts();
    const ledger = safeStorage.get<LedgerEntry[]>(KEYS.LEDGER, []);
    const pots = safeStorage.get<SavingsPot[]>(KEYS.SAVINGS, []);
    const now = new Date().toISOString();

    if (tx.type === 'expense') {
      if (tx.paymentMethod === 'Not specified' || !tx.paymentMethod) {
        // Unspecified payment method has no account deductions to reverse
      } else if (tx.savingsPotId) {
        // Refund back to savings pot
        const potIdx = pots.findIndex((p) => p.id === tx.savingsPotId);
        if (potIdx !== -1) {
          pots[potIdx].currentAmount = addRupees(pots[potIdx].currentAmount, tx.amount);
          pots[potIdx].updatedAt = now;
          safeStorage.set(KEYS.SAVINGS, pots);
        }
      } else if (tx.paymentMethod === 'Hybrid' && tx.splits) {
        // Refund each split to its source account
        for (const split of tx.splits) {
          const accIdx = accounts.findIndex((a) => a.id === split.sourceAccountId);
          if (accIdx !== -1) {
            accounts[accIdx].currentBalance = addRupees(accounts[accIdx].currentBalance, split.amount);
            accounts[accIdx].updatedAt = now;
          }
        }
      } else if (tx.sourceAccountId) {
        // Refund single source account
        const accIdx = accounts.findIndex((a) => a.id === tx.sourceAccountId);
        if (accIdx !== -1) {
          accounts[accIdx].currentBalance = addRupees(accounts[accIdx].currentBalance, tx.amount);
          accounts[accIdx].updatedAt = now;
        }
      } else {
        // Fallback for earlier records where sourceAccountId was not explicitly stored
        const fallback = tx.paymentMethod === 'Cash'
          ? accounts.find((a) => a.type === 'cash')
          : accounts.find((a) => a.type === 'bank');
        if (fallback) {
          const accIdx = accounts.findIndex((a) => a.id === fallback.id);
          if (accIdx !== -1) {
            accounts[accIdx].currentBalance = addRupees(accounts[accIdx].currentBalance, tx.amount);
            accounts[accIdx].updatedAt = now;
          }
        }
      }
    } else if (tx.type === 'income') {
      // Revert income from destination account
      let destAccId = tx.destinationAccountId;
      if (!destAccId) {
        const fallback = tx.paymentMethod === 'Cash'
          ? accounts.find((a) => a.type === 'cash')
          : accounts.find((a) => a.type === 'bank');
        destAccId = fallback?.id;
      }
      if (destAccId) {
        const accIdx = accounts.findIndex((a) => a.id === destAccId);
        if (accIdx !== -1) {
          accounts[accIdx].currentBalance = subtractRupees(accounts[accIdx].currentBalance, tx.amount);
          accounts[accIdx].updatedAt = now;
        }
      }
    }

    // Filter out previous ledger entries for this transaction
    const updatedLedger = ledger.filter((l) => l.referenceId !== tx.id);
    safeStorage.set(KEYS.ACCOUNTS, accounts);
    safeStorage.set(KEYS.LEDGER, updatedLedger);
  }

  private syncLegacyExpenses(transactions: Transaction[]): void {
    const expenses: Expense[] = transactions
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
    safeStorage.set(KEYS.LEGACY_EXPENSES, expenses);
  }

  // --- TRANSFERS BETWEEN WALLETS ---

  async getTransfers(): Promise<Transfer[]> {
    await this.initialize();
    return safeStorage.get<Transfer[]>(KEYS.TRANSFERS, []);
  }

  async createTransfer(input: TransferInput): Promise<Transfer> {
    await this.initialize();
    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Transfer amount must be greater than 0');
    }

    if (input.sourceAccountId === input.destinationAccountId) {
      throw new Error('Source and destination accounts must be different');
    }

    const accounts = await this.getAllAccounts();
    const ledger = safeStorage.get<LedgerEntry[]>(KEYS.LEDGER, []);
    const now = new Date().toISOString();

    const srcIdx = accounts.findIndex((a) => a.id === input.sourceAccountId);
    const destIdx = accounts.findIndex((a) => a.id === input.destinationAccountId);

    if (srcIdx === -1 || destIdx === -1) {
      throw new Error('Source or destination account not found');
    }

    // Atomic balance adjustment (negative balances permitted)
    accounts[srcIdx].currentBalance = subtractRupees(accounts[srcIdx].currentBalance, amount);
    accounts[destIdx].currentBalance = addRupees(accounts[destIdx].currentBalance, amount);
    accounts[srcIdx].updatedAt = now;
    accounts[destIdx].updatedAt = now;

    const transferId = this.generateId('trf');
    const transfer: Transfer = {
      id: transferId,
      sourceAccountId: input.sourceAccountId,
      destinationAccountId: input.destinationAccountId,
      amount,
      date: input.date,
      note: input.note?.trim(),
      createdAt: now,
    };

    const ledgers: LedgerEntry[] = [
      {
        id: this.generateId('led'),
        date: input.date,
        type: 'transfer',
        referenceId: transferId,
        accountId: input.sourceAccountId,
        amount: -amount,
        description: `Transfer to ${accounts[destIdx].name}`,
        createdAt: now,
      },
      {
        id: this.generateId('led'),
        date: input.date,
        type: 'transfer',
        referenceId: transferId,
        accountId: input.destinationAccountId,
        amount: amount,
        description: `Transfer from ${accounts[srcIdx].name}`,
        createdAt: now,
      },
    ];

    const transfers = await this.getTransfers();
    safeStorage.set(KEYS.TRANSFERS, [transfer, ...transfers]);
    safeStorage.set(KEYS.ACCOUNTS, accounts);
    safeStorage.set(KEYS.LEDGER, [...ledger, ...ledgers]);

    return transfer;
  }

  // --- SAVINGS POTS & GOALS ---

  async getSavingsPots(): Promise<SavingsPot[]> {
    await this.initialize();
    return safeStorage.get<SavingsPot[]>(KEYS.SAVINGS, []).filter((p) => !p.isArchived);
  }

  async getAllSavingsPots(): Promise<SavingsPot[]> {
    await this.initialize();
    return safeStorage.get<SavingsPot[]>(KEYS.SAVINGS, []);
  }

  async createSavingsPot(input: CreateSavingsPotInput): Promise<SavingsPot> {
    await this.initialize();
    const pots = await this.getAllSavingsPots();
    const now = new Date().toISOString();

    const newPot: SavingsPot = {
      id: this.generateId('pot'),
      name: input.name.trim(),
      description: input.description?.trim(),
      targetAmount: input.targetAmount ? Math.round(Number(input.targetAmount) * 100) / 100 : null,
      currentAmount: 0,
      targetDate: input.targetDate || null,
      icon: input.icon || 'PiggyBank',
      color: input.color || '#F05010',
      priority: input.priority || 'medium',
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    safeStorage.set(KEYS.SAVINGS, [...pots, newPot]);
    return newPot;
  }

  async updateSavingsPot(id: string, updates: UpdateSavingsPotInput): Promise<SavingsPot> {
    await this.initialize();
    const pots = await this.getAllSavingsPots();
    const index = pots.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Savings pot with id "${id}" not found`);

    const now = new Date().toISOString();
    const updatedPot: SavingsPot = {
      ...pots[index],
      ...updates,
      updatedAt: now,
    };

    pots[index] = updatedPot;
    safeStorage.set(KEYS.SAVINGS, pots);
    return updatedPot;
  }

  async archiveSavingsPot(id: string): Promise<boolean> {
    await this.initialize();
    const pots = await this.getAllSavingsPots();
    const index = pots.findIndex((p) => p.id === id);
    if (index === -1) return false;

    if (pots[index].currentAmount > 0) {
      throw new Error('Please withdraw or transfer remaining funds before archiving this savings pot.');
    }

    pots[index].isArchived = true;
    pots[index].updatedAt = new Date().toISOString();
    safeStorage.set(KEYS.SAVINGS, pots);
    return true;
  }

  async contributeToSavings(input: ContributeInput): Promise<SavingsContribution> {
    await this.initialize();
    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Contribution amount must be greater than 0');
    }

    const accounts = await this.getAllAccounts();
    const pots = await this.getAllSavingsPots();
    const ledger = safeStorage.get<LedgerEntry[]>(KEYS.LEDGER, []);
    const contributions = safeStorage.get<SavingsContribution[]>(KEYS.SAVINGS_CONTRIBUTIONS, []);
    const now = new Date().toISOString();

    const potIdx = pots.findIndex((p) => p.id === input.potId);
    if (potIdx === -1) throw new Error('Savings pot not found');

    const accIdx = accounts.findIndex((a) => a.id === input.sourceAccountId);
    if (accIdx === -1) throw new Error('Source wallet not found');

    // Atomic deduction from wallet (negative balances permitted), addition to savings pot
    accounts[accIdx].currentBalance = subtractRupees(accounts[accIdx].currentBalance, amount);
    pots[potIdx].currentAmount = addRupees(pots[potIdx].currentAmount, amount);
    accounts[accIdx].updatedAt = now;
    pots[potIdx].updatedAt = now;

    const contribId = this.generateId('contrib');
    const contribution: SavingsContribution = {
      id: contribId,
      potId: input.potId,
      sourceAccountId: input.sourceAccountId,
      amount,
      date: input.date,
      note: input.note?.trim(),
      createdAt: now,
    };

    const ledgerEntry: LedgerEntry = {
      id: this.generateId('led'),
      date: input.date,
      type: 'savings_contribution',
      referenceId: contribId,
      accountId: input.sourceAccountId,
      amount: -amount,
      description: `Contribution to ${pots[potIdx].name}`,
      createdAt: now,
    };

    safeStorage.set(KEYS.SAVINGS, pots);
    safeStorage.set(KEYS.ACCOUNTS, accounts);
    safeStorage.set(KEYS.SAVINGS_CONTRIBUTIONS, [contribution, ...contributions]);
    safeStorage.set(KEYS.LEDGER, [...ledger, ledgerEntry]);

    return contribution;
  }

  async withdrawFromSavings(input: WithdrawInput): Promise<SavingsWithdrawal> {
    await this.initialize();
    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Withdrawal amount must be greater than 0');
    }

    const accounts = await this.getAllAccounts();
    const pots = await this.getAllSavingsPots();
    const ledger = safeStorage.get<LedgerEntry[]>(KEYS.LEDGER, []);
    const withdrawals = safeStorage.get<SavingsWithdrawal[]>(KEYS.SAVINGS_WITHDRAWALS, []);
    const now = new Date().toISOString();

    const potIdx = pots.findIndex((p) => p.id === input.potId);
    if (potIdx === -1) throw new Error('Savings pot not found');

    const accIdx = accounts.findIndex((a) => a.id === input.destinationAccountId);
    if (accIdx === -1) throw new Error('Destination wallet not found');

    if (pots[potIdx].currentAmount < amount) {
      throw new Error(
        `Insufficient funds in savings pot "${pots[potIdx].name}". Available: ₹${pots[potIdx].currentAmount}`
      );
    }

    // Atomic deduction from pot, addition to wallet (Option B: internal transfer)
    pots[potIdx].currentAmount = subtractRupees(pots[potIdx].currentAmount, amount);
    accounts[accIdx].currentBalance = addRupees(accounts[accIdx].currentBalance, amount);
    pots[potIdx].updatedAt = now;
    accounts[accIdx].updatedAt = now;

    const withdrawId = this.generateId('withdr');
    const withdrawal: SavingsWithdrawal = {
      id: withdrawId,
      potId: input.potId,
      destinationAccountId: input.destinationAccountId,
      amount,
      date: input.date,
      note: input.note?.trim(),
      createdAt: now,
    };

    const ledgerEntry: LedgerEntry = {
      id: this.generateId('led'),
      date: input.date,
      type: 'savings_withdrawal',
      referenceId: withdrawId,
      accountId: input.destinationAccountId,
      amount: amount,
      description: `Withdrawal from ${pots[potIdx].name}`,
      createdAt: now,
    };

    safeStorage.set(KEYS.SAVINGS, pots);
    safeStorage.set(KEYS.ACCOUNTS, accounts);
    safeStorage.set(KEYS.SAVINGS_WITHDRAWALS, [withdrawal, ...withdrawals]);
    safeStorage.set(KEYS.LEDGER, [...ledger, ledgerEntry]);

    return withdrawal;
  }

  // --- BUDGETS ---

  async getBudgets(): Promise<Budget[]> {
    await this.initialize();
    return safeStorage.get<Budget[]>(KEYS.BUDGETS, []);
  }

  async getBudgetByMonth(yearMonth: string): Promise<Budget | null> {
    const budgets = await this.getBudgets();
    return budgets.find((b) => b.yearMonth === yearMonth) || null;
  }

  async saveBudget(input: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    await this.initialize();
    const budgets = await this.getBudgets();
    const existingIdx = budgets.findIndex((b) => b.yearMonth === input.yearMonth);
    const now = new Date().toISOString();

    let savedBudget: Budget;
    if (existingIdx !== -1) {
      savedBudget = {
        ...budgets[existingIdx],
        ...input,
        updatedAt: now,
      };
      budgets[existingIdx] = savedBudget;
    } else {
      savedBudget = {
        id: this.generateId('bgt'),
        ...input,
        createdAt: now,
        updatedAt: now,
      };
      budgets.push(savedBudget);
    }

    safeStorage.set(KEYS.BUDGETS, budgets);
    return savedBudget;
  }

  // --- RECURRING EXPENSES ---

  async getRecurring(): Promise<RecurringTransaction[]> {
    await this.initialize();
    return safeStorage.get<RecurringTransaction[]>(KEYS.RECURRING, []);
  }

  async getOccurrences(): Promise<RecurringOccurrence[]> {
    await this.initialize();
    return safeStorage.get<RecurringOccurrence[]>(KEYS.OCCURRENCES, []);
  }

  async createRecurring(
    input: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RecurringTransaction> {
    await this.initialize();
    const list = await this.getRecurring();
    const now = new Date().toISOString();

    const item: RecurringTransaction = {
      id: this.generateId('rec'),
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    safeStorage.set(KEYS.RECURRING, [...list, item]);
    return item;
  }

  async updateRecurring(id: string, updates: Partial<RecurringTransaction>): Promise<RecurringTransaction> {
    await this.initialize();
    const list = await this.getRecurring();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Recurring item not found');

    const updated: RecurringTransaction = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    list[idx] = updated;
    safeStorage.set(KEYS.RECURRING, list);
    return updated;
  }

  async markOccurrencePaid(
    recurringId: string,
    dueDate: string,
    paymentMethod?: string
  ): Promise<Transaction> {
    await this.initialize();
    const recurringList = await this.getRecurring();
    const item = recurringList.find((r) => r.id === recurringId);
    if (!item) throw new Error('Recurring rule not found');

    const occurrences = await this.getOccurrences();
    const occurrenceKey = `${recurringId}_${dueDate}`;
    const alreadyProcessed = occurrences.some(
      (o) => o.id === occurrenceKey && o.status === 'paid'
    );
    if (alreadyProcessed) {
      throw new Error(`Occurrence for ${dueDate} has already been paid`);
    }

    // Create the expense transaction
    const tx = await this.createExpense({
      userId: null,
      type: 'expense',
      amount: item.amount,
      category: (item.category as ExpenseCategory) || 'Other',
      description: item.description,
      date: dueDate,
      paymentMethod: (paymentMethod as PaymentMethod) || item.paymentMethod || 'UPI',
      sourceAccountId: item.sourceAccountId,
      note: 'Recurring automated payment',
    });

    const occ: RecurringOccurrence = {
      id: occurrenceKey,
      recurringId,
      dueDate,
      status: 'paid',
      transactionId: tx.id,
      processedAt: new Date().toISOString(),
    };

    const updatedOccurrences = occurrences.filter((o) => o.id !== occurrenceKey);
    safeStorage.set(KEYS.OCCURRENCES, [...updatedOccurrences, occ]);

    return tx;
  }

  async skipOccurrence(recurringId: string, dueDate: string): Promise<boolean> {
    await this.initialize();
    const occurrences = await this.getOccurrences();
    const occurrenceKey = `${recurringId}_${dueDate}`;

    const occ: RecurringOccurrence = {
      id: occurrenceKey,
      recurringId,
      dueDate,
      status: 'skipped',
      processedAt: new Date().toISOString(),
    };

    const updated = occurrences.filter((o) => o.id !== occurrenceKey);
    safeStorage.set(KEYS.OCCURRENCES, [...updated, occ]);
    return true;
  }

  // --- NOTIFICATIONS & ALERTS ---

  async getNotifications(): Promise<FinancialNotification[]> {
    await this.initialize();
    return safeStorage.get<FinancialNotification[]>(KEYS.NOTIFICATIONS, []);
  }

  async markNotificationRead(id: string): Promise<void> {
    const list = await this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    safeStorage.set(KEYS.NOTIFICATIONS, updated);
  }

  async dismissNotification(id: string): Promise<void> {
    const list = await this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isDismissed: true } : n));
    safeStorage.set(KEYS.NOTIFICATIONS, updated);
  }

  async checkAndGenerateAlerts(): Promise<FinancialNotification[]> {
    await this.initialize();
    const existing = await this.getNotifications();
    const accounts = await this.getAccounts();
    const recurring = await this.getRecurring();
    const transactions = await this.getTransactions();
    const currentMonth = getCurrentMonthString();
    const budget = await this.getBudgetByMonth(currentMonth);
    const today = getTodayDateString();

    const newAlerts: FinancialNotification[] = [];

    // 1. Low wallet balance alert (< ₹500)
    for (const acc of accounts) {
      if (acc.currentBalance < 500 && acc.currentBalance >= 0) {
        const id = `alert_low_${acc.id}_${today}`;
        if (!existing.some((e) => e.id === id)) {
          newAlerts.push({
            id,
            type: 'low_balance',
            title: `Low Balance: ${acc.name}`,
            message: `Available balance is low: ₹${acc.currentBalance}. Consider replenishing soon.`,
            date: today,
            isRead: false,
            isDismissed: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // 2. Budget threshold alerts
    if (budget && budget.overallMonthlyBudget > 0) {
      const monthExpenses = transactions.filter(
        (t) => t.type === 'expense' && t.date.startsWith(currentMonth)
      );
      const spent = monthExpenses.reduce((s, e) => s + e.amount, 0);
      const ratio = Math.round((spent / budget.overallMonthlyBudget) * 100);

      const thresholds = [100, 90, 75, 50];
      for (const t of thresholds) {
        if (ratio >= t) {
          const id = `alert_budget_${currentMonth}_${t}`;
          if (!existing.some((e) => e.id === id)) {
            newAlerts.push({
              id,
              type: 'budget_threshold',
              title: `Monthly Budget ${t}% Reached`,
              message: `You have spent ₹${spent} of your ₹${budget.overallMonthlyBudget} budget (${ratio}% used).`,
              date: today,
              isRead: false,
              isDismissed: false,
              createdAt: new Date().toISOString(),
            });
          }
          break; // Trigger highest reached
        }
      }
    }

    // 3. Upcoming recurring bills due within 3 days
    for (const rec of recurring) {
      if (!rec.isActive) continue;
      if (rec.nextDueDate <= today) {
        const id = `alert_due_${rec.id}_${rec.nextDueDate}`;
        if (!existing.some((e) => e.id === id)) {
          newAlerts.push({
            id,
            type: 'recurring_due',
            title: `Payment Due: ${rec.description}`,
            message: `₹${rec.amount} is due today (${rec.nextDueDate}).`,
            date: today,
            isRead: false,
            isDismissed: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    if (newAlerts.length > 0) {
      safeStorage.set(KEYS.NOTIFICATIONS, [...newAlerts, ...existing]);
    }

    return safeStorage.get<FinancialNotification[]>(KEYS.NOTIFICATIONS, []);
  }

  // --- PREFERENCES & SETTINGS ---

  async getPreferences(): Promise<UserPreferences> {
    const prefs = safeStorage.get<UserPreferences>(KEYS.PREFERENCES, DEFAULT_PREFERENCES);
    return {
      ...DEFAULT_PREFERENCES,
      ...prefs,
      allowOverdraft: true,
    };
  }

  async updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await this.getPreferences();
    const updated = { ...current, ...updates };
    safeStorage.set(KEYS.PREFERENCES, updated);
    return updated;
  }

  // --- LEDGER & RECONCILIATION ---

  async getLedgerEntries(): Promise<LedgerEntry[]> {
    await this.initialize();
    return safeStorage.get<LedgerEntry[]>(KEYS.LEDGER, []);
  }

  async reconcileBalances(): Promise<{ reconciledAccounts: number; discrepanciesFound: number }> {
    await this.initialize();
    const accounts = await this.getAllAccounts();
    const ledger = await this.getLedgerEntries();

    let discrepanciesFound = 0;
    const reconciledAccounts = accounts.length;

    for (const acc of accounts) {
      // Calculate true balance from opening balance + all ledger entries
      const accEntries = ledger.filter((l) => l.accountId === acc.id);
      const totalMovementsPaise = accEntries.reduce((sum, l) => sum + toPaise(l.amount), 0);
      const trueBalance = toRupees(toPaise(acc.openingBalance) + totalMovementsPaise);

      if (toPaise(acc.currentBalance) !== toPaise(trueBalance)) {
        discrepanciesFound++;
        acc.currentBalance = trueBalance;
        acc.updatedAt = new Date().toISOString();
      }
    }

    if (discrepanciesFound > 0) {
      safeStorage.set(KEYS.ACCOUNTS, accounts);
    }

    return { reconciledAccounts, discrepanciesFound };
  }

  // --- BACKUP & RESTORE ---

  async exportFullBackup(): Promise<FullBackupData> {
    await this.initialize();
    return {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      accounts: await this.getAllAccounts(),
      transactions: await this.getTransactions(),
      transfers: await this.getTransfers(),
      ledgerEntries: await this.getLedgerEntries(),
      savingsPots: await this.getAllSavingsPots(),
      savingsContributions: safeStorage.get<SavingsContribution[]>(KEYS.SAVINGS_CONTRIBUTIONS, []),
      savingsWithdrawals: safeStorage.get<SavingsWithdrawal[]>(KEYS.SAVINGS_WITHDRAWALS, []),
      budgets: await this.getBudgets(),
      recurring: await this.getRecurring(),
      occurrences: await this.getOccurrences(),
      notifications: await this.getNotifications(),
      preferences: await this.getPreferences(),
    };
  }

  async importFullBackup(backup: FullBackupData): Promise<boolean> {
    if (!backup || typeof backup !== 'object' || !Array.isArray(backup.accounts) || !Array.isArray(backup.transactions)) {
      throw new Error('Invalid backup file format: missing accounts or transactions');
    }

    safeStorage.set(KEYS.ACCOUNTS, backup.accounts);
    safeStorage.set(KEYS.TRANSACTIONS, backup.transactions);
    safeStorage.set(KEYS.TRANSFERS, backup.transfers || []);
    safeStorage.set(KEYS.LEDGER, backup.ledgerEntries || []);
    safeStorage.set(KEYS.SAVINGS, backup.savingsPots || []);
    safeStorage.set(KEYS.SAVINGS_CONTRIBUTIONS, backup.savingsContributions || []);
    safeStorage.set(KEYS.SAVINGS_WITHDRAWALS, backup.savingsWithdrawals || []);
    safeStorage.set(KEYS.BUDGETS, backup.budgets || []);
    safeStorage.set(KEYS.RECURRING, backup.recurring || []);
    safeStorage.set(KEYS.OCCURRENCES, backup.occurrences || []);
    safeStorage.set(KEYS.NOTIFICATIONS, backup.notifications || []);
    if (backup.preferences) {
      safeStorage.set(KEYS.PREFERENCES, backup.preferences);
    }

    // Mirror to legacy expenses
    this.syncLegacyExpenses(backup.transactions);

    // Reconcile imported data
    await this.reconcileBalances();
    return true;
  }

  async clearAllData(): Promise<boolean> {
    Object.values(KEYS).forEach((k) => safeStorage.remove(k));
    this.initialized = false;
    await this.initialize();
    return true;
  }
}

export const localFinanceRepository = new LocalFinanceRepository();

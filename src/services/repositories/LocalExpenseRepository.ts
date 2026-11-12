import type { Expense, CreateExpenseInput, UpdateExpenseInput, ExpenseCategory } from '../../types/expense';
import type { ExpenseRepository } from './ExpenseRepository';
import { safeStorage } from '../../lib/storage';

const STORAGE_KEY = 'spendly_expenses_v1';

export class LocalExpenseRepository implements ExpenseRepository {
  private getStoredExpenses(): Expense[] {
    const data = safeStorage.get<unknown[]>(STORAGE_KEY, []);
    if (!Array.isArray(data)) {
      return [];
    }

    // Sanitize and validate loaded data
    return data
      .filter((item): item is Expense => {
        if (!item || typeof item !== 'object') return false;
        const e = item as Record<string, unknown>;
        return (
          typeof e.id === 'string' &&
          typeof e.amount === 'number' &&
          !isNaN(e.amount) &&
          typeof e.category === 'string' &&
          typeof e.date === 'string' &&
          typeof e.createdAt === 'string'
        );
      })
      .sort((a, b) => {
        const dateDiff = b.date.localeCompare(a.date);
        if (dateDiff !== 0) return dateDiff;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }

  private saveExpenses(expenses: Expense[]): void {
    safeStorage.set(STORAGE_KEY, expenses);
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'exp_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  async getAll(): Promise<Expense[]> {
    return this.getStoredExpenses();
  }

  async getById(id: string): Promise<Expense | null> {
    const expenses = this.getStoredExpenses();
    const found = expenses.find((e) => e.id === id);
    return found || null;
  }

  async getByDate(date: string): Promise<Expense[]> {
    const expenses = this.getStoredExpenses();
    return expenses.filter((e) => e.date === date);
  }

  async getByMonth(yearMonth: string): Promise<Expense[]> {
    const expenses = this.getStoredExpenses();
    return expenses.filter((e) => e.date.startsWith(yearMonth));
  }

  async create(input: CreateExpenseInput): Promise<Expense> {
    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Expense amount must be a positive number greater than 0');
    }

    if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    const now = new Date().toISOString();
    const newExpense: Expense = {
      id: this.generateId(),
      userId: input.userId ?? null,
      amount: Math.round(amount * 100) / 100,
      category: input.category as ExpenseCategory,
      description: (input.description || '').trim(),
      date: input.date,
      createdAt: now,
      updatedAt: now,
    };

    const expenses = this.getStoredExpenses();
    const updated = [newExpense, ...expenses];
    this.saveExpenses(updated);

    return newExpense;
  }

  async update(id: string, updates: UpdateExpenseInput): Promise<Expense> {
    const expenses = this.getStoredExpenses();
    const index = expenses.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error(`Expense with id "${id}" not found`);
    }

    const current = expenses[index];
    const amount = updates.amount !== undefined ? Number(updates.amount) : current.amount;
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Expense amount must be a positive number greater than 0');
    }

    if (updates.date && !/^\d{4}-\d{2}-\d{2}$/.test(updates.date)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    const updatedExpense: Expense = {
      ...current,
      ...updates,
      amount: Math.round(amount * 100) / 100,
      description: updates.description !== undefined ? updates.description.trim() : current.description,
      updatedAt: new Date().toISOString(),
    };

    expenses[index] = updatedExpense;
    this.saveExpenses(expenses);

    return updatedExpense;
  }

  async delete(id: string): Promise<boolean> {
    const expenses = this.getStoredExpenses();
    const filtered = expenses.filter((e) => e.id !== id);
    if (filtered.length === expenses.length) {
      return false;
    }
    this.saveExpenses(filtered);
    return true;
  }

  async clearAll(): Promise<void> {
    safeStorage.remove(STORAGE_KEY);
  }

  async bulkImport(expenses: Expense[]): Promise<void> {
    this.saveExpenses(expenses);
  }
}

// Default singleton instance for the app
export const localExpenseRepository = new LocalExpenseRepository();

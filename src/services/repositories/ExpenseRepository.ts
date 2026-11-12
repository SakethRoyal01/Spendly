import type { Expense, CreateExpenseInput, UpdateExpenseInput } from '../../types/expense';

export interface ExpenseRepository {
  /**
   * Retrieve all expenses sorted by date descending, then createdAt descending
   */
  getAll(): Promise<Expense[]>;

  /**
   * Retrieve a single expense by its unique identifier
   */
  getById(id: string): Promise<Expense | null>;

  /**
   * Retrieve all expenses for a specific date (YYYY-MM-DD)
   */
  getByDate(date: string): Promise<Expense[]>;

  /**
   * Retrieve all expenses for a specific month (YYYY-MM)
   */
  getByMonth(yearMonth: string): Promise<Expense[]>;

  /**
   * Create a new expense record
   */
  create(input: CreateExpenseInput): Promise<Expense>;

  /**
   * Update an existing expense record by ID
   */
  update(id: string, updates: UpdateExpenseInput): Promise<Expense>;

  /**
   * Delete an expense by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Clear all expense records (with storage purge)
   */
  clearAll(): Promise<void>;

  /**
   * Bulk import / restore expenses
   */
  bulkImport(expenses: Expense[]): Promise<void>;
}

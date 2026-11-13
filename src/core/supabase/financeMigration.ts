import type { FullBackupData, TransactionSplit } from '../../types/finance';
import { localFinanceRepository } from '../repositories/LocalFinanceRepository';
import { supabase } from './client';

export interface FinanceImportResult {
  accounts: number;
  transactions: number;
  splits: number;
}

const splitToDatabase = (split: TransactionSplit, transactionId: string) => ({
  id: split.id,
  transaction_id: transactionId,
  source_account_id: split.sourceAccountId,
  amount: split.amount,
  payment_method: split.paymentMethod,
});

function toDatabaseBackup(backup: FullBackupData) {
  return {
    accounts: backup.accounts.map(a => ({
      id:a.id,name:a.name,type:a.type,opening_balance:a.openingBalance,current_balance:a.currentBalance,
      currency:a.currency,color:a.color,description:a.description,is_archived:a.isArchived,
      created_at:a.createdAt,updated_at:a.updatedAt,
    })),
    transactions: backup.transactions.map(t => ({
      id:t.id,type:t.type,is_change:t.isChange ?? false,amount:t.amount,category:t.category,
      description:t.description,transaction_date:t.date,payment_method:t.paymentMethod,
      source_account_id:t.sourceAccountId ?? null,destination_account_id:t.destinationAccountId ?? null,
      savings_pot_id:t.savingsPotId ?? null,note:t.note,created_at:t.createdAt,updated_at:t.updatedAt,
    })),
    transactionSplits: backup.transactions.flatMap(t => (t.splits ?? []).map(s => splitToDatabase(s,t.id))),
    transfers: backup.transfers.map(t => ({
      id:t.id,source_account_id:t.sourceAccountId,destination_account_id:t.destinationAccountId,
      amount:t.amount,transaction_date:t.date,note:t.note,created_at:t.createdAt,
    })),
    ledgerEntries: backup.ledgerEntries.map(l => ({
      id:l.id,transaction_date:l.date,type:l.type,reference_id:l.referenceId,account_id:l.accountId,
      amount:l.amount,description:l.description,created_at:l.createdAt,
    })),
    savingsPots: backup.savingsPots.map(p => ({
      id:p.id,name:p.name,description:p.description,target_amount:p.targetAmount,current_amount:p.currentAmount,
      target_date:p.targetDate,icon:p.icon,color:p.color,priority:p.priority,is_archived:p.isArchived,
      created_at:p.createdAt,updated_at:p.updatedAt,
    })),
    savingsContributions: backup.savingsContributions.map(s => ({
      id:s.id,pot_id:s.potId,source_account_id:s.sourceAccountId,amount:s.amount,
      transaction_date:s.date,note:s.note,created_at:s.createdAt,
    })),
    savingsWithdrawals: backup.savingsWithdrawals.map(s => ({
      id:s.id,pot_id:s.potId,destination_account_id:s.destinationAccountId,amount:s.amount,
      transaction_date:s.date,note:s.note,created_at:s.createdAt,
    })),
    budgets: backup.budgets.map(b => ({
      id:b.id,year_month:b.yearMonth,overall_monthly_budget:b.overallMonthlyBudget,
      category_budgets:b.categoryBudgets,thresholds:b.thresholds,rollover_enabled:b.rolloverEnabled,
      created_at:b.createdAt,updated_at:b.updatedAt,
    })),
    recurring: backup.recurring.map(r => ({
      id:r.id,description:r.description,amount:r.amount,type:r.type,category:r.category,
      source_account_id:r.sourceAccountId,payment_method:r.paymentMethod,frequency:r.frequency,
      start_date:r.startDate,next_due_date:r.nextDueDate,is_active:r.isActive,
      created_at:r.createdAt,updated_at:r.updatedAt,
    })),
    occurrences: backup.occurrences.map(o => ({
      id:o.id,recurring_id:o.recurringId,due_date:o.dueDate,status:o.status,
      transaction_id:o.transactionId ?? null,processed_at:o.processedAt ?? null,
    })),
    preferences: backup.preferences,
  };
}

/**
 * Explicit, repeatable import. It never clears localStorage and uses stable IDs
 * so a retry upserts the same rows instead of creating duplicates.
 */
export async function importLocalFinanceData(): Promise<FinanceImportResult> {
  const backup = await localFinanceRepository.exportFullBackup();
  if (!backup.accounts.length && !backup.transactions.length) {
    throw new Error('No local Spendly data was found to import.');
  }

  const payload = toDatabaseBackup(backup);
  const { error } = await supabase.rpc('import_finance_backup', { p_backup: payload });
  if (error) throw new Error(`Could not import finance data: ${error.message}`);

  const { error: splitError } = await supabase.rpc('import_transaction_splits', {
    p_splits: payload.transactionSplits,
  });
  if (splitError) throw new Error(`Finance records were imported, but split payments need retrying: ${splitError.message}`);

  const [{ count: accountCount, error: accountError }, { count: transactionCount, error: transactionError }] = await Promise.all([
    supabase.from('accounts').select('id', { count: 'exact', head: true }),
    supabase.from('transactions').select('id', { count: 'exact', head: true }),
  ]);
  if (accountError) throw accountError;
  if (transactionError) throw transactionError;
  if ((accountCount ?? 0) < backup.accounts.length || (transactionCount ?? 0) < backup.transactions.length) {
    throw new Error('Import verification did not match the local account and transaction totals. Your local data is still intact; retry the import.');
  }

  return { accounts: backup.accounts.length, transactions: backup.transactions.length, splits: payload.transactionSplits.length };
}

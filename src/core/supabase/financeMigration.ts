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
    notifications: (backup.notifications ?? []).map(n => ({
      id:n.id,type:n.type,title:n.title,message:n.message,notification_date:n.date,
      is_read:n.isRead,is_dismissed:n.isDismissed,action_url:n.actionUrl ?? null,
      metadata:n.metadata ?? null,created_at:n.createdAt,
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
  if (!backup.accounts.length && !backup.transactions.length && !backup.savingsPots.length) {
    throw new Error('No local Spendly data was found to import.');
  }

  const payload = toDatabaseBackup(backup);
  const { error } = await supabase.rpc('import_finance_backup', { p_backup: payload });
  if (error) throw new Error(`Could not import finance data: ${error.message}`);

  // Verify the exact imported IDs in every table, not just aggregate user totals.
  // This also makes retries safe when the user already has cloud records.
  const checks: Array<{ table: string; ids: string[] }> = [
    { table: 'accounts', ids: payload.accounts.map(row => row.id) },
    { table: 'transactions', ids: payload.transactions.map(row => row.id) },
    { table: 'transaction_splits', ids: payload.transactionSplits.map(row => row.id) },
    { table: 'transfers', ids: payload.transfers.map(row => row.id) },
    { table: 'ledger_entries', ids: payload.ledgerEntries.map(row => row.id) },
    { table: 'savings_pots', ids: payload.savingsPots.map(row => row.id) },
    { table: 'savings_contributions', ids: payload.savingsContributions.map(row => row.id) },
    { table: 'savings_withdrawals', ids: payload.savingsWithdrawals.map(row => row.id) },
    { table: 'budgets', ids: payload.budgets.map(row => row.id) },
    { table: 'recurring_transactions', ids: payload.recurring.map(row => row.id) },
    { table: 'recurring_occurrences', ids: payload.occurrences.map(row => row.id) },
    { table: 'financial_notifications', ids: payload.notifications.map(row => row.id) },
  ];

  for (const check of checks) {
    if (check.ids.length === 0) continue;
    const { count, error: verifyError } = await supabase
      .from(check.table)
      .select('id', { count: 'exact', head: true })
      .in('id', check.ids);
    if (verifyError) throw new Error(`Import verification failed for ${check.table}: ${verifyError.message}`);
    if ((count ?? 0) !== check.ids.length) {
      throw new Error(`Import verification for ${check.table} expected ${check.ids.length} records but found ${count ?? 0}. Your local data is still intact; retry the import.`);
    }
  }

  const { data: savedPreferences, error: preferenceError } = await supabase
    .from('user_preferences')
    .select('theme,currency,allow_overdraft,default_account_id,notifications_enabled,savings_reminder_enabled,savings_reminder_frequency,last_savings_reminder_date,reduced_motion')
    .maybeSingle();
  if (preferenceError) throw preferenceError;
  if (!savedPreferences) {
    throw new Error('Import verification could not find your preferences. Your local data is still intact; retry the import.');
  }

  const expectedPreferences = backup.preferences;
  const preferenceMatches =
    savedPreferences.theme === expectedPreferences.theme &&
    savedPreferences.currency === expectedPreferences.currency &&
    savedPreferences.allow_overdraft === expectedPreferences.allowOverdraft &&
    savedPreferences.default_account_id === (expectedPreferences.defaultAccountId ?? null) &&
    savedPreferences.notifications_enabled === expectedPreferences.notificationsEnabled &&
    savedPreferences.savings_reminder_enabled === expectedPreferences.savingsReminderEnabled &&
    savedPreferences.savings_reminder_frequency === expectedPreferences.savingsReminderFrequency &&
    savedPreferences.last_savings_reminder_date === (expectedPreferences.lastSavingsReminderDate ?? null) &&
    savedPreferences.reduced_motion === expectedPreferences.reducedMotion;

  if (!preferenceMatches) {
    throw new Error('Import verification found a preferences mismatch. Your local data is still intact; retry the import.');
  }

  return { accounts: backup.accounts.length, transactions: backup.transactions.length, splits: payload.transactionSplits.length };
}

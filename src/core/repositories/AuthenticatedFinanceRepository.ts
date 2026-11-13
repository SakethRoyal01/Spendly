import type { FinanceRepository } from './FinanceRepository';
import { localFinanceRepository } from './LocalFinanceRepository';
import { supabase } from '../supabase/client';

/**
 * Local-first finance repository with a private per-user cloud backup.
 * The first authenticated session claims the existing browser dataset; later
 * sessions restore that user's snapshot before rendering the finance UI.
 */
let initialization: Promise<void> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function getAuthenticatedUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Sign in is required to access finance data.');
  return data.user.id;
}

async function persistSnapshot(userId: string): Promise<void> {
  const backup = await localFinanceRepository.exportFullBackup();
  const { error } = await supabase
    .from('user_finance_snapshots')
    .upsert({ user_id: userId, backup, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw new Error(`Could not sync your finance data: ${error.message}`);
}

async function initializeForCurrentUser(): Promise<void> {
  if (initialization) return initialization;

  initialization = (async () => {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('user_finance_snapshots')
      .select('backup')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(`Could not load your cloud finance data: ${error.message}`);

    if (data?.backup) {
      await localFinanceRepository.importFullBackup(data.backup);
      await localFinanceRepository.initialize();
    } else {
      await localFinanceRepository.initialize();
      // Preserve existing browser data by creating the first private snapshot.
      await persistSnapshot(userId);
    }
  })().catch((error) => {
    initialization = null;
    throw error;
  });

  return initialization;
}

const readOnlyMethods = new Set([
  'getAccounts', 'getAccountById', 'getTransactions', 'getTransactionById',
  'getTransfers', 'getSavingsPots', 'getBudgets', 'getBudgetByMonth',
  'getRecurring', 'getOccurrences', 'getNotifications', 'getPreferences',
  'getLedgerEntries', 'exportFullBackup',
]);

export const financeRepository = new Proxy(localFinanceRepository as FinanceRepository, {
  get(target, property, receiver) {
    if (property === 'initialize') return initializeForCurrentUser;

    const value = Reflect.get(target, property, receiver);
    if (typeof value !== 'function') return value;

    return async (...args: unknown[]) => {
      await initializeForCurrentUser();
      const result = await value.apply(target, args);

      if (typeof property === 'string' && !readOnlyMethods.has(property)) {
        const userId = await getAuthenticatedUserId();
        // Serialize writes so rapid successive edits cannot overwrite a newer
        // browser snapshot with an older one.
        writeQueue = writeQueue.then(() => persistSnapshot(userId));
        await writeQueue;
      }

      return result;
    };
  },
}) as FinanceRepository & { initialize(): Promise<void> };

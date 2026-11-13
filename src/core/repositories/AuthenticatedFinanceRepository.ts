import type { FinanceRepository } from './FinanceRepository';
import { localFinanceRepository } from './LocalFinanceRepository';
import { supabase } from '../supabase/client';
import type { FullBackupData } from '../../types/finance';

type RepositoryWithInitialize = FinanceRepository & { initialize: () => Promise<void> };

let initializedForUser: string | null = null;
let persistenceQueue: Promise<void> = Promise.resolve();

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(`Could not verify your Spendly session: ${error.message}`);
  if (!data.user) throw new Error('Please sign in again to access your financial data.');
  return data.user.id;
}

async function saveSnapshot(userId: string): Promise<void> {
  const backup: FullBackupData = await localFinanceRepository.exportFullBackup();
  const { error } = await supabase
    .from('user_finance_snapshots')
    .upsert(
      { user_id: userId, data: backup, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) throw new Error(`Your change could not be saved to your account: ${error.message}`);
}

async function loadUserSnapshot(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('user_finance_snapshots')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Could not load your account data: ${error.message}`);

  // Never adopt another account's browser cache. Replace it before loading this
  // user's cloud data; a first-time user starts with an empty finance workspace.
  await localFinanceRepository.clearAllData();

  if (data?.data) {
    await localFinanceRepository.importFullBackup(data.data as FullBackupData);
  } else {
    // LocalFinanceRepository creates the app's default zero-balance wallets.
    await localFinanceRepository.initialize();
    await saveSnapshot(userId);
  }
}

async function initializeForCurrentUser(): Promise<void> {
  const userId = await requireUserId();
  if (initializedForUser === userId) return;
  await loadUserSnapshot(userId);
  initializedForUser = userId;
}

const readOnlyMethods = new Set<PropertyKey>([
  'getAccounts', 'getAccountById', 'getTransactions', 'getTransactionById',
  'getTransfers', 'getSavingsPots', 'getBudgets', 'getBudgetByMonth',
  'getRecurring', 'getOccurrences', 'getNotifications', 'getPreferences',
  'getLedgerEntries', 'exportFullBackup',
]);

/**
 * Cloud-backed repository adapter.
 *
 * The existing finance domain remains unchanged. After each successful write,
 * the complete backup is persisted to a row owned by auth.uid(). RLS prevents
 * a client from reading or writing another user's snapshot.
 */
export const financeRepository: RepositoryWithInitialize = new Proxy(
  localFinanceRepository as RepositoryWithInitialize,
  {
    get(target, property) {
      if (property === 'initialize') return initializeForCurrentUser;

      const member = Reflect.get(target, property, target);
      if (typeof member !== 'function') return member;
      if (readOnlyMethods.has(property)) return member.bind(target);

      return async (...args: unknown[]) => {
        await initializeForCurrentUser();
        const result = await member.apply(target, args);

        // Serialize snapshots so rapid consecutive actions cannot overwrite a
        // newer state with an older export.
        const userId = await requireUserId();
        persistenceQueue = persistenceQueue.then(() => saveSnapshot(userId));
        await persistenceQueue;
        return result;
      };
    },
  }
);

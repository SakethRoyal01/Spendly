import { localFinanceRepository } from './LocalFinanceRepository';

/**
 * Spendly currently runs in local-only mode.
 *
 * Finance records remain in this browser's local storage and are not claimed,
 * imported, or synced to any authenticated account. Users can later choose
 * when to restore/import a backup as part of the dedicated sync flow.
 */
export const financeRepository = localFinanceRepository;

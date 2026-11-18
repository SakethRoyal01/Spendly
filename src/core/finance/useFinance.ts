import { useContext } from 'react';
import { FinanceContext } from './financeContextInstance';
import type { FinanceContextType } from './financeContextInstance';

export function useFinance(): FinanceContextType {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}

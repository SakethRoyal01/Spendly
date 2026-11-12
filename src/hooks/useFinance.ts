import { useContext } from 'react';
import { FinanceContext, type FinanceContextType } from '../context/financeContextInstance';

export function useFinance(): FinanceContextType {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}


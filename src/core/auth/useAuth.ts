import { useContext } from 'react';
import { AuthContext } from './AuthContextInstance';
import type { AuthContextValue } from './AuthContextInstance';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

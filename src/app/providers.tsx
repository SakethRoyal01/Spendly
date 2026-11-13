import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../shared/theme/ThemeContext';
import { AuthProvider, useAuth } from '../core/auth/AuthContext';
import { FinanceProvider } from '../core/finance/FinanceContext';
import { NavigationProvider } from '../shared/navigation/NavigationContext';
import { AuthPage } from '../features/auth/AuthPage';

const SessionGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-[#090b10] text-white grid place-items-center text-sm text-white/60">Loading your secure session…</div>;
  }

  if (!user || location.pathname === '/auth') return <AuthPage />;

  // Local-only mode: authentication gates the app, but local finance records
  // are not bound to this account or uploaded to Supabase.
  return (
    <FinanceProvider>
      <NavigationProvider>{children}</NavigationProvider>
    </FinanceProvider>
  );
};

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <SessionGate>{children}</SessionGate>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

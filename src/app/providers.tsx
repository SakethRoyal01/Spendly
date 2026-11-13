import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../shared/theme/ThemeContext';
import { FinanceProvider } from '../core/finance/FinanceContext';
import { NavigationProvider } from '../shared/navigation/NavigationContext';
import { AuthProvider, useAuth } from '../core/auth/AuthContext';
import { AuthPage } from '../features/auth/AuthPage';

interface AppProvidersProps { children: React.ReactNode; }

const AuthenticatedApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen bg-[#090b10] text-white grid place-items-center text-sm text-white/60">Loading your secure session…</div>;
  if (!user || location.pathname === '/auth') return <AuthPage />;

  return <FinanceProvider><NavigationProvider>{children}</NavigationProvider></FinanceProvider>;
};

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <AuthenticatedApp>{children}</AuthenticatedApp>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

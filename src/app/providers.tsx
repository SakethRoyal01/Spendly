import React, { useEffect, useState } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../shared/theme/ThemeContext';
import { AuthProvider, useAuth } from '../core/auth/AuthContext';
import { FinanceProvider } from '../core/finance/FinanceContext';
import { AuthPage } from '../features/auth/AuthPage';

const LOCAL_DATA_OWNER_KEY = 'spendly:local-finance-owner';

const SessionGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const [ownerStatus, setOwnerStatus] = useState<'checking' | 'allowed' | 'blocked'>('checking');

  useEffect(() => {
    if (!user) {
      setOwnerStatus('checking');
      return;
    }

    // Local finance records are currently browser-resident. Bind this browser's
    // existing dataset to its first authenticated account so another account
    // cannot accidentally see or modify those records on the same browser.
    try {
      const existingOwner = window.localStorage.getItem(LOCAL_DATA_OWNER_KEY);
      if (!existingOwner) {
        window.localStorage.setItem(LOCAL_DATA_OWNER_KEY, user.id);
        setOwnerStatus('allowed');
      } else {
        setOwnerStatus(existingOwner === user.id ? 'allowed' : 'blocked');
      }
    } catch {
      // Fail closed: do not expose locally stored finance records if ownership
      // cannot be checked reliably.
      setOwnerStatus('blocked');
    }
  }, [user?.id]);

  if (loading) {
    return <div className="min-h-screen bg-[#090b10] text-white grid place-items-center text-sm text-white/60">Loading your secure session…</div>;
  }

  if (!user || location.pathname === '/auth') return <AuthPage />;

  if (ownerStatus === 'checking') {
    return <div className="min-h-screen bg-[#090b10] text-white grid place-items-center text-sm text-white/60">Checking this device’s finance data…</div>;
  }

  if (ownerStatus === 'blocked') {
    return (
      <main className="min-h-screen bg-[#090b10] text-white flex items-center justify-center px-5 py-10">
        <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.035] p-8 sm:p-10">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">Device data protection</div>
          <h1 className="text-2xl font-semibold tracking-tight">This device is linked to another Spendly account.</h1>
          <p className="text-sm text-white/60 mt-3 leading-relaxed">
            Your local finance records are kept separate from other accounts on this browser. Sign in with the account originally used on this device. Cloud restore and account switching will be enabled after the finance sync integration is complete.
          </p>
          <button type="button" onClick={() => void signOut()} className="mt-6 w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold hover:bg-white/5">
            Sign out
          </button>
        </section>
      </main>
    );
  }

  return <FinanceProvider>{children}</FinanceProvider>;
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

import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../shared/theme/ThemeContext';
import { AuthProvider, useAuth } from '../core/auth/AuthContext';
import { AuthPage } from '../features/auth/AuthPage';

interface AppProvidersProps { children: React.ReactNode; }

const AuthenticatedApp: React.FC<{ children: React.ReactNode }> = () => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-[#090b10] text-white grid place-items-center text-sm text-white/60">Loading your secure session…</div>;
  }

  if (!user || location.pathname === '/auth') return <AuthPage />;

  return (
    <main className="min-h-screen bg-[#090b10] text-white flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.035] p-8 sm:p-10">
        <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">Secure account</div>
        <h1 className="text-2xl font-semibold tracking-tight">You’re signed in.</h1>
        <p className="text-sm text-white/60 mt-2">{user.email}</p>
        <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-medium">Your finance data is being connected.</p>
          <p className="text-sm text-white/55 mt-2 leading-relaxed">
            Spendly’s sign-in is ready, and the private database schema is in place. I’m completing the user-scoped finance repository and safe import of your existing browser data before enabling the dashboard. Your existing records are being left untouched.
          </p>
        </div>
        <button type="button" onClick={() => void signOut()} className="mt-6 w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold hover:bg-white/5">
          Sign out
        </button>
      </section>
    </main>
  );
};

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <AuthenticatedApp>{children}</AuthenticatedApp>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

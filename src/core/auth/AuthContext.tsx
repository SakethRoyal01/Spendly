import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (fullName: string, phone: string, email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  verifySignupOtp: (email: string, token: string) => Promise<void>;
  resendSignupOtp: (email: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Expire a remembered session after seven days without activity on this device.
  // Each device tracks its own activity so multi-device sign-in remains supported.
  useEffect(() => {
    if (!session?.user?.id || loading) return;

    const key = `spendly:last-active:${session.user.id}`;
    const now = Date.now();
    let lastActive = now;

    try {
      const stored = Number(window.localStorage.getItem(key));
      if (Number.isFinite(stored) && stored > 0) lastActive = stored;
    } catch {
      // If browser storage is unavailable, keep the active Supabase session.
    }

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (now - lastActive > sevenDaysMs) {
      void supabase.auth.signOut();
      return;
    }

    const recordActivity = () => {
      try {
        window.localStorage.setItem(key, String(Date.now()));
      } catch {
        // Session persistence remains managed by Supabase if storage is restricted.
      }
    };

    recordActivity();
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }));
    return () => events.forEach((event) => window.removeEventListener(event, recordActivity));
  }, [session?.user?.id, loading]);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('[Auth] Failed to restore session:', error.message);
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (fullName: string, phone: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim(), phone: phone.trim() } },
    });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session };
  }, []);

  const verifySignupOtp = useCallback(async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.replace(/\\s/g, ''),
      type: 'signup',
    });
    if (error) throw error;
  }, []);

  const resendSignupOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
    });
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const redirectTo = `${window.location.origin}/auth?mode=reset`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    loading,
    signUp,
    verifySignupOtp,
    resendSignupOtp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  }), [session, loading, signUp, verifySignupOtp, resendSignupOtp, signIn, signOut, resetPassword, updatePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

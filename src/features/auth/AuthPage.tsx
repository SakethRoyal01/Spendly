import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Wallet } from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';

type Mode = 'signin' | 'signup' | 'forgot' | 'reset';

export const AuthPage: React.FC = () => {
  const { signIn, signUp, resetPassword, updatePassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'reset' ? 'reset' : 'signin');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'signup') {
        if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
        if (fullName.trim().length < 2) throw new Error('Enter your full name.');
        if (!/^\\+?[0-9\\s()-]{7,20}$/.test(phone.trim())) throw new Error('Enter a valid phone number.');
        const result = await signUp(fullName, phone, email, password);
        if (result.needsEmailConfirmation) {
          setMessage('Account created. Check your inbox and confirm your email before signing in.');
        } else {
          navigate('/', { replace: true });
        }
      } else if (mode === 'signin') {
        await signIn(email, password);
        navigate('/', { replace: true });
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setMessage('If an account exists for that email, a password reset link has been sent.');
      } else {
        if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
        if (password !== confirmPassword) throw new Error('The passwords do not match.');
        await updatePassword(password);
        setMessage('Password updated. You can continue to Spendly.');
        navigate('/', { replace: true });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const title = mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : mode === 'reset' ? 'Choose a new password' : 'Welcome back';
  const description = mode === 'signup' ? 'Your finances, securely synced across devices.' : mode === 'forgot' ? 'We’ll send you a secure password reset link.' : mode === 'reset' ? 'Choose a strong password for your account.' : 'Sign in to continue to your financial overview.';

  return (
    <main className="min-h-screen bg-[#090b10] text-white flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white mb-10"><ArrowLeft size={16} /> Back to Spendly</Link>
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7 sm:p-9 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-white text-black grid place-items-center"><Wallet size={21} /></div>
            <span className="text-xl font-semibold tracking-tight">Spendly</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-white/55 mt-2 mb-7">{description}</p>
          <form onSubmit={submit} className="space-y-4">
            {mode !== 'reset' && <label className="block text-sm text-white/70">Email address<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#F05010]" placeholder="you@example.com" /></label>}
            {mode !== 'forgot' && <label className="block text-sm text-white/70">Password<input required type="password" autoComplete={mode === 'signup' || mode === 'reset' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-white/35" placeholder="At least 8 characters" minLength={8} /></label>}
            {mode === 'reset' && <label className="block text-sm text-white/70">Confirm password<input required type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-white/35" /></label>}
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            {message && <p role="status" className="text-sm text-emerald-400">{message}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-white text-black font-semibold py-3.5 hover:bg-white/90 disabled:opacity-60 flex justify-center items-center gap-2">
              {busy && <Loader2 size={17} className="animate-spin" />}
              {mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : mode === 'reset' ? 'Update password' : 'Sign in'}
            </button>
          </form>
          <div className="flex flex-wrap justify-between gap-3 text-sm text-white/55 mt-6">
            {mode === 'signin' && <><button onClick={() => { setMode('forgot'); setError(''); setMessage(''); }} className="hover:text-white">Forgot password?</button><button onClick={() => { setMode('signup'); setError(''); setMessage(''); }} className="hover:text-white">Create account</button></>}
            {mode !== 'signin' && <button onClick={() => { setMode('signin'); setError(''); setMessage(''); }} className="hover:text-white">Back to sign in</button>}
          </div>
        </div>
        <p className="text-center text-xs text-white/30 mt-6">Your financial data is private to your account.</p>
      </section>
    </main>
  );
};

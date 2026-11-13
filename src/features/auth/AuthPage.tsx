import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Wallet,
  ShieldCheck, Sparkles, Mail, LockKeyhole, UserRound, Phone,
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';

type Mode = 'signin' | 'signup' | 'verify' | 'forgot' | 'reset';

const inputClass = 'w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] py-3.5 pl-11 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none transition-all focus:border-[#F05010] focus:ring-4 focus:ring-[#F05010]/10';
const labelClass = 'mb-2 block text-xs font-semibold tracking-wide text-[var(--text-secondary)]';

export const AuthPage: React.FC = () => {
  const { signIn, signUp, verifySignupOtp, resendSignupOtp, resetPassword, updatePassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'reset' ? 'reset' : 'signin');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const changeMode = (next: Mode) => {
    setMode(next);
    setError('');
    setMessage('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setShowPassword(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'signup') {
        if (fullName.trim().length < 2) throw new Error('Please enter your full name.');
        const phoneValue = phone.trim();
        const phoneDigits = phoneValue.replace(/\D/g, '');
        if (!/^\+?[\d\s().-]+$/.test(phoneValue) || phoneDigits.length < 7 || phoneDigits.length > 15) {
          throw new Error('Please enter a valid phone number (7–15 digits).');
        }
        if (password.length < 8) throw new Error('Your password must contain at least 8 characters.');
        const result = await signUp(fullName, phone, email, password);
        if (result.needsEmailConfirmation) {
          setMode('verify');
          setMessage('We sent an 8-digit verification code to your email. Enter it below to activate your account.');
        } else {
          navigate('/', { replace: true });
        }
      } else if (mode === 'verify') {
        if (!/^\d{8}$/.test(otp.trim())) throw new Error('Enter the 8-digit code from your email.');
        await verifySignupOtp(email, otp.trim());
        navigate('/', { replace: true });
      } else if (mode === 'signin') {
        await signIn(email, password);
        navigate('/', { replace: true });
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setMessage('If an account exists for that email, a password reset link has been sent.');
      } else {
        if (password.length < 8) throw new Error('Your password must contain at least 8 characters.');
        if (password !== confirmPassword) throw new Error('The passwords do not match.');
        await updatePassword(password);
        navigate('/', { replace: true });
      }
    } catch (cause) {
      const raw = cause instanceof Error ? cause.message : '';
      const normalized = raw.toLowerCase();
      if (normalized.includes('rate limit') || normalized.includes('email rate limit')) {
        setError('Too many verification emails have been requested recently. Please wait before requesting another code, then check your inbox and spam folder.');
      } else if (normalized.includes('already registered') || normalized.includes('already been registered')) {
        setError('An account with this email already exists. Try signing in or use Forgot password.');
      } else if (normalized.includes('invalid login credentials')) {
        setError('The email or password is incorrect. Check your details and try again.');
      } else if (normalized.includes('password should be at least')) {
        setError('Choose a password with at least 8 characters.');
      } else if (raw) {
        setError(raw);
      } else {
        setError('Something went wrong. Please try again in a moment.');
      }
    } finally {
      setBusy(false);
    }
  };

  const isSignup = mode === 'signup';
  const isVerify = mode === 'verify';
  const title = isSignup ? 'Create your account' : isVerify ? 'Verify your email' : mode === 'forgot' ? 'Reset your password' : mode === 'reset' ? 'Set a new password' : 'Welcome back';
  const description = isSignup
    ? 'A clearer picture of your money starts here.'
    : isVerify ? `Enter the one-time code sent to ${email}.` : mode === 'forgot' ? 'We’ll send a secure link to get you back in.'
    : mode === 'reset' ? 'Choose a new password for your Spendly account.'
    : 'Your finances are right where you left them.';
  const primaryLabel = isSignup ? 'Create account' : isVerify ? 'Verify email' : mode === 'forgot' ? 'Send reset link' : mode === 'reset' ? 'Update password' : 'Sign in';

  const passwordField = (label: string, value: string, setter: (value: string) => void, autoComplete: string) => (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <span className="relative block">
        <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
        <input required type={showPassword ? 'text' : 'password'} autoComplete={autoComplete} minLength={8}
          value={value} onChange={e => setter(e.target.value)} className={inputClass}
          placeholder="At least 8 characters" />
        <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-disabled)] hover:text-[var(--text-primary)]">
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  );

  return (
    <main className="min-h-screen bg-[var(--bg-main)] px-4 py-6 sm:px-6 sm:py-10 text-[var(--text-primary)] flex items-center justify-center">
      <div className="w-full max-w-[980px]">
        <Link to="/" className="mb-5 inline-flex items-center gap-2 rounded-lg px-1 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[#F05010]">
          <ArrowLeft size={15} /> Back to Spendly
        </Link>

        <section className="grid overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[0_24px_80px_rgba(0,0,0,0.12)] md:min-h-[610px] md:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative hidden overflow-hidden bg-[#17191D] p-9 text-white md:flex md:flex-col md:justify-between lg:p-11">
            <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/[0.08]" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-[#F05010]/20" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F05010] text-white shadow-lg shadow-[#F05010]/20"><Wallet size={20} /></div>
              <span className="text-lg font-bold tracking-tight">Spendly<span className="text-[#F05010]">.</span></span>
            </div>
            <div className="relative z-10 max-w-sm">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/65">
                <Sparkles size={12} className="text-[#F05010]" /> Money, made clearer
              </div>
              <h2 className="font-display text-4xl font-bold leading-[1.12] tracking-tight lg:text-[42px]">Take control of your <span className="text-[#F05010]">money.</span></h2>
              <p className="mt-5 text-sm leading-7 text-white/55">One calm place to understand your spending, stay on top of your budgets, and make every decision count.</p>
            </div>
            <div className="relative z-10 flex items-center gap-2 text-[11px] text-white/40">
              <ShieldCheck size={15} className="text-[#F05010]" /> Your financial data stays private to your account.
            </div>
          </aside>

          <div className="flex items-center px-6 py-8 sm:px-10 sm:py-11 lg:px-14">
            <div className="mx-auto w-full max-w-[410px]">
              <div className="mb-8 flex items-center gap-3 md:hidden">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F05010] text-white"><Wallet size={20} /></div>
                <span className="text-lg font-bold tracking-tight">Spendly<span className="text-[#F05010]">.</span></span>
              </div>
              <div className="mb-7">
                <span className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F05010]">
                  <span className="h-px w-5 bg-[#F05010]" /> {isSignup ? 'Get started' : mode === 'signin' ? 'Your workspace' : 'Account access'}
                </span>
                <h1 className="font-display text-[27px] font-bold tracking-tight sm:text-[30px]">{title}</h1>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                {isSignup && <>
                  <label className="block">
                    <span className={labelClass}>Full name</span>
                    <span className="relative block"><UserRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
                      <input required type="text" autoComplete="name" minLength={2} maxLength={120} value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} placeholder="Your full name" />
                    </span>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Phone number</span>
                    <span className="relative block"><Phone size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
                      <input required type="tel" autoComplete="tel" maxLength={32} value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="+91 98765 43210" />
                    </span>
                  </label>
                </>}
                {isVerify && <label className="block">
                  <span className={labelClass}>8-digit email code</span>
                  <input required inputMode="numeric" autoComplete="one-time-code" type="text" pattern="[0-9]{8}" maxLength={8}
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-[var(--text-primary)] outline-none transition-all focus:border-[#F05010] focus:ring-4 focus:ring-[#F05010]/10"
                    placeholder="00000000" />
                </label>}
                {!isVerify && mode !== 'reset' && <label className="block">
                  <span className={labelClass}>Email address</span>
                  <span className="relative block"><Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
                    <input required type="email" autoComplete="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
                  </span>
                </label>}
                {!isVerify && mode !== 'forgot' && passwordField('Password', password, setPassword, isSignup || mode === 'reset' ? 'new-password' : 'current-password')}
                {mode === 'reset' && passwordField('Confirm password', confirmPassword, setConfirmPassword, 'new-password')}

                {error && <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-3.5 py-3 text-xs leading-5 text-red-500">{error}</div>}
                {message && <div role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3.5 py-3 text-xs leading-5 text-emerald-600 dark:text-emerald-400">{message}</div>}

                <button type="submit" disabled={busy}
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F05010] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#F05010]/15 transition-all hover:-translate-y-0.5 hover:bg-[#dc460c] hover:shadow-xl hover:shadow-[#F05010]/20 focus:outline-none focus:ring-4 focus:ring-[#F05010]/20 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">
                  {busy ? <><Loader2 size={17} className="animate-spin" /> Please wait…</> : <>{primaryLabel}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
                {mode === 'signin' ? <>
                  <button type="button" onClick={() => changeMode('forgot')} className="transition-colors hover:text-[#F05010]">Forgot password?</button>
                  <button type="button" onClick={() => changeMode('signup')} className="font-bold text-[#F05010] transition-colors hover:text-[#d94308]">Create an account</button>
                </> : isVerify ? <>
                  <button type="button" disabled={busy} onClick={async () => {
                    setBusy(true); setError(''); setMessage('');
                    try { await resendSignupOtp(email); setMessage('A new verification code has been sent.'); }
                    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to resend the code. Please try again later.'); }
                    finally { setBusy(false); }
                  }} className="font-semibold text-[#F05010] transition-colors hover:text-[#d94308] disabled:opacity-50">Resend code</button>
                  <button type="button" onClick={() => changeMode('signin')} className="transition-colors hover:text-[#F05010]">Back to sign in</button>
                </> : <button type="button" onClick={() => changeMode('signin')} className="transition-colors hover:text-[#F05010]">← Back to sign in</button>}
              </div>
              <div className="mt-8 flex items-center justify-center gap-2 border-t border-[var(--border-subtle)] pt-5 text-[10px] text-[var(--text-disabled)]">
                <ShieldCheck size={13} /> Secure access to your personal finances
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

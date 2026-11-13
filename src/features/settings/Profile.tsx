import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, Mail, Phone, UserRound } from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { supabase } from '../../core/supabase/client';

type ProfileRecord = { full_name: string; phone: string; created_at: string };

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error: loadError } = await supabase
        .from('profiles')
        .select('full_name, phone, created_at')
        .eq('id', user.id)
        .maybeSingle();
      if (!active) return;
      if (loadError) {
        setError(loadError.message);
      } else {
        const profile = data as ProfileRecord | null;
        setFullName(profile?.full_name || String(user.user_metadata?.full_name || ''));
        setPhone(profile?.phone || String(user.user_metadata?.phone || ''));
        setCreatedAt(profile?.created_at || user.created_at);
      }
      setLoading(false);
    };
    void loadProfile();
    return () => { active = false; };
  }, [user]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (fullName.trim().length < 2) { setError('Enter your full name.'); return; }
    if (!/^\\+?[0-9\\s()-]{7,20}$/.test(phone.trim())) { setError('Enter a valid phone number.'); return; }
    setSaving(true);
    setError('');
    setSaved(false);
    const { error: saveError } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName.trim(),
      phone: phone.trim(),
      updated_at: new Date().toISOString(),
    });
    if (saveError) setError(saveError.message);
    else setSaved(true);
    setSaving(false);
  };

  const fieldClass = 'mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[#F05010]';
  const labelClass = 'block text-xs font-bold text-[var(--text-secondary)]';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="px-2">
        <Link to="/settings" className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[#F05010] transition-colors mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </Link>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#F05010] block">Your account</span>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1">Profile</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-2">Manage the personal details associated with your Spendly account.</p>
      </div>

      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F05010]/10 text-[#F05010] grid place-items-center">
            <UserRound className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-[var(--text-primary)] truncate">{fullName || 'Your profile'}</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Personal information</p>
          </div>
        </div>

        {loading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]"><Loader2 className="w-4 h-4 animate-spin" /> Loading profile…</div>
        ) : (
          <form onSubmit={saveProfile} className="space-y-5">
            <label className={labelClass}>Full name
              <span className="relative block"><UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" /><input required maxLength={120} value={fullName} onChange={e => setFullName(e.target.value)} className={fieldClass + ' pl-10'} placeholder="Your full name" /></span>
            </label>
            <label className={labelClass}>Email address
              <span className="relative block"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" /><input readOnly value={user?.email || ''} className={fieldClass + ' pl-10 opacity-70 cursor-not-allowed'} /></span>
              <span className="block mt-1.5 text-[10px] font-medium text-[var(--text-disabled)]">Your sign-in email is managed by account security.</span>
            </label>
            <label className={labelClass}>Phone number
              <span className="relative block"><Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" /><input required type="tel" maxLength={32} value={phone} onChange={e => setPhone(e.target.value)} className={fieldClass + ' pl-10'} placeholder="+91 98765 43210" /></span>
            </label>
            {createdAt && <div className="pt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">Member since <span className="font-bold text-[var(--text-primary)]">{new Date(createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>}
            {error && <p role="alert" className="text-xs font-medium text-red-500">{error}</p>}
            {saved && <p role="status" className="text-xs font-semibold text-emerald-500 flex items-center gap-2"><Check className="w-4 h-4" /> Profile updated successfully.</p>}
            <button disabled={saving} type="submit" className="w-full sm:w-auto rounded-xl bg-[#F05010] px-6 py-3 text-xs font-extrabold text-white hover:bg-[#d94308] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import { useFinance } from '../../core/finance/useFinance';
import { useTheme } from '../../shared/theme/useTheme';
import { ConfirmDialog } from '../../shared/components/ui/ConfirmDialog';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Download,
  Upload,
  Check,
  ShieldCheck,
  FileSpreadsheet,
  Database,
  RefreshCw,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const {
    transactions,
    preferences,
    updatePreferences,
    exportFullBackup,
    importFullBackup,
    clearAllData,
    showToast,
  } = useFinance();
  const { setTheme, isDark } = useTheme();
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      await clearAllData();
      setIsClearModalOpen(false);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDownloadBackup = async () => {
    const backup = await exportFullBackup();
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spendly-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Backup JSON downloaded successfully');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await importFullBackup(parsed);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Invalid backup JSON file', 'error');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Type', 'Date', 'Category', 'Description', 'Amount', 'PaymentMethod'];
    const rows = transactions.map((t) => [
      t.id,
      t.type,
      t.date,
      t.category,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.amount,
      t.paymentMethod,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spendly-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Transactions CSV exported');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Page Title */}
      <div className="px-2">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#F05010] block">
          Configuration
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-0.5">
          Settings
        </h1>
      </div>

      {/* 1. Appearance / Theme Section */}
      <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] font-extrabold text-[var(--text-disabled)]">
            Appearance
          </h2>
          <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">
            Choose your preferred interface theme
          </p>
        </div>

        <div className="p-1.5 rounded-2xl bg-[var(--bg-input)] grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`py-3 px-4 rounded-xl font-display text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              !isDark
                ? 'bg-[#F05010] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sun className="w-4 h-4 stroke-[2.5]" />
            <span>Light Mode</span>
            {!isDark && <Check className="w-3.5 h-3.5 stroke-[3] ml-1" />}
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`py-3 px-4 rounded-xl font-display text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isDark
                ? 'bg-[#F05010] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Moon className="w-4 h-4 stroke-[2.5]" />
            <span>Dark Mode</span>
            {isDark && <Check className="w-3.5 h-3.5 stroke-[3] ml-1" />}
          </button>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Reduced Motion Animations
          </span>
          <button
            type="button"
            onClick={() => updatePreferences({ reducedMotion: !preferences.reducedMotion })}
            className="w-12 h-6 rounded-full bg-[var(--bg-input)] p-0.5 flex items-center cursor-pointer transition-colors"
          >
            <div
              className={`w-5 h-5 rounded-full transition-transform ${
                preferences.reducedMotion ? 'bg-[#F05010] translate-x-6' : 'bg-[#484848]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Wallet & Overdraft Policy */}
      <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] font-extrabold text-[var(--text-disabled)]">
            Wallet Policy
          </h2>
          <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">
            Overdraft protection and balance rules
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-input)] flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[var(--text-primary)] block">
              Allow Overdrafts (Negative Balances)
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
              When disabled, expenses exceeding available wallet balances are strictly rejected.
            </span>
          </div>

          <button
            type="button"
            onClick={() => updatePreferences({ allowOverdraft: !preferences.allowOverdraft })}
            className="w-12 h-6 rounded-full bg-[var(--bg-surface)] p-0.5 flex items-center cursor-pointer transition-colors shrink-0 border border-[var(--border-subtle)]"
          >
            <div
              className={`w-5 h-5 rounded-full transition-transform ${
                preferences.allowOverdraft ? 'bg-[#F05010] translate-x-6' : 'bg-[#484848]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Notifications & Savings Reminders */}
      <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] font-extrabold text-[var(--text-disabled)]">
            Reminders & Alerts
          </h2>
          <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">
            In-app budget warnings and savings check-ins
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
            <span>In-App Notifications</span>
            <button
              type="button"
              onClick={() =>
                updatePreferences({ notificationsEnabled: !preferences.notificationsEnabled })
              }
              className="w-12 h-6 rounded-full bg-[var(--bg-input)] p-0.5 flex items-center cursor-pointer transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform ${
                  preferences.notificationsEnabled ? 'bg-[#F05010] translate-x-6' : 'bg-[#484848]'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
            <span>Savings Offline Spend Check-in</span>
            <select
              value={preferences.savingsReminderFrequency}
              onChange={(e) =>
                updatePreferences({
                  savingsReminderFrequency: e.target.value as 'daily' | 'weekly' | 'monthly',
                })
              }
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Data Backup, Export & Restore */}
      <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] font-extrabold text-[var(--text-disabled)]">
            Data Management
          </h2>
          <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">
            Export backups, restore data, and download reports
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Export Full Backup JSON */}
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="p-4 rounded-2xl bg-[var(--bg-input)] hover:bg-[#F05010] hover:text-white transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <Database className="w-5 h-5 text-[#F05010] group-hover:text-white transition-colors" />
              <Download className="w-4 h-4 opacity-70" />
            </div>
            <div>
              <span className="text-xs font-extrabold block">Full Backup (JSON)</span>
              <span className="text-[11px] opacity-75 block mt-0.5">
                Complete wallets, savings, and ledger
              </span>
            </div>
          </button>

          {/* Export Transactions CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-4 rounded-2xl bg-[var(--bg-input)] hover:bg-[#F05010] hover:text-white transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-5 h-5 text-[#F05010] group-hover:text-white transition-colors" />
              <Download className="w-4 h-4 opacity-70" />
            </div>
            <div>
              <span className="text-xs font-extrabold block">Transactions (CSV)</span>
              <span className="text-[11px] opacity-75 block mt-0.5">
                Export expenses & income to spreadsheet
              </span>
            </div>
          </button>
        </div>

        {/* Restore from Backup JSON */}
        <div className="pt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            disabled={isRestoring}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-4 rounded-2xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isRestoring ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#F05010]" />
            ) : (
              <Upload className="w-4 h-4 text-[#F05010]" />
            )}
            <span>Restore Data from Backup File</span>
          </button>
        </div>

        {/* Clear Data */}
        <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-red-500 block">Reset Spendly</span>
            <span className="text-[11px] text-[var(--text-disabled)] block">
              Permanently wipe local records and reset default wallets
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 text-xs font-bold transition-all cursor-pointer"
          >
            Clear Data
          </button>
        </div>
      </div>

      {/* Account session */}
      <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xs space-y-3">
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] font-extrabold text-[var(--text-disabled)]">Account</h2>
          <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">{user?.email}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Your Spendly session is secured by Supabase Auth.</p>
        </div>
        <button type="button" disabled={isSigningOut} onClick={async () => {
          setIsSigningOut(true);
          try { await signOut(); } catch (error) { showToast(error instanceof Error ? error.message : 'Could not sign out', 'error'); }
          finally { setIsSigningOut(false); }
        }} className="w-full py-3 px-4 rounded-2xl border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-input)] disabled:opacity-50">
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>

      {/* 5. Future Backend & Database Notice */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed space-y-1">
          <span className="font-bold text-[var(--text-primary)] block">
            Backend & Database Readiness (Supabase)
          </span>
          <p className="text-[var(--text-secondary)]">
            Spendly stores all your financial records locally with zero tracking. The architecture
            features atomic ledger interfaces, integer minor unit arithmetic, and domain separation
            prepared for upcoming multi-user Supabase PostgreSQL database synchronization.
          </p>
        </div>
      </div>

      {/* Clear Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isClearModalOpen}
        title="Reset All Financial Records?"
        message="This action will delete all expenses, income, virtual wallets, savings goals, and budgets. This cannot be undone."
        confirmLabel="Reset Everything"
        isDestructive={true}
        isLoading={isClearing}
        onConfirm={handleConfirmClear}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </motion.div>
  );
};

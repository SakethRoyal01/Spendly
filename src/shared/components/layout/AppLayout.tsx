import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../ui/ToastContainer';
import { NotificationDrawer } from '../../../features/settings/NotificationDrawer';
import { useTheme } from '../../theme/useTheme';
import { useFinance } from '../../../core/finance/useFinance';
import { Sun, Moon, Bell, Settings } from 'lucide-react';
import spendlyLogo from '../../../assets/logo.png';

export const AppLayout: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { unreadNotificationCount } = useFinance();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Permanent Desktop Left Vertical Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-5 py-3 bg-[var(--bg-main)] sticky top-0 z-30 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--bg-surface)] p-1 flex items-center justify-center shadow-xs border border-[var(--border-subtle)] overflow-hidden shrink-0">
              <img
                src={spendlyLogo}
                alt="Spendly Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)] lowercase">
              spendly
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setIsNotificationOpen(true)}
              className="relative p-2 rounded-full bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)] cursor-pointer"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4 text-[var(--text-secondary)]" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F05010] text-white text-[9px] font-extrabold flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Settings Gear Button (Opens dedicated /settings page) */}
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="p-2 rounded-full bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)] cursor-pointer"
              aria-label="Open settings"
            >
              <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)] cursor-pointer"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-[#F05010]" />
              ) : (
                <Moon className="w-4 h-4 text-[#F05010]" />
              )}
            </button>
          </div>
        </header>

        {/* Desktop Top Notification Bar */}
        <div className="hidden md:flex items-center justify-end px-8 pt-6 pb-2">
          <button
            type="button"
            onClick={() => setIsNotificationOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-input)] transition-colors cursor-pointer shadow-xs"
          >
            <div className="relative">
              <Bell className="w-4 h-4 text-[#F05010]" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#F05010] text-white text-[8px] font-extrabold flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </div>
            <span>Alerts</span>
          </button>
        </div>

        {/* Scrollable Center Canvas */}
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-4 sm:py-6 pb-32 md:pb-16">
          <Outlet />
        </main>
      </div>

      {/* Floating Bottom Pill Navigation on Mobile */}
      <MobileNav />

      {/* Slide-out Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

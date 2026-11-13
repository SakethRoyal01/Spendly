import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Calendar,
  Receipt,
  Wallet,
  PiggyBank,
  TrendingUp,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../theme/useTheme';
import { useNavigation } from '../../navigation/useNavigation';
import { motion } from 'framer-motion';
import spendlyLogo from '../../../assets/logo.png';

interface NavItem {
  id: string;
  path: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { id: 'expenses', path: '/expenses', name: 'Expenses', icon: Receipt },
  { id: 'overview', path: '/', name: 'Overview', icon: LayoutGrid },
  { id: 'calendar', path: '/calendar', name: 'Calendar', icon: Calendar },
  { id: 'wallets', path: '/wallets', name: 'Wallets', icon: Wallet },
  { id: 'savings', path: '/savings', name: 'Savings', icon: PiggyBank },
  { id: 'insights', path: '/insights', name: 'Insights', icon: TrendingUp },
];

export const Sidebar: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { activeSection, scrollToSection, isMainPage } = useNavigation();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 bg-[var(--bg-main)] p-6 select-none shrink-0 z-30 border-r border-[var(--border-subtle)]/60">
      {/* Brand Header with Official Spendly Logo */}
      <div className="flex items-center gap-3 px-2 py-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-[var(--bg-surface)] p-1.5 flex items-center justify-center shadow-xs border border-[var(--border-subtle)] shrink-0 overflow-hidden">
          <img
            src={spendlyLogo}
            alt="Spendly Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <span className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] lowercase flex items-center gap-1">
            spendly
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#F05010] block -mt-1">
            Finance OS
          </span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          const isItemActive = (() => {
            if (isMainPage) {
              if (item.id === 'overview') return activeSection === 'overview';
              if (item.id === 'expenses') return activeSection === 'expenses';
              return false;
            }
            return location.pathname === item.path;
          })();

          const handleClick = (e: React.MouseEvent) => {
            if (item.id === 'overview') {
              e.preventDefault();
              if (isMainPage) {
                scrollToSection('overview');
              } else {
                navigate('/#overview');
              }
            } else if (item.id === 'expenses') {
              e.preventDefault();
              if (isMainPage) {
                scrollToSection('expenses');
              } else {
                navigate('/#expenses');
              }
            }
          };

          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={handleClick}
              className={`w-full relative flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                isItemActive
                  ? 'bg-[#F05010] text-white shadow-sm font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0 stroke-[2.2]" />
              <span className="truncate">{item.name}</span>

              {isItemActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute right-3.5 w-1.5 h-1.5 rounded-full bg-white"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Controls: Settings + Theme Toggle & Status */}
      <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2.5">
        {/* Settings as a dedicated separate navigation item at the bottom */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-full relative flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-[#484848] text-white font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`
          }
        >
          <Settings className="w-5 h-5 shrink-0 stroke-[2.2]" />
          <span className="truncate">Settings</span>
        </NavLink>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            {isDark ? (
              <Sun className="w-5 h-5 text-[#F05010] stroke-[2.2]" />
            ) : (
              <Moon className="w-5 h-5 text-[#F05010] stroke-[2.2]" />
            )}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-disabled)] px-2 py-0.5 rounded-full bg-[var(--bg-input)]">
            {isDark ? 'Dark' : 'Light'}
          </span>
        </button>
      </div>
    </aside>
  );
};

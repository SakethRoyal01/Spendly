import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Receipt, Wallet, PiggyBank, TrendingUp } from 'lucide-react';
import { useNavigation } from '../../hooks/useNavigation';
import { motion } from 'framer-motion';

const MOBILE_NAV_ITEMS = [
  { id: 'expenses', path: '/expenses', name: 'Expenses', icon: Receipt },
  { id: 'overview', path: '/', name: 'Overview', icon: LayoutGrid },
  { id: 'wallets', path: '/wallets', name: 'Wallets', icon: Wallet },
  { id: 'savings', path: '/savings', name: 'Savings', icon: PiggyBank },
  { id: 'insights', path: '/insights', name: 'Insights', icon: TrendingUp },
];

export const MobileNav: React.FC = () => {
  const { activeSection, scrollToSection, isMainPage } = useNavigation();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="md:hidden fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none px-3 safe-area-pb">
      <nav className="pointer-events-auto bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl rounded-full p-1.5 flex items-center gap-1 backdrop-blur-md">
        {MOBILE_NAV_ITEMS.map((item) => {
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
              aria-label={item.name}
              title={item.name}
              className={`relative flex items-center justify-center transition-all duration-150 rounded-full cursor-pointer ${
                isItemActive
                  ? 'bg-[#484848] text-white px-4 py-2.5 shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2.5'
              }`}
            >
              <Icon className="w-5 h-5 stroke-[2.2]" />
              {isItemActive && (
                <motion.span
                  layoutId="mobile-nav-dot"
                  className="w-1.5 h-1.5 rounded-full bg-[#F05010] ml-1.5 inline-block shrink-0"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

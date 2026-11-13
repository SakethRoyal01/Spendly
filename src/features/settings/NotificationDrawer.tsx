import React from 'react';
import { useFinance } from '../../core/finance/useFinance';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  PiggyBank,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, dismissNotification } = useFinance();
  const navigate = useNavigate();

  const activeNotifs = notifications.filter((n) => !n.isDismissed);

  const getIcon = (type: string) => {
    switch (type) {
      case 'budget_threshold':
        return <AlertTriangle className="w-4 h-4 text-[#F05010]" />;
      case 'recurring_due':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'savings_reminder':
        return <PiggyBank className="w-4 h-4 text-[#E89878]" />;
      default:
        return <Bell className="w-4 h-4 text-[var(--text-secondary)]" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] z-50 p-6 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#F05010]" />
                <h3 className="font-display text-lg font-extrabold text-[var(--text-primary)]">
                  Notifications
                </h3>
                {activeNotifs.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F05010] text-white">
                    {activeNotifs.length}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                aria-label="Close notifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {activeNotifs.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
                  <p className="font-display text-sm font-bold text-[var(--text-primary)]">
                    All caught up!
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    No active budget alerts or overdue payments.
                  </p>
                </div>
              ) : (
                activeNotifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`p-3.5 rounded-2xl border transition-all space-y-1.5 cursor-pointer ${
                      n.isRead
                        ? 'bg-[var(--bg-input)] border-[var(--border-subtle)] opacity-75'
                        : 'bg-[var(--bg-surface)] border-[#F05010]/30 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getIcon(n.type)}
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          {n.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--text-disabled)] font-medium">
                        {n.date}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {n.message}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      {n.actionUrl ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            navigate(n.actionUrl!);
                          }}
                          className="flex items-center gap-1 font-bold text-[#F05010] hover:underline"
                        >
                          <span>Review</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span />
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(n.id);
                        }}
                        className="text-[var(--text-disabled)] hover:text-red-500 transition-colors p-1"
                        title="Dismiss alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Info, X } from 'lucide-react';
import { useExpenses } from '../../hooks/useExpenses';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useExpenses();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl backdrop-blur-md text-xs sm:text-sm bg-[var(--bg-page)] text-[var(--text-primary)] ${
                isSuccess
                  ? 'border-[var(--text-primary)]'
                  : isError
                  ? 'border-red-500/50 text-red-500'
                  : 'border-[var(--border-subtle)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isSuccess && <Check className="w-4 h-4 text-[var(--text-primary)] shrink-0" />}
                {isError && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                {!isSuccess && !isError && <Info className="w-4 h-4 text-[var(--text-muted)] shrink-0" />}
                <span className="font-medium">{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] ml-3 p-1 rounded-md hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

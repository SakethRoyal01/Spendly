
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '../../hooks/useFinance';
import spendlyLogo from '../../assets/logo.png';

interface PreloaderProps {
  minDurationMs?: number;
}

export const Preloader: React.FC<PreloaderProps> = ({
  minDurationMs = 1450,
}) => {
  const { isLoading } = useFinance();
  const [isDismissed, setIsDismissed] = useState(false);
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!isLoading && !isDismissed) {
      const elapsed = Date.now() - mountTimeRef.current;
      const remaining = Math.max(0, minDurationMs - elapsed);

      const timer = setTimeout(() => {
        setIsDismissed(true);
      }, remaining);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isDismissed, minDurationMs]);

  // Safety fallback: never keep the screen blocked indefinitely.
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsDismissed(true);
    }, 5000);

    return () => clearTimeout(safetyTimer);
  }, []);

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          key="spendly-app-preloader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.025,
            filter: 'blur(8px)',
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[var(--bg-main)] select-none"
          role="status"
          aria-live="polite"
          aria-busy={!isDismissed}
        >
          {/* Background atmosphere */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">

            {/* Ambient orange light */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 0.12, scale: 1 }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-[#F05010] blur-[120px]"
            />

            {/* Subtle grid */}
            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  'linear-gradient(var(--text-secondary) 1px, transparent 1px), linear-gradient(90deg, var(--text-secondary) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />

            {/* Corner details */}
            <div className="absolute top-8 left-8 w-8 h-8 border-t border-l border-[#F05010]/30" />
            <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-[#F05010]/30" />
            <div className="absolute bottom-8 left-8 w-8 h-8 border-b border-l border-[#F05010]/30" />
            <div className="absolute bottom-8 right-8 w-8 h-8 border-b border-r border-[#F05010]/30" />
          </div>

          {/* Main composition */}
          <div className="relative flex flex-col items-center">

            {/* Logo and orbital system */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.75,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center"
            >
              {/* Complete outer ring */}
              <motion.div
                className="absolute inset-0 rounded-full border border-[#F05010]/25"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 24,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              {/* Complete inner ring */}
              <svg
                className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)]"
                viewBox="0 0 160 160"
                aria-hidden="true"
              >
                <circle
                  cx="80"
                  cy="80"
                  r="69"
                  fill="none"
                  stroke="var(--border-subtle)"
                  strokeWidth="1.5"
                />

                <circle
                  cx="80"
                  cy="80"
                  r="69"
                  fill="none"
                  stroke="#F05010"
                  strokeWidth="2"
                  opacity="0.75"
                />
              </svg>

              {/* Orbiting orange dot */}
              <motion.div
                className="absolute inset-3"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#F05010] shadow-[0_0_14px_#F05010]" />
              </motion.div>

              {/* Second orbiting accent */}
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: -360 }}
                transition={{
                  duration: 11,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <div className="absolute bottom-5 right-5 w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] opacity-60" />
              </motion.div>

              {/* Logo card */}
              <motion.div
                animate={{
                  y: [0, -3, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[0_12px_45px_rgba(0,0,0,0.12)] p-4 flex items-center justify-center overflow-hidden"
              >
                <img
                  src={spendlyLogo}
                  alt="Spendly Logo"
                  className="w-full h-full object-contain pointer-events-none"
                />

                {/* Light sweep */}
                <motion.div
                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 pointer-events-none"
                  initial={{ x: '-160%' }}
                  animate={{ x: '260%' }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    repeatDelay: 1.2,
                    ease: 'easeInOut',
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Brand reveal */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-7 text-center"
            >
              <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.07em] text-[var(--text-primary)]">
                spendly<span className="text-[#F05010]">.</span>
              </h1>

              <motion.p
                initial={{ opacity: 0, letterSpacing: '0.12em' }}
                animate={{ opacity: 1, letterSpacing: '0.28em' }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="mt-2 text-[9px] sm:text-[10px] font-semibold uppercase text-[var(--text-secondary)]"
              >
                Your money. In perspective.
              </motion.p>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="mt-10 w-48 sm:w-52"
            >
              <div className="h-[3px] rounded-full bg-[var(--bg-input)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[#F05010]"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{
                    duration: 1.7,
                    ease: 'easeInOut',
                  }}
                />
              </div>

              <div className="flex items-center justify-between mt-3">
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  Initializing Spendly
                </span>

                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.3,
                    repeat: Infinity,
                  }}
                  className="flex gap-1"
                >
                  <span className="w-1 h-1 rounded-full bg-[#F05010]" />
                  <span className="w-1 h-1 rounded-full bg-[#F05010]" />
                  <span className="w-1 h-1 rounded-full bg-[#F05010]" />
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Bottom signature */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="absolute bottom-8 flex flex-col items-center gap-1"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--text-secondary)]">
              A clearer view of your finances
            </span>
            <span className="text-[8px] tracking-widest text-[var(--text-secondary)] opacity-60">
              SPEND SMARTER
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

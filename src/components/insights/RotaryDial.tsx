import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export interface RotaryOption {
  offset: number;
  shortLabel: string;
  fullLabel: string;
  subLabel?: string;
}

interface RotaryDialProps {
  options: RotaryOption[];
  currentOffset: number;
  onChangeOffset: (offset: number) => void;
  title?: string;
}

export const RotaryDial: React.FC<RotaryDialProps> = ({
  options,
  currentOffset,
  onChangeOffset,
  title = 'Period Selector',
}) => {
  const dialRef = useRef<SVGSVGElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectedIndex = Math.max(
    0,
    options.findIndex((opt) => opt.offset === currentOffset)
  );

  const currentOption = options[selectedIndex] || options[0];

  // Semicircular arc geometry
  // Angles in degrees: left is -150°, right is -30° (arc sweeping over top)
  const startAngle = -150;
  const endAngle = -30;
  const totalSpan = endAngle - startAngle; // 120 deg
  const stepAngle = options.length > 1 ? totalSpan / (options.length - 1) : 0;

  const currentAngle = startAngle + selectedIndex * stepAngle;

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.72; // Dial hub center

      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;

      let angleDeg = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
      // Normalize angle to top hemisphere
      if (angleDeg > 0) angleDeg -= 360;

      // Find closest notch
      let closestIdx = 0;
      let minDiff = Infinity;
      options.forEach((_, idx) => {
        const notchAngle = startAngle + idx * stepAngle;
        const diff = Math.abs(angleDeg - notchAngle);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });

      if (closestIdx !== selectedIndex) {
        onChangeOffset(options[closestIdx].offset);
      }
    },
    [options, selectedIndex, startAngle, stepAngle, onChangeOffset]
  );

  // Mouse drag handlers
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handlePointerMove]);

  // Touch drag handlers
  useEffect(() => {
    if (!isDragging) return;

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handlePointerMove]);

  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex < options.length - 1;

  const handlePrev = () => {
    if (canGoPrev) onChangeOffset(options[selectedIndex - 1].offset);
  };

  const handleNext = () => {
    if (canGoNext) onChangeOffset(options[selectedIndex + 1].offset);
  };

  const handleReset = () => {
    const zeroOpt = options.find((o) => o.offset === 0);
    if (zeroOpt) onChangeOffset(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'Home') {
      e.preventDefault();
      handleReset();
    }
  };

  // Center coordinates for SVG
  const cx = 130;
  const cy = 115;
  const radius = 80;

  return (
    <div
      className="bg-[var(--bg-surface)] rounded-3xl p-5 sm:p-6 border border-[var(--border-subtle)] shadow-xs flex flex-col items-center select-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-label={title}
      aria-valuemin={options[0]?.offset}
      aria-valuemax={options[options.length - 1]?.offset}
      aria-valuenow={currentOffset}
      aria-valuetext={currentOption?.fullLabel}
    >
      {/* Top Header & Reset */}
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--text-disabled)]">
          {title}
        </span>

        {currentOffset !== 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--bg-input)] text-[#F05010] hover:bg-[#F05010] hover:text-white transition-all cursor-pointer"
            title="Reset to current period"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Current</span>
          </button>
        )}
      </div>

      {/* Rotary Dial SVG Canvas */}
      <div className="relative flex flex-col items-center">
        <svg
          ref={dialRef}
          viewBox="0 0 260 145"
          className="w-56 sm:w-64 h-32 sm:h-36 cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={(e) => {
            setIsDragging(true);
            handlePointerMove(e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            setIsDragging(true);
            if (e.touches.length > 0) {
              handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
        >
          {/* Semicircular Guide Arc */}
          <path
            d="M 60.7 75 A 80 80 0 0 1 199.3 75"
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Active Highlight Arc segment */}
          {selectedIndex > 0 && (
            <path
              d={`M 60.7 75 A 80 80 0 0 1 ${
                cx + radius * Math.cos((currentAngle * Math.PI) / 180)
              } ${cy + radius * Math.sin((currentAngle * Math.PI) / 180)}`}
              fill="none"
              stroke="#F05010"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="opacity-60"
            />
          )}

          {/* Ticks and Notches */}
          {options.map((opt, idx) => {
            const angle = startAngle + idx * stepAngle;
            const rad = (angle * Math.PI) / 180;
            const isSelected = idx === selectedIndex;

            // Outer tick coordinates
            const x1 = cx + (radius - 2) * Math.cos(rad);
            const y1 = cy + (radius - 2) * Math.sin(rad);
            const x2 = cx + (radius + (isSelected ? 10 : 6)) * Math.cos(rad);
            const y2 = cy + (radius + (isSelected ? 10 : 6)) * Math.sin(rad);

            // Label coordinates
            const lx = cx + (radius + 22) * Math.cos(rad);
            const ly = cy + (radius + 22) * Math.sin(rad);

            return (
              <g
                key={opt.offset}
                className="cursor-pointer transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeOffset(opt.offset);
                }}
              >
                {/* Tick line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isSelected ? '#F05010' : 'var(--text-disabled)'}
                  strokeWidth={isSelected ? '3.5' : '2'}
                  strokeLinecap="round"
                />

                {/* Tick dot */}
                <circle
                  cx={x2}
                  cy={y2}
                  r={isSelected ? 3.5 : 1.5}
                  fill={isSelected ? '#F05010' : 'var(--text-disabled)'}
                />

                {/* Compact tick label */}
                <text
                  x={lx}
                  y={ly + 3}
                  textAnchor="middle"
                  className={`text-[9px] font-bold tracking-tight select-none ${
                    isSelected ? 'fill-[#F05010]' : 'fill-[var(--text-secondary)] opacity-80'
                  }`}
                >
                  {opt.shortLabel}
                </text>
              </g>
            );
          })}

          {/* Center Rotary Hub */}
          <circle
            cx={cx}
            cy={cy}
            r="38"
            fill="var(--bg-input)"
            stroke="var(--border-subtle)"
            strokeWidth="2"
            className="filter drop-shadow-xs"
          />

          <circle
            cx={cx}
            cy={cy}
            r="26"
            fill="var(--bg-surface)"
            stroke="var(--border-subtle)"
            strokeWidth="1.5"
          />

          {/* Needle / Indicator Line */}
          <g transform={`rotate(${currentAngle + 90}, ${cx}, ${cy})`}>
            {/* Triangular indicator needle */}
            <polygon
              points={`${cx - 3.5},${cy - 8} ${cx + 3.5},${cy - 8} ${cx},${cy - 35}`}
              fill="#F05010"
            />
            {/* Center pip */}
            <circle cx={cx} cy={cy} r="6" fill="#F05010" />
            <circle cx={cx} cy={cy} r="2.5" fill="#FFFFFF" />
          </g>
        </svg>

        {/* Selected Period Display Badge */}
        <div className="mt-1 text-center">
          <motion.div
            key={currentOption.fullLabel}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <span className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)] block">
              {currentOption.fullLabel}
            </span>
            {currentOption.subLabel && (
              <span className="text-xs font-semibold text-[var(--text-secondary)] block mt-0.5">
                {currentOption.subLabel}
              </span>
            )}
          </motion.div>
        </div>
      </div>

      {/* Accessible Stepper Pill Controls */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border-subtle)] w-full justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canGoPrev}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            canGoPrev
              ? 'bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[#F05010] hover:text-white'
              : 'opacity-40 cursor-not-allowed bg-[var(--bg-input)] text-[var(--text-disabled)]'
          }`}
          title="Previous period"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Earlier</span>
        </button>

        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)]">
          {selectedIndex + 1} of {options.length}
        </span>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            canGoNext
              ? 'bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[#F05010] hover:text-white'
              : 'opacity-40 cursor-not-allowed bg-[var(--bg-input)] text-[var(--text-disabled)]'
          }`}
          title="Next period"
        >
          <span>Later</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


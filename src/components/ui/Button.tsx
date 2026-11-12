import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold transition-all duration-150 rounded-full cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#F05010] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] shadow-xs';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-xs sm:text-sm px-5 py-2.5 gap-2 uppercase tracking-wider',
    lg: 'text-sm sm:text-base px-6 py-3 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#F05010] hover:bg-[#d94408] text-white shadow-xs',
    secondary:
      'bg-[var(--bg-input)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]',
    outline:
      'bg-transparent hover:bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-subtle)]',
    danger:
      'bg-red-500/15 hover:bg-red-500/25 text-red-500',
    ghost:
      'bg-transparent hover:bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-none',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        icon && <span className="inline-flex shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};

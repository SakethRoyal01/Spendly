import React from 'react';
import { getCategoryMeta } from '../../utils/categories';
import type { ExpenseCategory } from '../../../types/expense';

interface BadgeProps {
  category: ExpenseCategory | string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const CategoryBadge: React.FC<BadgeProps> = ({
  category,
  size = 'md',
  showIcon = false,
}) => {
  const meta = getCategoryMeta(category);
  const Icon = meta.icon;

  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md uppercase tracking-wider border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-secondary)] ${sizeClasses}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{meta.label}</span>
    </span>
  );
};

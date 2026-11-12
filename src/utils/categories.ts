import {
  Utensils,
  Car,
  ShoppingBag,
  GraduationCap,
  Film,
  Receipt,
  HeartPulse,
  Tag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ExpenseCategory } from '../types/expense';

export interface CategoryMeta {
  category: ExpenseCategory;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES_CONFIG: Record<ExpenseCategory, CategoryMeta> = {
  Food: {
    category: 'Food',
    label: 'Food & Dining',
    icon: Utensils,
  },
  Travel: {
    category: 'Travel',
    label: 'Travel & Transport',
    icon: Car,
  },
  Shopping: {
    category: 'Shopping',
    label: 'Shopping',
    icon: ShoppingBag,
  },
  Education: {
    category: 'Education',
    label: 'Education',
    icon: GraduationCap,
  },
  Entertainment: {
    category: 'Entertainment',
    label: 'Entertainment',
    icon: Film,
  },
  Bills: {
    category: 'Bills',
    label: 'Bills & Utilities',
    icon: Receipt,
  },
  Health: {
    category: 'Health',
    label: 'Health & Medical',
    icon: HeartPulse,
  },
  Other: {
    category: 'Other',
    label: 'Other',
    icon: Tag,
  },
};

export const ALL_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Travel',
  'Shopping',
  'Education',
  'Entertainment',
  'Bills',
  'Health',
  'Other',
];

export function getCategoryMeta(category: string): CategoryMeta {
  if (category in CATEGORIES_CONFIG) {
    return CATEGORIES_CONFIG[category as ExpenseCategory];
  }
  return CATEGORIES_CONFIG.Other;
}

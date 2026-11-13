import { createContext } from 'react';

export type SectionId = 'overview' | 'expenses' | 'calendar' | 'wallets' | 'savings' | 'insights' | 'settings';

export const SECTION_IDS: SectionId[] = ['overview', 'expenses', 'calendar', 'wallets', 'savings', 'insights', 'settings'];

export interface NavigationContextType {
  activeSection: string;
  scrollToSection: (id: string) => void;
  isMainPage: boolean;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

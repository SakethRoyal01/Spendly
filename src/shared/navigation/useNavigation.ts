import { useContext } from 'react';
import {
  NavigationContext,
  type NavigationContextType,
  type SectionId,
  SECTION_IDS,
} from './navigationContextInstance';

export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

export { type SectionId, SECTION_IDS };

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../shared/theme/ThemeContext';
import { FinanceProvider } from '../core/finance/FinanceContext';
import { NavigationProvider } from '../shared/navigation/NavigationContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <FinanceProvider>
        <BrowserRouter>
          <NavigationProvider>
            {children}
          </NavigationProvider>
        </BrowserRouter>
      </FinanceProvider>
    </ThemeProvider>
  );
};

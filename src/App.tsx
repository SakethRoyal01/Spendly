import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { ThemeProvider } from './context/ThemeContext';
import { NavigationProvider } from './context/NavigationContext';
import { AppLayout } from './components/layout/AppLayout';
import { Preloader } from './components/ui/Preloader';
import { Overview } from './pages/Overview';
import { CalendarView } from './pages/CalendarView';
import { Wallets } from './pages/Wallets';
import { Savings } from './pages/Savings';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';
import { TransactionHistory } from './pages/TransactionHistory';

export function App() {
  return (
    <ThemeProvider>
      <FinanceProvider>
        <ExpenseProvider>
          {/* Quick, elegant preloader on initial application boot */}
          <Preloader />
          <BrowserRouter>
            <NavigationProvider>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Overview />} />
                  <Route path="/overview" element={<Overview />} />
                  <Route path="/calendar" element={<CalendarView />} />
                  <Route path="/wallets" element={<Wallets />} />
                  <Route path="/savings" element={<Savings />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/transactions" element={<TransactionHistory />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </NavigationProvider>
          </BrowserRouter>
        </ExpenseProvider>
      </FinanceProvider>
    </ThemeProvider>
  );
}

export default App;

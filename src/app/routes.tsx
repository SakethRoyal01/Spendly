import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { Overview } from '../features/overview/Overview';
import { CalendarView } from '../features/calendar/CalendarView';
import { Wallets } from '../features/wallets/Wallets';
import { Savings } from '../features/savings/Savings';
import { Insights } from '../features/insights/Insights';
import { Settings } from '../features/settings/Settings';
import { Profile } from '../features/settings/Profile';
import { TransactionHistory } from '../features/transactions/TransactionHistory';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/expenses" element={<Overview />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/wallets" element={<Wallets />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/profile" element={<Profile />} />
        <Route path="/transactions" element={<TransactionHistory />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

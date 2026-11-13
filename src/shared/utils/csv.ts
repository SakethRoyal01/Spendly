import type { Expense } from '../../types';

/**
 * Converts expenses array into CSV text and triggers browser download
 */
export function exportExpensesToCSV(expenses: Expense[], filename = 'spendly_expenses.csv'): void {
  if (!expenses || expenses.length === 0) {
    alert('No expenses to export.');
    return;
  }

  const headers = ['Date', 'Category', 'Description', 'Amount (INR)', 'Created At', 'ID'];
  const rows = expenses.map((e) => [
    `"${e.date}"`,
    `"${e.category}"`,
    `"${(e.description || '').replace(/"/g, '""')}"`,
    e.amount.toFixed(2),
    `"${e.createdAt}"`,
    `"${e.id}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

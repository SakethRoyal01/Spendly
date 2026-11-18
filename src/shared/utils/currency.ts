/**
 * Currency utility functions for INR (₹) formatting and validation
 */

/**
 * Formats a number to Indian Rupee currency format (e.g. ₹80, ₹150 or ₹2,450.50)
 * Uses standard Indian numbering system (thousands, lakhs, crores)
 * Displays decimals only when present (or when explicitly requested)
 */
export function formatINR(amount: number, showDecimals?: boolean): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }

  const rounded = Math.round(amount * 100) / 100;
  const isNegative = rounded < 0;
  const absAmount = Math.abs(rounded);
  const hasDecimals = absAmount % 1 !== 0;

  const minDecimals = showDecimals !== undefined ? (showDecimals ? 2 : 0) : (hasDecimals ? 2 : 0);

  // Format with Indian locale
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: 2,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Formats compact INR for summary badges (e.g. ₹1.5K, ₹2.4L)
 */
export function formatCompactINR(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  }
  return `${sign}₹${abs.toFixed(0)}`;
}

/**
 * Validates whether an input represents a valid positive amount > 0
 */
export function isValidAmount(value: string | number): boolean {
  if (typeof value === 'number') {
    return !isNaN(value) && value > 0 && isFinite(value);
  }
  const clean = value.replace(/,/g, '').trim();
  if (!clean) return false;
  const num = Number(clean);
  return !isNaN(num) && num > 0 && isFinite(num);
}

/**
 * Parses a string input into a sanitized number or null
 */
export function parseAmount(value: string): number | null {
  const clean = value.replace(/,/g, '').trim();
  if (!clean) return null;
  const num = Number(clean);
  if (isNaN(num) || num <= 0 || !isFinite(num)) {
    return null;
  }
  return Math.round(num * 100) / 100;
}

/**
 * Converts a rupee amount to integer paise (minor currency unit)
 */
export function toPaise(rupees: number): number {
  return Math.round((rupees || 0) * 100);
}

/**
 * Converts integer paise to decimal rupees
 */
export function toRupees(paise: number): number {
  return (paise || 0) / 100;
}

/**
 * Exact addition of rupee amounts using integer paise arithmetic
 */
export function addRupees(...amounts: number[]): number {
  const totalPaise = amounts.reduce((sum, amt) => sum + toPaise(amt), 0);
  return toRupees(totalPaise);
}

/**
 * Exact subtraction of rupee amounts using integer paise arithmetic (a - b)
 */
export function subtractRupees(a: number, b: number): number {
  return toRupees(toPaise(a) - toPaise(b));
}

import React, { useState, useMemo } from 'react';
import { useFinance } from '../../core/finance/useFinance';
import type { ExpenseCategory } from '../../types/expense';
import type { PaymentMethod } from '../../types/finance';
import { formatINR } from '../../shared/utils/currency';
import { Sparkles, ArrowRight, Check } from 'lucide-react';

interface ParsedEntry {
  description: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
}

export const QuickAddBar: React.FC = () => {
  const { addExpense, accounts, selectedDate } = useFinance();
  const [input, setInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Intelligent parser for natural expressions like:
  // "Breakfast 80", "Uber 250 UPI", "Coffee 60 Cash", "Gym 1500"
  const parsed: ParsedEntry | null = useMemo(() => {
    const text = input.trim();
    if (!text) return null;

    const parts = text.split(/\s+/);
    let amount: number | null = null;
    let method: PaymentMethod = 'Not specified';
    const descParts: string[] = [];

    for (const part of parts) {
      const cleanPart = part.replace(/[₹,]/g, '');
      const num = Number(cleanPart);
      if (!isNaN(num) && num > 0 && amount === null) {
        amount = Math.round(num * 100) / 100;
      } else if (/^(upi|gpay|phonepe|paytm)$/i.test(part)) {
        method = 'UPI';
      } else if (/^(cash)$/i.test(part)) {
        method = 'Cash';
      } else if (/^(card|debit|credit)$/i.test(part)) {
        method = 'Debit Card';
      } else if (/^(transfer|neft|imps)$/i.test(part)) {
        method = 'Bank Transfer';
      } else {
        descParts.push(part);
      }
    }

    if (amount === null || amount <= 0) return null;

    const description = descParts.join(' ').trim() || 'Expense';
    const lowerDesc = description.toLowerCase();

    // Smart category inference based on description keyword
    let category: ExpenseCategory = 'Other';
    if (/(breakfast|lunch|dinner|coffee|tea|snack|food|burger|pizza|swiggy|zomato|grocery|restaurant)/i.test(lowerDesc)) {
      category = 'Food';
    } else if (/(uber|ola|cab|auto|bus|metro|train|flight|fuel|petrol|diesel|travel|parking)/i.test(lowerDesc)) {
      category = 'Travel';
    } else if (/(shirt|dress|shoes|amazon|flipkart|shopping|clothes|mall|store)/i.test(lowerDesc)) {
      category = 'Shopping';
    } else if (/(book|course|tuition|class|school|college|education|udemy)/i.test(lowerDesc)) {
      category = 'Education';
    } else if (/(movie|cinema|netflix|spotify|game|entertainment|party|concert)/i.test(lowerDesc)) {
      category = 'Entertainment';
    } else if (/(rent|bill|electricity|water|wifi|broadband|recharge|mobile|maintenance)/i.test(lowerDesc)) {
      category = 'Bills';
    } else if (/(medicine|doctor|hospital|clinic|pharma|health|gym|fitness)/i.test(lowerDesc)) {
      category = 'Health';
    }

    return {
      description,
      amount,
      category,
      paymentMethod: method,
    };
  }, [input]);

  const handleQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!parsed || isAdding) return;

    setIsAdding(true);
    try {
      let sourceAccId: string | null = null;
      if (parsed.paymentMethod === 'Cash') {
        sourceAccId = accounts.find((a) => a.type === 'cash')?.id || accounts[0]?.id || null;
      } else if (parsed.paymentMethod === 'UPI') {
        sourceAccId = accounts.find((a) => a.type === 'bank')?.id || accounts[0]?.id || null;
      } else if (parsed.paymentMethod !== 'Not specified') {
        sourceAccId = accounts[0]?.id || null;
      }

      await addExpense({
        userId: null,
        type: 'expense',
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description,
        date: selectedDate,
        paymentMethod: parsed.paymentMethod,
        sourceAccountId: sourceAccId,
      });

      setInput('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQuickAdd();
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] rounded-3xl p-4 sm:p-5 border border-[var(--border-subtle)] shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F05010]" />
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--text-disabled)]">
            Quick Add
          </span>
        </div>
        <span className="text-[10px] text-[var(--text-disabled)] font-bold">
          Press <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[10px]">Enter</kbd> to save
        </span>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder='Try typing: "Breakfast 80", "Uber 250 UPI", "Coffee 60 Cash"'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAdding}
          className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#F05010] pr-14 transition-all"
        />

        {parsed && (
          <button
            type="button"
            onClick={() => handleQuickAdd()}
            disabled={isAdding}
            className="absolute right-2 top-2 bottom-2 px-3.5 rounded-xl bg-[#F05010] text-white text-xs font-bold flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
            title="Save quick expense"
          >
            {isAdding ? <Check className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Live Parser Detection Pill */}
      {parsed && (
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] px-2">
          <span>Detected:</span>
          <span className="px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[var(--text-primary)]">
            {parsed.description}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#F05010]/15 text-[#F05010] font-display">
            {formatINR(parsed.amount)}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)]">
            {parsed.category}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[#F05010]">
            {parsed.paymentMethod}
          </span>
        </div>
      )}
    </div>
  );
};

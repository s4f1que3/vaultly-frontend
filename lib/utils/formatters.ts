import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { TransactionCategory } from '@/types';

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d');
}

export function formatDateFull(dateStr: string): string {
  return format(parseISO(dateStr), 'MMMM d, yyyy');
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

export function formatCardNumber(num: string): string {
  const cleaned = num.replace(/\D/g, '');
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
}

export function maskCardNumber(last4: string): string {
  return `•••• •••• •••• ${last4}`;
}

export function formatExpiry(month: string, year: string): string {
  return `${month.padStart(2, '0')}/${year.slice(-2)}`;
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  food: 'Food & Dining',
  transport: 'Transport',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  health: 'Health',
  utilities: 'Utilities',
  housing: 'Housing',
  education: 'Education',
  salary: 'Salary',
  investment: 'Investment',
  transfer: 'Transfer',
  other: 'Other',
  general: 'General',
};

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  food: '#f59e0b',
  transport: '#3b82f6',
  shopping: '#ec4899',
  entertainment: '#8b5cf6',
  health: '#10b981',
  utilities: '#06b6d4',
  housing: '#f97316',
  education: '#6366f1',
  salary: '#57c93c',
  investment: '#14b8a6',
  transfer: '#9c9585',
  other: '#5c5648',
  general: '#94a3b8',
};

export const CATEGORY_ICONS: Record<TransactionCategory, string> = {
  food: '🍔',
  transport: '🚗',
  shopping: '🛍️',
  entertainment: '🎬',
  health: '💊',
  utilities: '⚡',
  housing: '🏠',
  education: '📚',
  salary: '💰',
  investment: '📈',
  transfer: '🔄',
  other: '📦',
  general: '🗂️',
};

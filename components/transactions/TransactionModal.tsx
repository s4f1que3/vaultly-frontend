'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2, Scissors } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useCardStore } from '@/stores/useCardStore';
import { Transaction, TransactionCategory, BudgetImpact } from '@/types';
import { CATEGORY_LABELS, CATEGORY_ICONS, formatCurrency } from '@/lib/utils/formatters';
import { useCategoryStore } from '@/stores/useCategoryStore';
import api from '@/lib/api';

const schema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.string(),
  description: z.string().min(1, 'Required'),
  merchant: z.string().optional(),
  date: z.string().min(1, 'Required'),
  card_id: z.string().optional(),
  budget_impact: z.enum(['increase', 'decrease', 'none']).optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
}

const DEFAULT_CATEGORIES: TransactionCategory[] = [
  'food', 'transport', 'shopping', 'entertainment', 'health',
  'utilities', 'housing', 'education', 'salary', 'investment', 'transfer', 'other', 'general',
];

interface SplitRow {
  category: TransactionCategory;
  amount: number;
  note: string;
}

export default function TransactionModal({ isOpen, onClose, transaction }: Props) {
  const { addTransaction, updateTransaction } = useTransactionStore();
  const { cards, fetchCards } = useCardStore();
  const { customCategories, fetchCategories } = useCategoryStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [splits, setSplits] = useState<SplitRow[]>([
    { category: 'food', amount: 0, note: '' },
    { category: 'other', amount: 0, note: '' },
  ]);
  const isEdit = !!transaction;

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      type: 'expense',
      category: 'food',
      date: new Date().toISOString().split('T')[0],
      budget_impact: 'none',
    },
  });

  useEffect(() => {
    fetchCards();
    fetchCategories();
  }, [fetchCards, fetchCategories]);

  useEffect(() => {
    if (transaction) {
      reset({
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        merchant: transaction.merchant || '',
        date: transaction.date.split('T')[0],
        card_id: transaction.card_id || '',
        budget_impact: transaction.budget_impact || 'none',
      });
    } else {
      reset({ type: 'expense', category: 'food', date: new Date().toISOString().split('T')[0] });
    }
  }, [transaction, reset]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      let savedId: string;
      if (isEdit && transaction) {
        await updateTransaction(transaction.id, data as Partial<Transaction>);
        savedId = transaction.id;
      } else {
        const created = await addTransaction(data as Partial<Transaction>);
        savedId = created.id;
      }
      // If split mode is active, save splits too
      if (showSplit && splits.length >= 2) {
        const totalSplit = splits.reduce((s, sp) => s + sp.amount, 0);
        if (Math.abs(totalSplit - data.amount) < 0.01) {
          await api.post(`/transactions/${savedId}/splits`, { splits });
        }
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const splitTotal = splits.reduce((s, sp) => s + (sp.amount || 0), 0);
  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCategories.filter((c) => !DEFAULT_CATEGORIES.includes(c.name as TransactionCategory)).map((c) => c.name as TransactionCategory),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Transaction' : 'Add Transaction'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(['income', 'expense', 'transfer'] as const).map((t) => {
              const selected = watch('type') === t;
              return (
                <label key={t} className="cursor-pointer">
                  <input {...register('type')} type="radio" value={t} className="sr-only" />
                  <div className={`text-center py-2 px-3 rounded-lg border text-sm font-medium transition-all capitalize
                    ${t === 'income'
                      ? selected
                        ? 'border-[rgba(87,201,60,0.6)] bg-[rgba(87,201,60,0.15)] text-[var(--color-accent)]'
                        : 'border-[rgba(87,201,60,0.2)] text-[var(--color-text-secondary)] hover:border-[rgba(87,201,60,0.4)]'
                      : ''}
                    ${t === 'expense'
                      ? selected
                        ? 'border-[rgba(239,68,68,0.6)] bg-[rgba(239,68,68,0.15)] text-[var(--color-danger)]'
                        : 'border-[rgba(239,68,68,0.2)] text-[var(--color-text-secondary)] hover:border-[rgba(239,68,68,0.4)]'
                      : ''}
                    ${t === 'transfer'
                      ? selected
                        ? 'border-[rgba(59,130,246,0.6)] bg-[rgba(59,130,246,0.15)] text-[var(--color-info)]'
                        : 'border-[rgba(59,130,246,0.2)] text-[var(--color-text-secondary)] hover:border-[rgba(59,130,246,0.4)]'
                      : ''}
                  `}>
                    {t}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Amount ($)</label>
          <input {...register('amount')} type="number" step="0.01" placeholder="0.00" className="input-base" />
          {errors.amount && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.amount.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Description</label>
          <input {...register('description')} placeholder="e.g. Grocery shopping" className="input-base" />
          {errors.description && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.description.message}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Category</label>
          <select {...register('category')} className="input-base">
            {[...DEFAULT_CATEGORIES, ...customCategories.filter((c) => !DEFAULT_CATEGORIES.includes(c.name as TransactionCategory)).map((c) => c.name as TransactionCategory)].map((c) => (
              <option key={c} value={c}>
                {(CATEGORY_ICONS as Record<string, string>)[c] || '📦'}{' '}
                {(CATEGORY_LABELS as Record<string, string>)[c] || c}
              </option>
            ))}
          </select>
        </div>

        {/* Budget impact — transfers only */}
        {watch('type') === 'transfer' && (
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
              Budget impact
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'increase', label: '↑ Increase', activeClass: 'border-[rgba(87,201,60,0.6)] bg-[rgba(87,201,60,0.1)] text-[var(--color-accent)]' },
                { value: 'decrease', label: '↓ Decrease', activeClass: 'border-[rgba(239,68,68,0.6)] bg-[rgba(239,68,68,0.1)] text-[var(--color-danger)]' },
                { value: 'none',     label: '— None',     activeClass: 'border-[rgba(156,149,133,0.6)] bg-[rgba(156,149,133,0.1)] text-[var(--color-text-secondary)]' },
              ] as { value: BudgetImpact; label: string; activeClass: string }[]).map(({ value, label, activeClass }) => (
                <label key={value} className="cursor-pointer">
                  <input {...register('budget_impact')} type="radio" value={value} className="sr-only" />
                  <div className={`text-center py-2 rounded-lg border text-xs font-medium transition-all ${
                    watch('budget_impact') === value
                      ? activeClass
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                  }`}>
                    {label}
                  </div>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">
              How should this transfer affect the selected category&apos;s budget?
            </p>
          </div>
        )}

        {/* Merchant + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Merchant</label>
            <input {...register('merchant')} placeholder="Optional" className="input-base" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Date</label>
            <input {...register('date')} type="date" className="input-base" />
            {errors.date && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.date.message}</p>}
          </div>
        </div>

        {/* Card */}
        {cards.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Card (optional)</label>
            <select {...register('card_id')} className="input-base">
              <option value="">No card</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.card_holder} •••• {c.card_number}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Split toggle */}
        <div className="flex items-center gap-3 pt-1">
          <button type="button" onClick={() => setShowSplit((v) => !v)}
            className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]">
            <Scissors size={13} />
            {showSplit ? 'Remove split' : 'Split by category'}
          </button>
        </div>

        {/* Split rows */}
        {showSplit && (
          <div className="border border-[var(--color-border)] rounded-xl p-4 space-y-3">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Split transaction across categories</p>
            {splits.map((sp, i) => (
              <div key={i} className="flex items-center gap-2">
                <select value={sp.category} onChange={(e) => setSplits((prev) => prev.map((r, j) => j === i ? { ...r, category: e.target.value as TransactionCategory } : r))}
                  className="flex-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-xs">
                  {allCategories.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>)}
                </select>
                <input type="number" step="0.01" value={sp.amount || ''} placeholder="0.00" onChange={(e) => setSplits((prev) => prev.map((r, j) => j === i ? { ...r, amount: parseFloat(e.target.value) || 0 } : r))}
                  className="w-24 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-xs" />
                <input value={sp.note} onChange={(e) => setSplits((prev) => prev.map((r, j) => j === i ? { ...r, note: e.target.value } : r))}
                  placeholder="Note" className="flex-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-xs" />
                {splits.length > 2 && (
                  <button type="button" onClick={() => setSplits((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setSplits((prev) => [...prev, { category: 'other', amount: 0, note: '' }])}
                className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline">
                <Plus size={12} /> Add split
              </button>
              <span className={`text-xs font-medium ${Math.abs(splitTotal - (watch('amount') || 0)) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(splitTotal)} / {formatCurrency(watch('amount') || 0)}
              </span>
            </div>
          </div>
        )}

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading
            ? <><Loader2 size={16} className="animate-spin" /> {isEdit ? 'Saving...' : 'Adding...'}</>
            : isEdit ? 'Save changes' : 'Add transaction'
          }
        </button>
      </form>
    </Modal>
  );
}

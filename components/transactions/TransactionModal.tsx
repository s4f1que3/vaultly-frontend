'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useCardStore } from '@/stores/useCardStore';
import { Transaction, TransactionCategory } from '@/types';
import { CATEGORY_LABELS } from '@/lib/utils/formatters';

const schema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.string(),
  description: z.string().min(1, 'Required'),
  merchant: z.string().optional(),
  date: z.string().min(1, 'Required'),
  card_id: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
}

const CATEGORIES: TransactionCategory[] = [
  'food', 'transport', 'shopping', 'entertainment', 'health',
  'utilities', 'housing', 'education', 'salary', 'investment', 'transfer', 'other',
];

export default function TransactionModal({ isOpen, onClose, transaction }: Props) {
  const { addTransaction, updateTransaction } = useTransactionStore();
  const { cards, fetchCards } = useCardStore();
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!transaction;

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      type: 'expense',
      category: 'food',
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

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
      });
    } else {
      reset({ type: 'expense', category: 'food', date: new Date().toISOString().split('T')[0] });
    }
  }, [transaction, reset]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      if (isEdit && transaction) {
        await updateTransaction(transaction.id, data as Partial<Transaction>);
      } else {
        await addTransaction(data as Partial<Transaction>);
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

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
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>

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

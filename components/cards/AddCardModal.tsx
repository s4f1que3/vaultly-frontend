'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import CreditCard from '@/components/cards/CreditCard';
import { CardType, CardTheme, CardKind } from '@/types';
import { useCardStore } from '@/stores/useCardStore';

const schema = z.object({
  card_holder: z.string().min(2, 'Required'),
  card_number: z.string().length(4, 'Enter last 4 digits'),
  expiry_month: z.string().min(1, 'Required').max(2),
  expiry_year: z.string().length(4, 'Enter 4-digit year'),
  card_type: z.enum(['visa', 'mastercard', 'amex']),
  card_kind: z.enum(['credit', 'debit']),
  theme: z.enum(['green', 'dark', 'brown', 'purple', 'gold']),
  balance: z.coerce.number().min(0),
  credit_limit: z.coerce.number().min(0),
});
type FormData = z.infer<typeof schema>;

const THEMES: { value: CardTheme; label: string; color: string }[] = [
  { value: 'green', label: 'Forest', color: '#1a4a1a' },
  { value: 'dark', label: 'Midnight', color: '#1a1a3e' },
  { value: 'brown', label: 'Walnut', color: '#3d2010' },
  { value: 'purple', label: 'Violet', color: '#2d0f5e' },
  { value: 'gold', label: 'Gold', color: '#3d2e00' },
];

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCardModal({ isOpen, onClose }: AddCardModalProps) {
  const { addCard } = useCardStore();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      card_type: 'visa',
      card_kind: 'credit',
      theme: 'green',
      balance: 0,
      credit_limit: 5000,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await addCard(data);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Card" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Live preview — centered, mini */}
        <div className="flex justify-center py-2">
          <CreditCard card={watchedValues} mini />
        </div>

        {/* Card holder + last 4 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Card holder name</label>
            <input {...register('card_holder')} placeholder="John Doe" className="input-base" />
            {errors.card_holder && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.card_holder.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Last 4 digits</label>
            <input {...register('card_number')} placeholder="1234" maxLength={4} className="input-base font-mono" />
            {errors.card_number && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.card_number.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Month</label>
              <input {...register('expiry_month')} placeholder="MM" maxLength={2} className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Year</label>
              <input {...register('expiry_year')} placeholder="YYYY" maxLength={4} className="input-base" />
            </div>
          </div>
        </div>

        {/* Network + Kind */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Card network</label>
            <select {...register('card_type')} className="input-base">
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="amex">American Express</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">Card kind</label>
            <div className="grid grid-cols-2 gap-2">
              {(['credit', 'debit'] as CardKind[]).map((k) => (
                <label key={k} className="cursor-pointer">
                  <input {...register('card_kind')} type="radio" value={k} className="sr-only" />
                  <div className={`text-center py-2 rounded-xl border-2 text-sm font-medium transition-all capitalize ${
                    watchedValues.card_kind === k
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                  }`}>
                    {k}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">Theme</label>
          <div className="flex gap-2 flex-wrap">
            {THEMES.map((t) => (
              <label key={t.value} className="cursor-pointer">
                <input {...register('theme')} type="radio" value={t.value} className="sr-only" />
                <div
                  title={t.label}
                  style={{ background: t.color }}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    watchedValues.theme === t.value
                      ? 'border-[var(--color-accent)] scale-110'
                      : 'border-transparent'
                  }`}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Balance + Credit limit */}
        <div className={`grid gap-3 ${watchedValues.card_kind === 'debit' ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Balance ($)</label>
            <input {...register('balance')} type="number" step="0.01" placeholder="0.00" className="input-base" />
          </div>
          {watchedValues.card_kind !== 'debit' && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Credit limit ($)</label>
              <input {...register('credit_limit')} type="number" step="0.01" placeholder="5000.00" className="input-base" />
            </div>
          )}
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? <><Loader2 size={16} className="animate-spin" /> Adding...</> : 'Add Card'}
        </button>
      </form>
    </Modal>
  );
}

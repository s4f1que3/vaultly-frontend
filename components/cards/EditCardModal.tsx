'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import CreditCard from '@/components/cards/CreditCard';
import { Card, CardTheme } from '@/types';
import { useCardStore } from '@/stores/useCardStore';

const schema = z.object({
  card_holder: z.string().min(2, 'Required'),
  expiry_month: z.string().min(1, 'Required').max(2),
  expiry_year: z.string().length(4, 'Enter 4-digit year'),
  theme: z.enum(['green', 'dark', 'brown', 'purple', 'gold']),
  credit_limit: z.coerce.number().min(0),
});
type FormData = z.infer<typeof schema>;

const THEMES: { value: CardTheme; label: string; color: string }[] = [
  { value: 'green',  label: 'Forest',   color: '#1a4a1a' },
  { value: 'dark',   label: 'Midnight', color: '#1a1a3e' },
  { value: 'brown',  label: 'Walnut',   color: '#3d2010' },
  { value: 'purple', label: 'Violet',   color: '#2d0f5e' },
  { value: 'gold',   label: 'Gold',     color: '#3d2e00' },
];

interface EditCardModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditCardModal({ card, isOpen, onClose }: EditCardModalProps) {
  const { updateCard } = useCardStore();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  });

  useEffect(() => {
    if (card) {
      reset({
        card_holder:  card.card_holder,
        expiry_month: card.expiry_month,
        expiry_year:  card.expiry_year,
        theme:        card.theme,
        credit_limit: card.credit_limit ?? 0,
      });
    }
  }, [card, reset]);

  const watchedValues = watch();

  const preview = card ? {
    ...card,
    card_holder:  watchedValues.card_holder  ?? card.card_holder,
    expiry_month: watchedValues.expiry_month ?? card.expiry_month,
    expiry_year:  watchedValues.expiry_year  ?? card.expiry_year,
    theme:        watchedValues.theme        ?? card.theme,
  } : null;

  const onSubmit = async (data: FormData) => {
    if (!card) return;
    setIsLoading(true);
    try {
      await updateCard(card.id, {
        card_holder:  data.card_holder,
        expiry_month: data.expiry_month,
        expiry_year:  data.expiry_year,
        theme:        data.theme,
        credit_limit: data.credit_limit,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Card" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Live preview */}
        <div className="flex justify-center py-2">
          {preview && <CreditCard card={preview} mini />}
        </div>

        {/* Card holder */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Card holder name</label>
          <input {...register('card_holder')} placeholder="John Doe" className="input-base" />
          {errors.card_holder && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.card_holder.message}</p>}
        </div>

        {/* Expiry */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Expiry month</label>
            <input {...register('expiry_month')} placeholder="MM" maxLength={2} className="input-base" />
            {errors.expiry_month && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.expiry_month.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Expiry year</label>
            <input {...register('expiry_year')} placeholder="YYYY" maxLength={4} className="input-base" />
            {errors.expiry_year && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.expiry_year.message}</p>}
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

        {/* Credit limit — only for credit cards */}
        {card?.card_kind !== 'debit' && (
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Credit limit ($)</label>
            <input {...register('credit_limit')} type="number" step="0.01" placeholder="5000.00" className="input-base" />
          </div>
        )}

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save changes'}
        </button>
      </form>
    </Modal>
  );
}

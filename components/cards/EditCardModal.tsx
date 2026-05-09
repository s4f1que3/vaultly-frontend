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
import { useSavingsStore } from '@/stores/useSavingsStore';

const schema = z.object({
  card_holder: z.string().min(2, 'Required'),
  expiry_month: z.string().min(1, 'Required').max(2),
  expiry_year: z.string().length(4, 'Enter 4-digit year'),
  theme: z.enum(['green', 'dark', 'brown', 'purple', 'gold']),
  balance: z.coerce.number(),
  credit_limit: z.coerce.number().min(0),
  savings_pot_id: z.string().optional(),
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
  const { pots, fetchPots } = useSavingsStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { fetchPots(); }, [fetchPots]);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  });

  useEffect(() => {
    if (card) {
      reset({
        card_holder:    card.card_holder,
        expiry_month:   card.expiry_month,
        expiry_year:    card.expiry_year,
        theme:          card.theme,
        balance:        card.balance ?? 0,
        credit_limit:   card.credit_limit ?? 0,
        savings_pot_id: card.savings_pot_id ?? '',
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
        card_holder:    data.card_holder,
        expiry_month:   data.expiry_month,
        expiry_year:    data.expiry_year,
        theme:          data.theme,
        balance:        data.balance,
        credit_limit:   data.credit_limit,
        savings_pot_id: data.savings_pot_id || null,
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

        {/* Balance + Credit limit */}
        <div className={`grid gap-3 ${card?.card_kind !== 'debit' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Current balance ($)</label>
            <input {...register('balance')} type="number" step="0.01" placeholder="0.00" className="input-base" />
            {errors.balance && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.balance.message}</p>}
          </div>
          {card?.card_kind !== 'debit' && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Credit limit ($)</label>
              <input {...register('credit_limit')} type="number" step="0.01" placeholder="5000.00" className="input-base" />
            </div>
          )}
        </div>

        {/* Linked savings pot */}
        {pots.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Linked savings pot <span className="text-[var(--color-text-muted)]">(optional)</span>
            </label>
            <select {...register('savings_pot_id')} className="input-base">
              <option value="">None — count card balance in net worth</option>
              {pots.map((p) => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
              If this card is funded by a savings pot, link them so net worth isn&apos;t counted twice.
            </p>
          </div>
        )}

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save changes'}
        </button>
      </form>
    </Modal>
  );
}

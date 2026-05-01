'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useSubscriptionStore } from '@/stores/useSubscriptionStore';
import { useCardStore } from '@/stores/useCardStore';
import { Subscription } from '@/types';

const PRESET_ICONS = ['🎬', '🎵', '📦', '🍎', '📺', '🎮', '☁️', '🔒', '📰', '💼', '🏋️', '📱'];

const schema = z.object({
  company: z.string().min(1, 'Required'),
  amount: z.coerce.number().min(0.01, 'Must be > 0'),
  card_id: z.string().optional(),
  period: z.enum(['monthly', 'yearly']),
  billing_day: z.coerce.number().int().min(1).max(31),
  billing_month: z.coerce.number().int().min(1).max(12).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const COLORS = ['#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#06b6d4', '#f97316', '#ef4444', '#57c93c'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  subscription?: Subscription;
}

export default function SubscriptionModal({ isOpen, onClose, subscription }: Props) {
  const { addSubscription, updateSubscription } = useSubscriptionStore();
  const { cards, fetchCards } = useCardStore();
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!subscription;

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { period: 'monthly', billing_day: 1, icon: '💳', color: '#57c93c' },
  });

  useEffect(() => { fetchCards(); }, [fetchCards]);

  useEffect(() => {
    if (subscription) {
      reset({
        company: subscription.company,
        amount: subscription.amount,
        card_id: subscription.card_id || '',
        period: subscription.period,
        billing_day: subscription.billing_day,
        billing_month: subscription.billing_month,
        icon: subscription.icon || '💳',
        color: subscription.color || '#57c93c',
      });
    } else {
      reset({ period: 'monthly', billing_day: 1, icon: '💳', color: '#57c93c' });
    }
  }, [subscription, reset]);

  const period = watch('period');
  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const payload = { ...data, card_id: data.card_id || undefined };
      if (isEdit && subscription) {
        await updateSubscription(subscription.id, payload);
      } else {
        await addSubscription(payload);
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Subscription' : 'Add Subscription'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Icon + Color picker */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">Icon</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                onClick={() => setValue('icon', icon)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all border ${
                  selectedIcon === icon
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)] scale-110'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setValue('color', c)}
                className={`w-6 h-6 rounded-full transition-all ${selectedColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--color-surface-2)] scale-110' : ''}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        {/* Company */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Company / Service</label>
          <input {...register('company')} placeholder="e.g. Netflix" className="input-base" />
          {errors.company && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.company.message}</p>}
        </div>

        {/* Amount + Period */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Amount ($)</label>
            <input {...register('amount')} type="number" step="0.01" placeholder="0.00" className="input-base" />
            {errors.amount && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Billing period</label>
            <select {...register('period')} className="input-base">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* Billing date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              {period === 'yearly' ? 'Day of month' : 'Day of month (1–31)'}
            </label>
            <input {...register('billing_day')} type="number" min={1} max={31} placeholder="1" className="input-base" />
            {errors.billing_day && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.billing_day.message}</p>}
          </div>
          {period === 'yearly' && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Month</label>
              <select {...register('billing_month')} className="input-base">
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Card */}
        {cards.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Card (optional)</label>
            <select {...register('card_id')} className="input-base">
              <option value="">No card</option>
              {cards.map(c => (
                <option key={c.id} value={c.id}>{c.card_holder} •••• {c.card_number}</option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading
            ? <><Loader2 size={16} className="animate-spin" /> {isEdit ? 'Saving...' : 'Adding...'}</>
            : isEdit ? 'Save changes' : 'Add subscription'
          }
        </button>
      </form>
    </Modal>
  );
}

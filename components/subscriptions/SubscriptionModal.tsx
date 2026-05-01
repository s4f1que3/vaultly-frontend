'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useSubscriptionStore } from '@/stores/useSubscriptionStore';
import { useCardStore } from '@/stores/useCardStore';
import { Subscription } from '@/types';
import { createClient } from '@/lib/supabase/client';

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

function isImageUrl(value?: string) {
  return !!value && (value.startsWith('https://') || value.startsWith('http://') || value.startsWith('data:'));
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  subscription?: Subscription;
}

export default function SubscriptionModal({ isOpen, onClose, subscription }: Props) {
  const { addSubscription, updateSubscription } = useSubscriptionStore();
  const { cards, fetchCards } = useCardStore();
  const [isLoading, setIsLoading] = useState(false);
  const [iconMode, setIconMode] = useState<'emoji' | 'image'>('emoji');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!subscription;

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { period: 'monthly', billing_day: 1, icon: '💳', color: '#57c93c' },
  });

  useEffect(() => { fetchCards(); }, [fetchCards]);

  useEffect(() => {
    if (subscription) {
      const hasImage = isImageUrl(subscription.icon);
      setIconMode(hasImage ? 'image' : 'emoji');
      setImagePreview(hasImage ? subscription.icon! : null);
      setImageFile(null);
      setUploadError(null);
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
      setIconMode('emoji');
      setImagePreview(null);
      setImageFile(null);
      setUploadError(null);
      reset({ period: 'monthly', billing_day: 1, icon: '💳', color: '#57c93c' });
    }
  }, [subscription, reset, isOpen]);

  const period = watch('period');
  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  function switchToEmoji() {
    setIconMode('emoji');
    setImagePreview(null);
    setImageFile(null);
    setUploadError(null);
    // Restore to last emoji or default
    if (isImageUrl(selectedIcon)) setValue('icon', '💳');
  }

  function switchToImage() {
    setIconMode('image');
    setValue('icon', '');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image must be under 2MB.');
      return;
    }
    setUploadError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    setValue('icon', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadImage(file: File): Promise<string> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('subscription-icons')
      .upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from('subscription-icons').getPublicUrl(path);
    return data.publicUrl;
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setUploadError(null);
    try {
      let icon = data.icon;

      if (iconMode === 'image') {
        if (imageFile) {
          icon = await uploadImage(imageFile);
        } else if (imagePreview && isImageUrl(imagePreview)) {
          // Keep existing image URL (editing without changing image)
          icon = imagePreview;
        } else {
          icon = '💳'; // fallback if nothing uploaded
        }
      }

      const payload = { ...data, icon, card_id: data.card_id || undefined };
      if (isEdit && subscription) {
        await updateSubscription(subscription.id, payload);
      } else {
        await addSubscription(payload);
      }
      onClose();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Subscription' : 'Add Subscription'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Icon section */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">Icon</label>

          {/* Mode toggle */}
          <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-surface-3)] mb-3 w-fit">
            <button
              type="button"
              onClick={switchToEmoji}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                iconMode === 'emoji'
                  ? 'bg-[var(--color-surface-1)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Emoji
            </button>
            <button
              type="button"
              onClick={switchToImage}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                iconMode === 'image'
                  ? 'bg-[var(--color-surface-1)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Upload Image
            </button>
          </div>

          {iconMode === 'emoji' && (
            <>
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
            </>
          )}

          {iconMode === 'image' && (
            <div>
              {imagePreview ? (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-3)] flex items-center justify-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="icon preview" className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-[var(--color-accent)] hover:underline text-left"
                    >
                      Change image
                    </button>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="text-xs text-[var(--color-danger)] hover:underline text-left flex items-center gap-1"
                    >
                      <X size={10} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] flex flex-col items-center justify-center gap-2 transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
                >
                  <Upload size={20} />
                  <span className="text-xs font-medium">Click to upload logo</span>
                  <span className="text-[10px]">PNG, JPG, SVG · max 2MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {uploadError && <p className="text-[var(--color-danger)] text-xs mt-2">{uploadError}</p>}
            </div>
          )}
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

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { useRecurringStore } from '@/stores/useRecurringStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useBillingStore } from '@/stores/useBillingStore';
import { RecurringTransaction, TransactionCategory } from '@/types';
import { CATEGORY_LABELS, CATEGORY_ICONS, formatCurrency, formatDate } from '@/lib/utils/formatters';

// ── Schemas ────────────────────────────────────────────────────────────────────

const recurringSchema = z.object({
  name: z.string().min(1, 'Name required'),
  amount: z.coerce.number().positive('Must be positive'),
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.string().min(1),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']),
  day_of_month: z.coerce.number().min(1).max(31).optional().or(z.literal('')),
  start_date: z.string().min(1, 'Start date required'),
  end_date: z.string().optional().or(z.literal('')),
  merchant: z.string().optional(),
});

const subscriptionSchema = z.object({
  company: z.string().min(1, 'Company name required'),
  amount: z.coerce.number().positive('Must be positive'),
  period: z.enum(['monthly', 'yearly']),
  billing_day: z.coerce.number().min(1).max(31, 'Must be 1–31'),
  billing_month: z.coerce.number().min(1).max(12).optional().or(z.literal('')),
});

type RecurringFormData = z.infer<typeof recurringSchema>;
type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

// ── Constants ──────────────────────────────────────────────────────────────────

const FREQ_LABELS: Record<string, string> = {
  daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks',
  monthly: 'Monthly', yearly: 'Yearly',
};

const TYPE_CONFIG = [
  { value: 'expense', label: 'Expense', activeClass: 'border-[rgba(239,68,68,0.6)] bg-[rgba(239,68,68,0.15)] text-[var(--color-danger)]', hoverClass: 'border-[rgba(239,68,68,0.2)] hover:border-[rgba(239,68,68,0.4)]' },
  { value: 'income',  label: 'Income',  activeClass: 'border-[rgba(87,201,60,0.6)] bg-[rgba(87,201,60,0.15)] text-[var(--color-accent)]',   hoverClass: 'border-[rgba(87,201,60,0.2)] hover:border-[rgba(87,201,60,0.4)]' },
  { value: 'transfer',label: 'Transfer',activeClass: 'border-[rgba(59,130,246,0.6)] bg-[rgba(59,130,246,0.15)] text-[var(--color-info)]',    hoverClass: 'border-[rgba(59,130,246,0.2)] hover:border-[rgba(59,130,246,0.4)]' },
] as const;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Helper ─────────────────────────────────────────────────────────────────────

function toMonthlyAmount(item: RecurringTransaction): number {
  const multipliers: Record<string, number> = {
    daily: 30.44, weekly: 4.33, biweekly: 2.17, monthly: 1, yearly: 1 / 12,
  };
  return item.amount * (multipliers[item.frequency] ?? 1);
}

// ── Subscription sub-form ──────────────────────────────────────────────────────

function SubscriptionForm({ onClose }: { onClose: () => void }) {
  const { addSubscription } = useRecurringStore();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema) as never,
    defaultValues: { period: 'monthly', billing_day: 1 },
  });

  const period = watch('period');

  const onSubmit = async (data: SubscriptionFormData) => {
    setIsLoading(true);
    try {
      await addSubscription({
        company: data.company,
        amount: data.amount,
        period: data.period,
        billing_day: Number(data.billing_day),
        billing_month: data.billing_month ? Number(data.billing_month) : undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Company / Service</label>
        <input {...register('company')} placeholder="e.g. Netflix, Spotify, Adobe" className="input-base" />
        {errors.company && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.company.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Amount ($)</label>
          <input {...register('amount')} type="number" step="0.01" placeholder="0.00" className="input-base" />
          {errors.amount && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Billing period</label>
          <div className="grid grid-cols-2 gap-2">
            {(['monthly', 'yearly'] as const).map((p) => (
              <label key={p} className="cursor-pointer">
                <input {...register('period')} type="radio" value={p} className="sr-only" />
                <div className={`text-center py-2 rounded-lg border text-xs font-medium transition-all capitalize ${
                  period === p
                    ? 'border-[rgba(87,201,60,0.6)] bg-[rgba(87,201,60,0.15)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[rgba(87,201,60,0.3)]'
                }`}>
                  {p === 'monthly' ? 'Monthly' : 'Yearly'}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Billing day</label>
          <input {...register('billing_day')} type="number" min={1} max={31} placeholder="e.g. 15" className="input-base" />
          {errors.billing_day && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.billing_day.message}</p>}
        </div>
        {period === 'yearly' && (
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Billing month</label>
            <select {...register('billing_month')} className="input-base">
              <option value="">Select month</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
        )}
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary w-full">
        {isLoading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Add subscription'}
      </button>
    </form>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function RecurringModal({ isOpen, onClose, item }: { isOpen: boolean; onClose: () => void; item?: RecurringTransaction | null }) {
  const { addRecurring, updateRecurring } = useRecurringStore();
  const { customCategories, fetchCategories } = useCategoryStore();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'recurring' | 'subscription'>('recurring');
  const isEdit = !!item;

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => {
    if (!isOpen) setMode('recurring');
  }, [isOpen]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<RecurringFormData>({
    resolver: zodResolver(recurringSchema) as never,
    defaultValues: { type: 'expense', category: 'food', frequency: 'monthly', start_date: new Date().toISOString().split('T')[0] },
  });

  useEffect(() => {
    if (item) {
      reset({
        name: item.name, amount: item.amount, type: item.type as never,
        category: item.category, frequency: item.frequency as never,
        day_of_month: item.day_of_month ?? '', start_date: item.start_date ?? '',
        end_date: item.end_date ?? '', merchant: item.merchant ?? '',
      });
    } else {
      reset({ type: 'expense', category: 'food', frequency: 'monthly', start_date: new Date().toISOString().split('T')[0] });
    }
  }, [item, reset, isOpen]);

  const frequency = watch('frequency');
  const selectedType = watch('type');

  const defaultKeys = Object.keys(CATEGORY_LABELS) as TransactionCategory[];
  const allCategories = [
    ...defaultKeys,
    ...customCategories.filter((c) => !defaultKeys.includes(c.name as TransactionCategory)).map((c) => c.name as TransactionCategory),
  ];

  const onSubmit = async (data: RecurringFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        day_of_month: data.day_of_month ? Number(data.day_of_month) : undefined,
        end_date: data.end_date || undefined,
        merchant: data.merchant || undefined,
      };
      if (isEdit && item) await updateRecurring(item.id, payload as Partial<RecurringTransaction>);
      else await addRecurring(payload as Partial<RecurringTransaction>);
      onClose();
    } finally { setIsLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}>

      {/* Mode toggle — only when creating new */}
      {!isEdit && (
        <div className="grid grid-cols-2 gap-2 mb-5">
          {(['recurring', 'subscription'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                mode === m
                  ? 'border-[rgba(87,201,60,0.6)] bg-[rgba(87,201,60,0.12)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[rgba(87,201,60,0.3)]'
              }`}
            >
              {m === 'recurring' ? 'Recurring' : 'Subscription'}
            </button>
          ))}
        </div>
      )}

      {mode === 'subscription' && !isEdit ? (
        <SubscriptionForm onClose={onClose} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_CONFIG.map(({ value, label, activeClass, hoverClass }) => (
                <label key={value} className="cursor-pointer">
                  <input {...register('type')} type="radio" value={value} className="sr-only" />
                  <div className={`text-center py-2 px-3 rounded-lg border text-sm font-medium transition-all capitalize ${
                    selectedType === value ? activeClass : `border-[var(--color-border)] text-[var(--color-text-secondary)] ${hoverClass}`
                  }`}>
                    {label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Name</label>
            <input {...register('name')} placeholder="e.g. Rent, Netflix, Salary" className="input-base" />
            {errors.name && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Amount + Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Amount ($)</label>
              <input {...register('amount')} type="number" step="0.01" placeholder="0.00" className="input-base" />
              {errors.amount && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Frequency</label>
              <select {...register('frequency')} className="input-base">
                {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Category + Day of month */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Category</label>
              <select {...register('category')} className="input-base">
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat as TransactionCategory] ?? cat}</option>
                ))}
              </select>
            </div>
            {frequency === 'monthly' && (
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Day of month</label>
                <input {...register('day_of_month')} type="number" min={1} max={31} placeholder="e.g. 1" className="input-base" />
              </div>
            )}
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Merchant <span className="text-[var(--color-text-muted)]">(optional)</span></label>
            <input {...register('merchant')} placeholder="e.g. Netflix, Landlord" className="input-base" />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Start date</label>
              <input {...register('start_date')} type="date" className="input-base" />
              {errors.start_date && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.start_date.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">End date <span className="text-[var(--color-text-muted)]">(optional)</span></label>
              <input {...register('end_date')} type="date" className="input-base" />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> {isEdit ? 'Saving...' : 'Creating...'}</> : isEdit ? 'Save changes' : 'Create recurring'}
          </button>
        </form>
      )}
    </Modal>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RecurringPage() {
  const { items, isLoading, fetchRecurring, deleteRecurring, toggleActive } = useRecurringStore();
  const { isChecking, access } = useBillingStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);

  useEffect(() => {
    if (!isChecking && access?.hasAccess) fetchRecurring();
  }, [fetchRecurring, isChecking, access]);

  const active = items.filter((r) => r.is_active);
  const paused = items.filter((r) => !r.is_active);

  const recurringMonthly = active
    .filter((i) => i.source === 'recurring' && i.type === 'expense')
    .reduce((sum, i) => sum + toMonthlyAmount(i), 0);
  const subscriptionMonthly = active
    .filter((i) => i.source === 'subscription')
    .reduce((sum, i) => sum + toMonthlyAmount(i), 0);
  const totalMonthly = recurringMonthly + subscriptionMonthly;

  const openEdit = (item: RecurringTransaction) => {
    if (item.source === 'subscription') return;
    setEditing(item);
    setModalOpen(true);
  };
  const openNew = () => { setEditing(null); setModalOpen(true); };

  return (
    <div className="px-4 py-6 sm:px-6 max-w-4xl mx-auto">
      <PageHeader
        title="Recurring Transactions"
        subtitle="Auto-log fixed income and expenses on a schedule"
        action={
          <button onClick={openNew} className="btn-primary text-sm">
            <Plus size={16} /> New recurring
          </button>
        }
      />

      {/* Monthly totals */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Subscriptions / mo', value: subscriptionMonthly, color: 'var(--color-info)' },
            { label: 'Recurring / mo', value: recurringMonthly, color: 'var(--color-danger)' },
            { label: 'Total / mo', value: totalMonthly, color: 'var(--color-accent)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">{label}</p>
              <p className="font-semibold text-sm" style={{ color }}>{formatCurrency(value)}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-4 w-40" />
              <div className="skeleton h-3 w-24" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-12 text-center">
          <div className="text-4xl mb-3">🔄</div>
          <p className="text-[var(--color-text-secondary)] font-medium">No recurring transactions</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-4">Add rent, salary, subscriptions — anything on a fixed schedule</p>
          <button onClick={openNew} className="btn-primary text-sm"><Plus size={16} /> Add first</button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {[{ label: 'Active', data: active }, { label: 'Paused', data: paused }].map(({ label, data }) =>
            data.length > 0 ? (
              <div key={label}>
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-3">{label}</p>
                <div className="space-y-2">
                  <AnimatePresence>
                    {data.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ delay: i * 0.04 }}
                        className="card p-4 flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center text-xl shrink-0">
                          {item.icon ?? CATEGORY_ICONS[item.category as TransactionCategory] ?? '💳'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-[var(--color-text-primary)] truncate">{item.name}</span>
                            <span className="badge">{FREQ_LABELS[item.frequency] ?? item.frequency}</span>
                            {item.source === 'subscription' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-info)]/10 text-[var(--color-info)] font-medium">subscription</span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            Next: {formatDate(item.next_due_date)}
                            {item.merchant && item.merchant !== item.name && ` · ${item.merchant}`}
                          </p>
                        </div>

                        <span className={`font-semibold text-sm shrink-0 ${item.type === 'income' ? 'text-[var(--color-success)]' : item.type === 'expense' ? 'text-[var(--color-danger)]' : 'text-[var(--color-info)]'}`}>
                          {item.type === 'income' ? '+' : item.type === 'expense' ? '-' : ''}{formatCurrency(item.amount)}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => toggleActive(item)}
                            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                            title={item.is_active ? 'Pause' : 'Resume'}
                          >
                            {item.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </button>
                          {item.source !== 'subscription' && (
                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
                              <Pencil size={13} />
                            </button>
                          )}
                          <button onClick={() => deleteRecurring(item.id)} className="p-1.5 rounded-lg hover:bg-[rgba(239,68,68,0.1)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ) : null,
          )}
        </div>
      )}

      <RecurringModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} item={editing} />
    </div>
  );
}

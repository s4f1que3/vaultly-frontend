'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { useRecurringStore } from '@/stores/useRecurringStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { RecurringTransaction, TransactionCategory } from '@/types';
import { CATEGORY_LABELS, CATEGORY_ICONS, formatCurrency, formatDate } from '@/lib/utils/formatters';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  amount: z.coerce.number().positive('Must be positive'),
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.string().min(1),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']),
  day_of_month: z.coerce.number().min(1).max(31).optional().or(z.literal('')),
  start_date: z.string().min(1, 'Start date required'),
  end_date: z.string().optional().or(z.literal('')),
  description: z.string().optional(),
  merchant: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const FREQ_LABELS: Record<string, string> = {
  daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks',
  monthly: 'Monthly', yearly: 'Yearly',
};

function RecurringModal({
  isOpen, onClose, item,
}: { isOpen: boolean; onClose: () => void; item?: RecurringTransaction | null }) {
  const { addRecurring, updateRecurring } = useRecurringStore();
  const { customCategories, fetchCategories } = useCategoryStore();
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!item;

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      type: 'expense', category: 'food', frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (item) {
      reset({
        name: item.name, amount: item.amount, type: item.type as never,
        category: item.category, frequency: item.frequency as never,
        day_of_month: item.day_of_month ?? '',
        start_date: item.start_date, end_date: item.end_date ?? '',
        description: item.description ?? '', merchant: item.merchant ?? '',
      });
    } else {
      reset({
        type: 'expense', category: 'food', frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [item, reset, isOpen]);

  const frequency = watch('frequency');

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        day_of_month: data.day_of_month ? Number(data.day_of_month) : undefined,
        end_date: data.end_date || undefined,
        description: data.description || undefined,
        merchant: data.merchant || undefined,
      };
      if (isEdit && item) {
        await updateRecurring(item.id, payload as Partial<RecurringTransaction>);
      } else {
        await addRecurring(payload as Partial<RecurringTransaction>);
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const defaultKeys = Object.keys(CATEGORY_LABELS) as TransactionCategory[];
  const allCategories = [
    ...defaultKeys,
    ...customCategories.filter((c) => !defaultKeys.includes(c.name as TransactionCategory)).map((c) => c.name as TransactionCategory),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Name</label>
          <input {...register('name')} placeholder="e.g. Rent, Salary" className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Amount</label>
            <input {...register('amount')} type="number" step="0.01" placeholder="0.00" className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
            {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Type</label>
            <select {...register('type')} className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Category</label>
            <select {...register('category')} className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat as TransactionCategory] ?? cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Frequency</label>
            <select {...register('frequency')} className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
              {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        {frequency === 'monthly' && (
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Day of month</label>
            <input {...register('day_of_month')} type="number" min={1} max={31} placeholder="e.g. 1" className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Start date</label>
            <input {...register('start_date')} type="date" className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">End date (optional)</label>
            <input {...register('end_date')} type="date" className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Merchant (optional)</label>
          <input {...register('merchant')} placeholder="e.g. Netflix" className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={isLoading} className="w-full bg-[var(--color-accent)] text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50">
          {isLoading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
        </button>
      </form>
    </Modal>
  );
}

export default function RecurringPage() {
  const { items, isLoading, fetchRecurring, deleteRecurring, updateRecurring } = useRecurringStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);

  useEffect(() => { fetchRecurring(); }, [fetchRecurring]);

  const active = items.filter((r) => r.is_active);
  const paused = items.filter((r) => !r.is_active);

  const toggle = async (item: RecurringTransaction) => {
    await updateRecurring(item.id, { is_active: !item.is_active });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Recurring Transactions"
        subtitle="Auto-log fixed income and expenses on a schedule"
        action={
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="flex items-center gap-2 bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
            <Plus size={16} /> New Recurring
          </button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-[var(--color-text-secondary)]">Loading…</div>
      ) : items.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] rounded-2xl p-12 text-center border border-[var(--color-border)]">
          <RefreshCw size={40} className="mx-auto mb-4 text-[var(--color-text-secondary)] opacity-40" />
          <p className="text-[var(--color-text-secondary)]">No recurring transactions yet. Add rent, salary, subscriptions — anything on a fixed schedule.</p>
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="mt-4 bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
            Add first
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {[{ label: 'Active', data: active }, { label: 'Paused', data: paused }].map(({ label, data }) =>
            data.length > 0 ? (
              <div key={label}>
                <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">{label}</h3>
                <div className="space-y-2">
                  <AnimatePresence>
                    {data.map((item) => (
                      <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center text-lg shrink-0">
                          {CATEGORY_ICONS[item.category as TransactionCategory] ?? '💳'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-[var(--color-text-primary)] truncate">{item.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                              {FREQ_LABELS[item.frequency]}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                            Next: {formatDate(item.next_due_date)} · {item.category}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`font-semibold text-sm ${item.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => toggle(item)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]">
                            {item.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                          <button onClick={() => { setEditing(item); setModalOpen(true); }} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => deleteRecurring(item.id)} className="text-[var(--color-text-secondary)] hover:text-red-400">
                            <Trash2 size={15} />
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

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { useNetWorthStore } from '@/stores/useNetWorthStore';
import { Liability, LiabilityType } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';

const LIABILITY_CONFIG: { value: LiabilityType; label: string; icon: string }[] = [
  { value: 'mortgage',      label: 'Mortgage',      icon: '🏠' },
  { value: 'auto_loan',     label: 'Auto Loan',     icon: '🚗' },
  { value: 'student_loan',  label: 'Student Loan',  icon: '🎓' },
  { value: 'credit_card',   label: 'Credit Card',   icon: '💳' },
  { value: 'personal_loan', label: 'Personal Loan', icon: '🤝' },
  { value: 'other',         label: 'Other',         icon: '📋' },
];

const LIABILITY_LABELS: Record<LiabilityType, string> = Object.fromEntries(
  LIABILITY_CONFIG.map(({ value, label }) => [value, label])
) as Record<LiabilityType, string>;

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.enum(['mortgage', 'auto_loan', 'student_loan', 'credit_card', 'personal_loan', 'other']),
  balance: z.coerce.number().min(0),
  interest_rate: z.coerce.number().min(0).max(100),
  minimum_payment: z.coerce.number().min(0),
});
type FormData = z.infer<typeof schema>;

function LiabilityModal({ isOpen, onClose, item }: { isOpen: boolean; onClose: () => void; item?: Liability | null }) {
  const { addLiability, updateLiability } = useNetWorthStore();
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!item;

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { type: 'personal_loan' },
  });

  useEffect(() => {
    if (item) reset({ name: item.name, type: item.type, balance: item.balance, interest_rate: item.interest_rate, minimum_payment: item.minimum_payment });
    else reset({ type: 'personal_loan', balance: undefined, interest_rate: undefined, minimum_payment: undefined });
  }, [item, reset, isOpen]);

  const selectedType = watch('type');

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      if (isEdit && item) await updateLiability(item.id, data as Partial<Liability>);
      else await addLiability(data as Partial<Liability>);
      onClose();
    } finally { setIsLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Liability' : 'Add Liability'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {LIABILITY_CONFIG.map(({ value, label, icon }) => (
              <label key={value} className="cursor-pointer">
                <input {...register('type')} type="radio" value={value} className="sr-only" />
                <div className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border text-xs font-medium transition-all text-center ${
                  selectedType === value
                    ? 'border-[rgba(239,68,68,0.6)] bg-[rgba(239,68,68,0.12)] text-[var(--color-danger)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[rgba(239,68,68,0.3)]'
                }`}>
                  <span className="text-base">{icon}</span>
                  {label}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Name</label>
          <input {...register('name')} placeholder="e.g. Car Loan, Student Loan" className="input-base" />
          {errors.name && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Balance + Interest + Min payment */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Balance ($)</label>
            <input {...register('balance')} type="number" step="0.01" min={0} placeholder="0.00" className="input-base" />
            {errors.balance && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.balance.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Interest %</label>
            <input {...register('interest_rate')} type="number" step="0.01" min={0} max={100} placeholder="0.00" className="input-base" />
            {errors.interest_rate && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.interest_rate.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Min payment</label>
            <input {...register('minimum_payment')} type="number" step="0.01" min={0} placeholder="0.00" className="input-base" />
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading
            ? <><Loader2 size={16} className="animate-spin" /> {isEdit ? 'Saving...' : 'Adding...'}</>
            : isEdit ? 'Save changes' : 'Add liability'}
        </button>
      </form>
    </Modal>
  );
}

export default function NetWorthPage() {
  const { netWorth, isLoading, fetchNetWorth, deleteLiability } = useNetWorthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Liability | null>(null);

  useEffect(() => { fetchNetWorth(); }, [fetchNetWorth]);

  const nw = netWorth;
  const isPositive = (nw?.netWorth ?? 0) >= 0;

  return (
    <div className="px-4 py-6 sm:px-6 max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Net Worth"
        subtitle="Total assets minus all liabilities"
        action={
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary text-sm">
            <Plus size={16} /> Add Liability
          </button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="card p-8 space-y-4">
            <div className="skeleton h-6 w-32 mx-auto" />
            <div className="skeleton h-12 w-48 mx-auto" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-5 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-4 w-full" />)}
            </div>
            <div className="card p-5 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-4 w-full" />)}
            </div>
          </div>
        </div>
      ) : nw ? (
        <div className="space-y-6">
          {/* Net worth hero */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-8 text-center">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">Your Net Worth</p>
            <div className="flex items-center justify-center gap-3">
              {isPositive
                ? <TrendingUp size={28} className="text-[var(--color-success)]" />
                : <TrendingDown size={28} className="text-[var(--color-danger)]" />}
              <span className={`text-5xl font-bold ${isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                {formatCurrency(nw.netWorth)}
              </span>
            </div>
            <div className="flex justify-center gap-12 mt-6">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">Total Assets</p>
                <p className="text-xl font-semibold text-[var(--color-success)]">{formatCurrency(nw.totalAssets)}</p>
              </div>
              <div className="w-px bg-[var(--color-border)]" />
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">Total Liabilities</p>
                <p className="text-xl font-semibold text-[var(--color-danger)]">{formatCurrency(nw.totalLiabilities)}</p>
              </div>
            </div>
          </motion.div>

          {/* Breakdown grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assets */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Assets Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Card Balances', value: nw.assets.cardBalances },
                  { label: 'Savings Pots', value: nw.assets.savingsPots },
                  { label: 'Goal Savings', value: nw.assets.goalSavings },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">{label}</span>
                    <span className="font-medium text-[var(--color-success)]">{formatCurrency(value)}</span>
                  </div>
                ))}
                <div className="border-t border-[var(--color-border)] pt-3 flex justify-between text-sm font-semibold">
                  <span className="text-[var(--color-text-primary)]">Total Assets</span>
                  <span className="text-[var(--color-success)]">{formatCurrency(nw.totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* Liabilities */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Liabilities</h3>
                <button
                  onClick={() => { setEditing(null); setModalOpen(true); }}
                  className="text-xs text-[var(--color-accent)] hover:opacity-80 font-medium"
                >
                  + Add
                </button>
              </div>
              {nw.liabilities.items.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-6">No liabilities added yet</p>
              ) : (
                <div className="space-y-3">
                  {nw.liabilities.items.map((l) => (
                    <div key={l.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{l.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{LIABILITY_LABELS[l.type]} · {l.interest_rate}% APR</p>
                      </div>
                      <span className="text-sm font-medium text-[var(--color-danger)] shrink-0">{formatCurrency(l.balance)}</span>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => { setEditing(l); setModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deleteLiability(l.id)}
                          className="p-1.5 rounded-lg hover:bg-[rgba(239,68,68,0.1)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-[var(--color-border)] pt-3 flex justify-between text-sm font-semibold">
                    <span className="text-[var(--color-text-primary)]">Total</span>
                    <span className="text-[var(--color-danger)]">{formatCurrency(nw.totalLiabilities)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <LiabilityModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} item={editing} />
    </div>
  );
}

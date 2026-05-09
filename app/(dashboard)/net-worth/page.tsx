'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { useNetWorthStore } from '@/stores/useNetWorthStore';
import { Liability, LiabilityType } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';

const LIABILITY_LABELS: Record<LiabilityType, string> = {
  mortgage: 'Mortgage', auto_loan: 'Auto Loan', student_loan: 'Student Loan',
  credit_card: 'Credit Card', personal_loan: 'Personal Loan', other: 'Other',
};

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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { type: 'personal_loan', balance: 0, interest_rate: 0, minimum_payment: 0 },
  });

  useEffect(() => {
    if (item) reset({ name: item.name, type: item.type, balance: item.balance, interest_rate: item.interest_rate, minimum_payment: item.minimum_payment });
    else reset({ type: 'personal_loan', balance: 0, interest_rate: 0, minimum_payment: 0 });
  }, [item, reset, isOpen]);

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
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Name</label>
          <input {...register('name')} placeholder="e.g. Car Loan" className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Type</label>
          <select {...register('type')} className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
            {Object.entries(LIABILITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Balance</label>
            <input {...register('balance')} type="number" step="0.01" className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Interest %</label>
            <input {...register('interest_rate')} type="number" step="0.01" className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Min payment</label>
            <input {...register('minimum_payment')} type="number" step="0.01" className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <button type="submit" disabled={isLoading} className="w-full bg-[var(--color-accent)] text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50">
          {isLoading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Liability'}
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
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Net Worth"
        subtitle="Total assets minus all liabilities"
        action={
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="flex items-center gap-2 bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
            <Plus size={16} /> Add Liability
          </button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-[var(--color-text-secondary)]">Loading…</div>
      ) : nw ? (
        <div className="space-y-6">
          {/* Net worth hero */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--color-bg-card)] rounded-2xl p-8 border border-[var(--color-border)] text-center">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">Your Net Worth</p>
            <div className="flex items-center justify-center gap-3">
              {isPositive ? <TrendingUp size={28} className="text-green-400" /> : <TrendingDown size={28} className="text-red-400" />}
              <span className={`text-5xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(nw.netWorth)}
              </span>
            </div>
            <div className="flex justify-center gap-8 mt-6">
              <div>
                <p className="text-xs text-[var(--color-text-secondary)]">Total Assets</p>
                <p className="text-xl font-semibold text-green-400 mt-1">{formatCurrency(nw.totalAssets)}</p>
              </div>
              <div className="w-px bg-[var(--color-border)]" />
              <div>
                <p className="text-xs text-[var(--color-text-secondary)]">Total Liabilities</p>
                <p className="text-xl font-semibold text-red-400 mt-1">{formatCurrency(nw.totalLiabilities)}</p>
              </div>
            </div>
          </motion.div>

          {/* Assets breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Assets Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">Card Balances</span>
                  <span className="font-medium text-green-400">{formatCurrency(nw.assets.cardBalances)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">Savings Pots</span>
                  <span className="font-medium text-green-400">{formatCurrency(nw.assets.savingsPots)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">Goal Savings</span>
                  <span className="font-medium text-green-400">{formatCurrency(nw.assets.goalSavings)}</span>
                </div>
                <div className="border-t border-[var(--color-border)] pt-3 flex justify-between text-sm font-semibold">
                  <span>Total Assets</span>
                  <span className="text-green-400">{formatCurrency(nw.totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* Liabilities list */}
            <div className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Liabilities</h3>
                <button onClick={() => { setEditing(null); setModalOpen(true); }} className="text-xs text-[var(--color-accent)] hover:underline">+ Add</button>
              </div>
              {nw.liabilities.items.length === 0 ? (
                <p className="text-sm text-[var(--color-text-secondary)] text-center py-6">No liabilities added yet</p>
              ) : (
                <div className="space-y-3">
                  {nw.liabilities.items.map((l) => (
                    <div key={l.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{l.name}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{LIABILITY_LABELS[l.type]} · {l.interest_rate}% APR</p>
                      </div>
                      <span className="text-sm font-medium text-red-400 shrink-0">{formatCurrency(l.balance)}</span>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditing(l); setModalOpen(true); }} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"><Pencil size={13} /></button>
                        <button onClick={() => deleteLiability(l.id)} className="text-[var(--color-text-secondary)] hover:text-red-400"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-[var(--color-border)] pt-3 flex justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span className="text-red-400">{formatCurrency(nw.totalLiabilities)}</span>
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

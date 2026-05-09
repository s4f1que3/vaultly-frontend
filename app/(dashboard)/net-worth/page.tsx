'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown, Loader2, ChevronDown, ChevronUp, RepeatIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { useNetWorthStore } from '@/stores/useNetWorthStore';
import { Liability, LiabilityType, TransactionCategory } from '@/types';
import { formatCurrency, CATEGORY_LABELS } from '@/lib/utils/formatters';

// ── Constants ──────────────────────────────────────────────────────────────────

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

const QUICK_TERMS = [5, 10, 15, 20, 25, 30];

// ── Loan math ──────────────────────────────────────────────────────────────────

function calcMonthlyPayment(principal: number, annualPct: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  if (annualPct === 0) return principal / (years * 12);
  const r = annualPct / 100 / 12;
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ── Schema ─────────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.enum(['mortgage', 'auto_loan', 'student_loan', 'credit_card', 'personal_loan', 'other']),
  original_amount: z.coerce.number().min(0).optional().or(z.literal('')),
  down_payment: z.coerce.number().min(0).optional().or(z.literal('')),
  interest_rate: z.coerce.number().min(0).max(100),
  term_years: z.coerce.number().min(1).max(50).optional().or(z.literal('')),
  balance: z.coerce.number().min(0),
  minimum_payment: z.coerce.number().min(0),
  start_date: z.string().optional(),
  add_recurring: z.boolean().optional(),
  budget_category: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

// ── Liability Modal ────────────────────────────────────────────────────────────

function LiabilityModal({ isOpen, onClose, item }: { isOpen: boolean; onClose: () => void; item?: Liability | null }) {
  const { addLiability, updateLiability } = useNetWorthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [termYears, setTermYears] = useState<number | null>(null);
  const isEdit = !!item;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { type: 'personal_loan', interest_rate: 0, balance: 0, minimum_payment: 0, add_recurring: false },
  });

  useEffect(() => {
    if (item) {
      setTermYears(item.term_years ?? null);
      reset({
        name: item.name, type: item.type,
        original_amount: item.original_amount ?? '',
        down_payment: item.down_payment ?? '',
        interest_rate: item.interest_rate,
        term_years: item.term_years ?? '',
        balance: item.balance,
        minimum_payment: item.minimum_payment,
        start_date: item.start_date ?? '',
        add_recurring: !!item.budget_category,
        budget_category: item.budget_category ?? '',
      });
    } else {
      setTermYears(null);
      reset({ type: 'personal_loan', interest_rate: 0, balance: 0, minimum_payment: 0, add_recurring: false });
    }
  }, [item, reset, isOpen]);

  const selectedType = watch('type');
  const originalAmount = Number(watch('original_amount')) || 0;
  const downPayment = Number(watch('down_payment')) || 0;
  const interestRate = Number(watch('interest_rate')) || 0;
  const addRecurring = watch('add_recurring');

  const principal = Math.max(0, originalAmount - downPayment);

  const calculatedPayment = useMemo(
    () => termYears ? calcMonthlyPayment(principal, interestRate, termYears) : null,
    [principal, interestRate, termYears]
  );

  const totalCost = calculatedPayment && termYears ? calculatedPayment * termYears * 12 : null;
  const totalInterest = totalCost && principal ? totalCost - principal : null;

  // Auto-fill balance and payment when calculator fields change
  useEffect(() => {
    if (calculatedPayment && !isEdit) {
      setValue('minimum_payment', Math.round(calculatedPayment * 100) / 100);
    }
  }, [calculatedPayment, isEdit, setValue]);

  useEffect(() => {
    if (principal > 0 && !isEdit && !watch('balance')) {
      setValue('balance', principal);
    }
  }, [principal, isEdit, setValue, watch]);

  const onTermClick = (y: number) => {
    setTermYears(y === termYears ? null : y);
    setValue('term_years', y === termYears ? '' : y);
  };

  const allCategories = Object.keys(CATEGORY_LABELS) as TransactionCategory[];

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const payload: Partial<Liability> = {
        name: data.name,
        type: data.type as LiabilityType,
        balance: Number(data.balance),
        interest_rate: Number(data.interest_rate),
        minimum_payment: Number(data.minimum_payment),
        original_amount: data.original_amount ? Number(data.original_amount) : undefined,
        down_payment: data.down_payment ? Number(data.down_payment) : undefined,
        term_years: termYears ?? undefined,
        start_date: data.start_date || undefined,
        budget_category: data.add_recurring && data.budget_category ? data.budget_category : undefined,
      };
      if (isEdit && item) await updateLiability(item.id, payload);
      else await addLiability(payload);
      onClose();
    } finally { setIsLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Liability' : 'Add Loan / Liability'} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {LIABILITY_CONFIG.map(({ value, label, icon }) => (
              <label key={value} className="cursor-pointer">
                <input {...register('type')} type="radio" value={value} className="sr-only" />
                <div className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-all text-center ${
                  selectedType === value
                    ? 'border-[rgba(239,68,68,0.6)] bg-[rgba(239,68,68,0.12)] text-[var(--color-danger)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[rgba(239,68,68,0.3)]'
                }`}>
                  <span className="text-base">{icon}</span>{label}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Loan name</label>
          <input {...register('name')} placeholder="e.g. Home Mortgage, Car Loan" className="input-base" />
          {errors.name && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Loan amount + down payment */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Loan amount ($)</label>
            <input {...register('original_amount')} type="number" step="0.01" min={0} placeholder="e.g. 250000" className="input-base" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Down payment ($)</label>
            <input {...register('down_payment')} type="number" step="0.01" min={0} placeholder="e.g. 50000" className="input-base" />
          </div>
        </div>

        {/* Interest rate */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Annual interest rate (%)</label>
          <input {...register('interest_rate')} type="number" step="0.01" min={0} max={100} placeholder="e.g. 6.5" className="input-base" />
        </div>

        {/* Term */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">Loan term</label>
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_TERMS.map((y) => (
              <button
                key={y} type="button" onClick={() => onTermClick(y)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all flex-1 ${
                  termYears === y
                    ? 'border-[rgba(239,68,68,0.6)] bg-[rgba(239,68,68,0.12)] text-[var(--color-danger)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[rgba(239,68,68,0.3)]'
                }`}
              >{y}yr</button>
            ))}
          </div>
        </div>

        {/* Live calculation result */}
        {calculatedPayment && calculatedPayment > 0 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-[var(--color-surface-2)] p-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Monthly payment</p>
              <p className="text-sm font-bold text-[var(--color-danger)]">{formatCurrency(calculatedPayment)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Total interest</p>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">{formatCurrency(totalInterest ?? 0)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Total cost</p>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">{formatCurrency(totalCost ?? 0)}</p>
            </div>
          </motion.div>
        )}

        {/* Current balance + monthly payment */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Current balance ($)</label>
            <input {...register('balance')} type="number" step="0.01" min={0} placeholder="Amount still owed" className="input-base" />
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">How much you still owe today. For a new loan this equals the loan minus down payment. For an existing loan, enter what's actually remaining.</p>
            {errors.balance && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.balance.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Monthly payment ($)</label>
            <input {...register('minimum_payment')} type="number" step="0.01" min={0} placeholder="0.00" className="input-base" />
          </div>
        </div>

        {/* Start date */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Loan start date <span className="text-[var(--color-text-muted)]">(optional)</span></label>
          <input {...register('start_date')} type="date" className="input-base" />
        </div>

        {/* Add to recurring toggle */}
        <div className="border-t border-[var(--color-border)] pt-4">
          <button type="button" onClick={() => setValue('add_recurring', !addRecurring)}
            className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <RepeatIcon size={14} className="text-[var(--color-text-muted)]" />
              <div className="text-left">
                <p className="text-xs font-medium text-[var(--color-text-secondary)]">Track in recurring transactions</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">Auto-log this payment every month</p>
              </div>
            </div>
            <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${addRecurring ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${addRecurring ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </button>

          {addRecurring && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Budget category</label>
              <select {...register('budget_category')} className="input-base">
                <option value="">Select category…</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat as TransactionCategory] ?? cat}</option>
                ))}
              </select>
            </div>
          )}
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

// ── Liability card in list ─────────────────────────────────────────────────────

function LiabilityCard({
  l, onEdit, onDelete,
}: { l: Liability; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const paidOff = l.original_amount && l.original_amount > 0
    ? ((l.original_amount - (l.down_payment ?? 0) - l.balance) / (l.original_amount - (l.down_payment ?? 0))) * 100
    : null;

  const config = LIABILITY_CONFIG.find((c) => c.value === l.type);

  return (
    <div className="border-b border-[var(--color-border)] last:border-0 py-3">
      <div className="flex items-center gap-3">
        <span className="text-lg w-7 shrink-0">{config?.icon ?? '📋'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{l.name}</p>
            {l.recurring_transaction_id && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium flex items-center gap-0.5">
                <RepeatIcon size={8} /> recurring
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {LIABILITY_LABELS[l.type]} · {l.interest_rate}% APR
            {l.term_years ? ` · ${l.term_years}yr term` : ''}
          </p>
          {paidOff !== null && (
            <div className="mt-1.5">
              <div className="flex justify-between text-[9px] text-[var(--color-text-muted)] mb-0.5">
                <span>{paidOff.toFixed(0)}% paid off</span>
                <span>{formatCurrency(l.balance)} remaining</span>
              </div>
              <div className="h-1 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                <div className="h-full bg-[var(--color-accent)] rounded-full transition-all" style={{ width: `${Math.min(paidOff, 100)}%` }} />
              </div>
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-[var(--color-danger)]">{formatCurrency(l.balance)}</p>
          {l.minimum_payment > 0 && (
            <p className="text-[10px] text-[var(--color-text-muted)]">{formatCurrency(l.minimum_payment)}/mo</p>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {(l.original_amount || l.term_years) && (
            <button onClick={() => setExpanded((v) => !v)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"><Pencil size={13} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-[rgba(239,68,68,0.1)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"><Trash2 size={13} /></button>
        </div>
      </div>

      {/* Expanded loan details */}
      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 ml-10 grid grid-cols-3 gap-2">
          {[
            { label: 'Original amount', value: l.original_amount ? formatCurrency(l.original_amount) : '—' },
            { label: 'Down payment', value: l.down_payment ? formatCurrency(l.down_payment) : '—' },
            { label: 'Monthly payment', value: l.minimum_payment > 0 ? formatCurrency(l.minimum_payment) : '—' },
            { label: 'Term', value: l.term_years ? `${l.term_years} years` : '—' },
            { label: 'Start date', value: l.start_date ? new Date(l.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
            { label: 'Budget', value: l.budget_category ? (CATEGORY_LABELS[l.budget_category as TransactionCategory] ?? l.budget_category) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-[var(--color-surface-2)] p-2 text-center">
              <p className="text-[9px] text-[var(--color-text-muted)] mb-0.5">{label}</p>
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">{value}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

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
            <div className="card p-5 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-4 w-full" />)}</div>
            <div className="card p-5 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-4 w-full" />)}</div>
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

          {/* Breakdown */}
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
                >+ Add</button>
              </div>
              {nw.liabilities.items.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-6">No liabilities added yet</p>
              ) : (
                <div>
                  {nw.liabilities.items.map((l) => (
                    <LiabilityCard
                      key={l.id}
                      l={l}
                      onEdit={() => { setEditing(l); setModalOpen(true); }}
                      onDelete={() => deleteLiability(l.id)}
                    />
                  ))}
                  <div className="pt-3 flex justify-between text-sm font-semibold mt-1">
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

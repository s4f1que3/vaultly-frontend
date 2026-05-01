'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, AlertTriangle, Pencil, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { Budget, TransactionCategory } from '@/types';
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS, formatCurrency, formatPercentage } from '@/lib/utils/formatters';

const schema = z.object({
  category: z.string(),
  limit_amount: z.coerce.number().positive('Must be positive'),
  period: z.enum(['monthly', 'weekly', 'yearly']),
  alert_threshold: z.coerce.number().min(1).max(100),
});
type FormData = z.infer<typeof schema>;

function BudgetModal({ isOpen, onClose, budget }: { isOpen: boolean; onClose: () => void; budget?: Budget | null }) {
  const { addBudget, updateBudget } = useBudgetStore();
  const { customCategories, fetchCategories, createCategory } = useCategoryStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('');
  const [catError, setCatError] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);
  const isEdit = !!budget;

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { category: 'food', period: 'monthly', alert_threshold: 80 },
  });

  useEffect(() => {
    if (budget) {
      reset({ category: budget.category, limit_amount: budget.limit_amount, period: budget.period, alert_threshold: budget.alert_threshold });
    } else {
      reset({ category: 'food', period: 'monthly', alert_threshold: 80 });
    }
    setShowNewCategory(false);
    setNewCatLabel(''); setNewCatEmoji(''); setCatError('');
  }, [budget, reset, isOpen]);

  const handleCreateCategory = async () => {
    if (!newCatLabel.trim()) { setCatError('Name is required'); return; }
    if (!newCatEmoji.trim()) { setCatError('Emoji is required'); return; }
    setCreatingCat(true); setCatError('');
    try {
      const slug = await createCategory(newCatLabel.trim(), newCatEmoji.trim());
      setValue('category', slug);
      setShowNewCategory(false);
      setNewCatLabel(''); setNewCatEmoji('');
    } catch (e: unknown) {
      setCatError(e instanceof Error ? e.message : 'Failed to create category');
    } finally {
      setCreatingCat(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      if (isEdit && budget) {
        const { category: _cat, period: _period, ...updateData } = data;
        await updateBudget(budget.id, updateData as Partial<Budget>);
      } else {
        await addBudget(data as Partial<Budget>);
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const defaultKeys = Object.keys(CATEGORY_LABELS) as TransactionCategory[];
  const allCategories = [
    ...defaultKeys,
    ...customCategories
      .filter((c) => !defaultKeys.includes(c.name as TransactionCategory))
      .map((c) => c.name as TransactionCategory),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Budget' : 'Create Budget'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Category</label>
          <select
            {...register('category')}
            disabled={isEdit}
            className={`input-base ${isEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {(CATEGORY_ICONS as Record<string, string>)[c] || '📦'}{' '}
                {(CATEGORY_LABELS as Record<string, string>)[c] || c}
              </option>
            ))}
          </select>

          {/* Create custom category */}
          {!isEdit && (
            <div className="mt-2">
              {!showNewCategory ? (
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
                >
                  <Plus size={11} /> Create custom category
                </button>
              ) : (
                <div className="mt-2 p-3 bg-[var(--color-surface-2)] rounded-xl space-y-2">
                  <p className="text-xs font-medium text-[var(--color-text-secondary)]">New category</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="😊"
                      value={newCatEmoji}
                      onChange={(e) => setNewCatEmoji(e.target.value)}
                      className="input-base w-16 text-center text-lg"
                      maxLength={4}
                    />
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCatLabel}
                      onChange={(e) => setNewCatLabel(e.target.value)}
                      className="input-base flex-1 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={creatingCat}
                      className="btn-primary px-3 text-xs flex-shrink-0"
                    >
                      {creatingCat ? <Loader2 size={13} className="animate-spin" /> : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewCategory(false); setCatError(''); }}
                      className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    >
                      ✕
                    </button>
                  </div>
                  {catError && <p className="text-xs text-[var(--color-danger)]">{catError}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Budget limit ($)</label>
          <input {...register('limit_amount')} type="number" step="0.01" placeholder="500.00" className="input-base" />
          {errors.limit_amount && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.limit_amount.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Period</label>
          <select {...register('period')} className="input-base">
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Alert at (%)</label>
          <input {...register('alert_threshold')} type="number" min="1" max="100" placeholder="80" className="input-base" />
          <p className="text-xs text-[var(--color-text-muted)] mt-1">You&apos;ll be alerted when spending reaches this threshold</p>
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : isEdit ? 'Save changes' : 'Create budget'}
        </button>
      </form>
    </Modal>
  );
}

export default function BudgetsPage() {
  const { budgets, isLoading, fetchBudgets, deleteBudget } = useBudgetStore();
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  const totalBudgeted = budgets.reduce((s, b) => s + b.limit_amount + (b.income_amount ?? 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent_amount, 0);
  const alertCount = budgets.filter((b) => {
    const effective = b.limit_amount + (b.income_amount ?? 0);
    return effective > 0 && (b.spent_amount / effective) * 100 >= b.alert_threshold;
  }).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Budgets"
        subtitle="Set spending limits and track your categories"
        action={
          <button onClick={() => { setEditBudget(null); setShowModal(true); }} className="btn-primary text-sm">
            <Plus size={16} /> Create budget
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Total Budgeted</p>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">{formatCurrency(totalBudgeted)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Total Spent</p>
          <p className="text-lg font-bold text-[var(--color-danger)]">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Alerts</p>
          <p className="text-lg font-bold text-[var(--color-warning)]">{alertCount} active</p>
        </div>
      </div>

      {/* Budget list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-8 w-24" />
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-12 text-center">
          <div className="text-4xl mb-3">💰</div>
          <p className="text-[var(--color-text-secondary)] font-medium">No budgets yet</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-4">Create budgets to control your spending by category</p>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm"><Plus size={16} /> Create budget</button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {budgets.map((b, i) => {
              const effectiveLimit = b.limit_amount + (b.income_amount ?? 0);
              const pct = effectiveLimit > 0 ? Math.min((b.spent_amount / effectiveLimit) * 100, 100) : 0;
              const isAlert = pct >= b.alert_threshold;
              const isOver = pct >= 100;
              const remaining = effectiveLimit - b.spent_amount;

              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className="card p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${CATEGORY_COLORS[b.category]}20` }}>
                        {CATEGORY_ICONS[b.category]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{CATEGORY_LABELS[b.category]}</p>
                        <p className="text-xs text-[var(--color-text-muted)] capitalize">{b.period}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isAlert && !isOver && <AlertTriangle size={14} className="text-[var(--color-warning)]" />}
                      {isOver && <AlertTriangle size={14} className="text-[var(--color-danger)]" />}
                      <button onClick={() => { setEditBudget(b); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteBudget(b.id)} className="p-1.5 rounded-lg hover:bg-[rgba(239,68,68,0.1)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.04 }}
                      className="h-full rounded-full"
                      style={{
                        background: isOver
                          ? 'var(--color-danger)'
                          : isAlert
                          ? 'var(--color-warning)'
                          : CATEGORY_COLORS[b.category],
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-xs text-[var(--color-text-muted)]">
                      <span className="font-medium text-[var(--color-text-primary)]">{formatCurrency(b.spent_amount)}</span> of {formatCurrency(effectiveLimit)}
                      {(b.income_amount ?? 0) > 0 && (
                        <span className="text-[var(--color-accent)] ml-1">(+{formatCurrency(b.income_amount)} income)</span>
                      )}
                    </p>
                    <p className={`text-xs font-semibold ${remaining < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)]'}`}>
                      {remaining < 0 ? 'Over by ' : ''}{formatCurrency(Math.abs(remaining))} {remaining >= 0 ? 'left' : ''}
                    </p>
                  </div>

                  <div className="mt-2">
                    <span className={`badge ${isOver ? 'badge-red' : isAlert ? 'badge-yellow' : 'badge-green'}`}>
                      {formatPercentage(pct)} used
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <BudgetModal isOpen={showModal} onClose={() => { setShowModal(false); setEditBudget(null); }} budget={editBudget} />
    </div>
  );
}

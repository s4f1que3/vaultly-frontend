'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, PlusCircle, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { useGoalStore } from '@/stores/useGoalStore';
import { Goal } from '@/types';
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils/formatters';

const GOAL_ICONS = ['🎯', '🏠', '✈️', '🚗', '💻', '🎓', '💍', '🏋️', '📚', '🎸', '🌴', '💰'];

const schema = z.object({
  name: z.string().min(1, 'Required'),
  target_amount: z.coerce.number().positive('Must be positive'),
  current_amount: z.coerce.number().min(0),
  deadline: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const contributeSchema = z.object({ amount: z.coerce.number().positive('Must be positive') });
type ContributeData = z.infer<typeof contributeSchema>;

function GoalModal({ isOpen, onClose, goal }: { isOpen: boolean; onClose: () => void; goal?: Goal | null }) {
  const { addGoal, updateGoal } = useGoalStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(goal?.icon || '🎯');
  const isEdit = !!goal;

  const { register, handleSubmit, reset, setValue } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { current_amount: 0 },
  });

  useEffect(() => {
    if (goal) {
      reset({ name: goal.name, target_amount: goal.target_amount, current_amount: goal.current_amount, deadline: goal.deadline?.split('T')[0], icon: goal.icon });
      setSelectedIcon(goal.icon || '🎯');
    } else {
      reset({ current_amount: 0 });
      setSelectedIcon('🎯');
    }
  }, [goal, reset]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const payload = { ...data, icon: selectedIcon };
      if (isEdit && goal) {
        await updateGoal(goal.id, payload as Partial<Goal>);
      } else {
        await addGoal(payload as Partial<Goal>);
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Goal' : 'New Savings Goal'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">Choose an icon</label>
          <div className="flex flex-wrap gap-2">
            {GOAL_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => { setSelectedIcon(icon); setValue('icon', icon); }}
                className={`text-xl p-2 rounded-xl transition-all ${selectedIcon === icon ? 'bg-[var(--color-accent-dim)] ring-1 ring-[var(--color-accent)]' : 'hover:bg-[var(--color-surface-2)]'}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Goal name</label>
          <input {...register('name')} placeholder="e.g. Emergency Fund" className="input-base" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Target amount ($)</label>
            <input {...register('target_amount')} type="number" step="0.01" placeholder="10000.00" className="input-base" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Current savings ($)</label>
            <input {...register('current_amount')} type="number" step="0.01" placeholder="0.00" className="input-base" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Target date (optional)</label>
          <input {...register('deadline')} type="date" className="input-base" />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : isEdit ? 'Save changes' : 'Create goal'}
        </button>
      </form>
    </Modal>
  );
}

function ContributeModal({ isOpen, onClose, goal }: { isOpen: boolean; onClose: () => void; goal: Goal | null }) {
  const { contributeToGoal } = useGoalStore();
  const [isLoading, setIsLoading] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContributeData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(contributeSchema) as any,
  });

  useEffect(() => {
    if (!isOpen) { reset(); setJustCompleted(false); }
  }, [isOpen, reset]);

  const onSubmit = async (data: ContributeData) => {
    if (!goal) return;
    setIsLoading(true);
    try {
      const newAmount = goal.current_amount + data.amount;
      await contributeToGoal(goal.id, data.amount);
      if (newAmount >= goal.target_amount) {
        setJustCompleted(true);
        // Trigger confetti
        if (typeof window !== 'undefined') {
          import('canvas-confetti').then((m) => {
            m.default({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#57c93c', '#a8ff87', '#f0ece4'] });
          });
        }
        setTimeout(onClose, 2500);
      } else {
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Contribution">
      {justCompleted ? (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="text-lg font-bold text-[var(--color-accent)]">Goal Achieved!</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            Congratulations! You&apos;ve reached your {goal?.name} goal!
          </p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {goal && (
            <div className="bg-[var(--color-surface-2)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{goal.icon || '🎯'}</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{goal.name}</span>
              </div>
              <div className="h-2 bg-[var(--color-surface)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-accent)] rounded-full"
                  style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
              </p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Contribution amount ($)</label>
            <input {...register('amount')} type="number" step="0.01" placeholder="100.00" className="input-base" autoFocus />
            {errors.amount && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.amount.message}</p>}
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> Adding...</> : 'Add contribution'}
          </button>
        </form>
      )}
    </Modal>
  );
}

export default function GoalsPage() {
  const { goals, isLoading, fetchGoals, deleteGoal } = useGoalStore();
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const active = goals.filter((g) => g.status === 'active');
  const completed = goals.filter((g) => g.status === 'completed');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Savings Goals"
        subtitle={`${active.length} active · ${completed.length} completed`}
        action={
          <button onClick={() => { setEditGoal(null); setShowModal(true); }} className="btn-primary text-sm">
            <Plus size={16} /> New goal
          </button>
        }
      />

      {/* Active goals */}
      <div className="mb-8">
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Active Goals</p>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => <div key={i} className="card p-5 space-y-3"><div className="skeleton h-6 w-48" /><div className="skeleton h-3 w-full" /><div className="skeleton h-4 w-32" /></div>)}
          </div>
        ) : active.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-12 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-[var(--color-text-secondary)] font-medium">No active goals</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-4">Set savings goals to stay motivated</p>
            <button onClick={() => setShowModal(true)} className="btn-primary text-sm"><Plus size={16} /> Create goal</button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {active.map((g, i) => {
                const pct = Math.min((g.current_amount / g.target_amount) * 100, 100);
                const remaining = g.target_amount - g.current_amount;
                return (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="card p-5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{g.icon || '🎯'}</div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{g.name}</p>
                          {g.deadline && (
                            <p className="text-xs text-[var(--color-text-muted)]">Due {formatDate(g.deadline)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditGoal(g); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteGoal(g.id)} className="p-1.5 rounded-lg hover:bg-[rgba(239,68,68,0.1)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1.5">
                        <span>{formatPercentage(pct)} complete</span>
                        <span>{formatCurrency(remaining)} to go</span>
                      </div>
                      <div className="h-3 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.05 }}
                          className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[#a8ff87]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">Saved</p>
                        <p className="text-base font-bold text-[var(--color-text-primary)]">{formatCurrency(g.current_amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[var(--color-text-muted)]">Target</p>
                        <p className="text-base font-bold text-[var(--color-text-secondary)]">{formatCurrency(g.target_amount)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setContributeGoal(g)}
                      className="btn-ghost w-full mt-4 text-sm"
                    >
                      <PlusCircle size={15} /> Add savings
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Completed goals */}
      {completed.length > 0 && (
        <div>
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Completed 🎉</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completed.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="card p-4 opacity-70"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-[var(--color-accent)] flex-shrink-0" />
                  <span className="text-base">{g.icon || '🎯'}</span>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{g.name}</p>
                    <p className="text-xs text-[var(--color-accent)]">{formatCurrency(g.target_amount)} achieved</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <GoalModal isOpen={showModal} onClose={() => { setShowModal(false); setEditGoal(null); }} goal={editGoal} />
      <ContributeModal isOpen={!!contributeGoal} onClose={() => setContributeGoal(null)} goal={contributeGoal} />
    </div>
  );
}

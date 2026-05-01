'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, RefreshCw, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import SubscriptionModal from '@/components/subscriptions/SubscriptionModal';
import { useSubscriptionStore } from '@/stores/useSubscriptionStore';
import { useCardStore } from '@/stores/useCardStore';
import { Subscription } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function ordinal(n: number) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function billingLabel(sub: Subscription) {
  if (sub.period === 'monthly') return `Every month on the ${ordinal(sub.billing_day)}`;
  const month = sub.billing_month ? MONTHS[sub.billing_month - 1] : 'Jan';
  return `Every year on ${month} ${ordinal(sub.billing_day)}`;
}

function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff < 0) return 'Processing…';
  return `Due in ${diff} days`;
}

export default function SubscriptionsPage() {
  const { subscriptions, isLoading, error, fetchSubscriptions, deleteSubscription } = useSubscriptionStore();
  const { cards } = useCardStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | undefined>();

  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

  const active = subscriptions.filter(s => s.is_active);
  const monthlyTotal = active.reduce((sum, s) => {
    return sum + (s.period === 'monthly' ? s.amount : s.amount / 12);
  }, 0);
  const yearlyTotal = active.reduce((sum, s) => {
    return sum + (s.period === 'yearly' ? s.amount : s.amount * 12);
  }, 0);

  const openAdd = () => { setEditing(undefined); setModalOpen(true); };
  const openEdit = (s: Subscription) => { setEditing(s); setModalOpen(true); };

  const cardLabel = (cardId?: string) => {
    if (!cardId) return null;
    const card = cards.find(c => c.id === cardId);
    return card ? `•••• ${card.card_number}` : null;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Subscriptions"
        subtitle={`${active.length} active subscription${active.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={openAdd} className="btn-primary text-sm">
            <Plus size={16} /> Add
          </button>
        }
      />

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 flex flex-col gap-1"
        >
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Monthly cost</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(monthlyTotal)}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">across all subscriptions</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-5 flex flex-col gap-1"
        >
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Yearly cost</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(yearlyTotal)}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">total per year</p>
        </motion.div>
      </div>

      {/* Subscription list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-8 flex flex-col items-center gap-3 text-center"
        >
          <AlertCircle size={28} className="text-[var(--color-danger)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">{error}</p>
          <button onClick={fetchSubscriptions} className="btn-ghost text-sm">Try again</button>
        </motion.div>
      ) : active.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-12 text-center"
        >
          <RefreshCw size={32} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="text-[var(--color-text-secondary)] font-medium">No subscriptions yet</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Add your recurring services to track them automatically</p>
          <button onClick={openAdd} className="btn-primary text-sm mt-4">
            <Plus size={16} /> Add subscription
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {active.map((sub, i) => {
              const label = cardLabel(sub.card_id);
              const due = daysUntil(sub.next_due_date);
              const isDueSoon = new Date(sub.next_due_date).getTime() - Date.now() < 3 * 86400000;

              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className="card card-hover p-4 flex items-center gap-4"
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${sub.color ?? '#57c93c'}22`, border: `1px solid ${sub.color ?? '#57c93c'}44` }}
                  >
                    {sub.icon ?? '💳'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[var(--color-text-primary)] truncate">{sub.company}</p>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: `${sub.color ?? '#57c93c'}22`, color: sub.color ?? '#57c93c' }}>
                        {sub.period}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                        <Calendar size={11} /> {billingLabel(sub)}
                      </span>
                      {label && (
                        <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                          <CreditCard size={11} /> {label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[var(--color-text-primary)]">{formatCurrency(sub.amount)}</p>
                    <p className={`text-xs mt-0.5 ${isDueSoon ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-muted)]'}`}>
                      {due}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(sub)}
                      className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteSubscription(sub.id)}
                      className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[rgba(239,68,68,0.1)] transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <SubscriptionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(undefined); }}
        subscription={editing}
      />
    </div>
  );
}

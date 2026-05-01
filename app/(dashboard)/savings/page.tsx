'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, PiggyBank, X, Check } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useSavingsStore, SavingsPot } from '@/stores/useSavingsStore';
import { formatCurrency } from '@/lib/utils/formatters';

const EMOJI_SUGGESTIONS = ['💰', '🏦', '✈️', '🏠', '🚗', '🎓', '💊', '🛍️', '🌴', '💍', '📱', '🎮'];

interface PotFormData {
  name: string;
  emoji: string;
  amount: string;
  notes: string;
}

const emptyForm = (): PotFormData => ({ name: '', emoji: '💰', amount: '', notes: '' });

interface PotModalProps {
  isOpen: boolean;
  onClose: () => void;
  pot?: SavingsPot | null;
}

function PotModal({ isOpen, onClose, pot }: PotModalProps) {
  const { addPot, updatePot } = useSavingsStore();
  const [form, setForm] = useState<PotFormData>(emptyForm());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!pot;

  useEffect(() => {
    if (pot) {
      setForm({ name: pot.name, emoji: pot.emoji, amount: String(pot.amount), notes: pot.notes || '' });
    } else {
      setForm(emptyForm());
    }
    setError('');
  }, [pot, isOpen]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.emoji.trim()) { setError('Emoji is required'); return; }
    const amount = parseFloat(form.amount) || 0;
    if (amount < 0) { setError('Amount cannot be negative'); return; }

    setIsLoading(true);
    setError('');
    try {
      if (isEdit && pot) {
        await updatePot(pot.id, { name: form.name.trim(), emoji: form.emoji.trim(), amount, notes: form.notes.trim() || undefined });
      } else {
        await addPot({ name: form.name.trim(), emoji: form.emoji.trim(), amount, notes: form.notes.trim() || undefined });
      }
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md card p-6 z-10"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            {isEdit ? 'Edit savings pot' : 'New savings pot'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">Icon</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {EMOJI_SUGGESTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                    form.emoji === e
                      ? 'bg-[var(--color-accent-dim)] border-2 border-[var(--color-accent)] scale-110'
                      : 'bg-[var(--color-surface-2)] border-2 border-transparent hover:border-[var(--color-border-hover)]'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or type any emoji"
              value={form.emoji}
              onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
              className="input-base text-sm"
              maxLength={4}
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Name</label>
            <input
              type="text"
              placeholder="e.g. Emergency Fund"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input-base"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Current amount ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="input-base"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. 3-month emergency fund"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="input-base"
            />
          </div>

          {error && (
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
          )}

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading
              ? <><Loader2 size={15} className="animate-spin" /> {isEdit ? 'Saving…' : 'Creating…'}</>
              : isEdit ? 'Save changes' : 'Create pot'
            }
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function SavingsPage() {
  const { pots, isLoading, fetchPots, deletePot } = useSavingsStore();
  const [showModal, setShowModal] = useState(false);
  const [editPot, setEditPot] = useState<SavingsPot | null>(null);

  useEffect(() => { fetchPots(); }, [fetchPots]);

  const totalSaved = pots.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Savings"
        subtitle={`${pots.length} pot${pots.length !== 1 ? 's' : ''} · Total saved ${formatCurrency(totalSaved)}`}
        action={
          <button
            onClick={() => { setEditPot(null); setShowModal(true); }}
            className="btn-primary text-sm"
          >
            <Plus size={16} /> Add savings pot
          </button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-10 w-10 rounded-2xl" />
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-6 w-24" />
            </div>
          ))}
        </div>
      ) : pots.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-12 text-center">
          <PiggyBank size={40} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
          <p className="font-medium text-[var(--color-text-secondary)]">No savings pots yet</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-4">
            Create pots to track money saved for different purposes
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
            <Plus size={16} /> Add savings pot
          </button>
        </motion.div>
      ) : (
        <>
          {/* Summary card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5 mb-6 flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Total saved</p>
              <p className="text-2xl font-bold text-[var(--color-accent)]">{formatCurrency(totalSaved)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Pots</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{pots.length}</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {pots.map((pot, i) => (
                <motion.div
                  key={pot.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className="card p-5 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{pot.emoji}</span>
                      <div>
                        <p className="font-semibold text-[var(--color-text-primary)] text-sm">{pot.name}</p>
                        {pot.notes && (
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-1">{pot.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditPot(pot); setShowModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deletePot(pot.id)}
                        className="p-1.5 rounded-lg hover:bg-[rgba(239,68,68,0.1)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                      {formatCurrency(pot.amount)}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">saved</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      <AnimatePresence>
        {showModal && (
          <PotModal
            isOpen={showModal}
            onClose={() => { setShowModal(false); setEditPot(null); }}
            pot={editPot}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

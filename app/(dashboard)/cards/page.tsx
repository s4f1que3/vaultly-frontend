'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Star, MoreVertical } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import CreditCard from '@/components/cards/CreditCard';
import AddCardModal from '@/components/cards/AddCardModal';
import { useCardStore } from '@/stores/useCardStore';
import { formatCurrency } from '@/lib/utils/formatters';
import { CardSkeleton } from '@/components/ui/Skeleton';

export default function CardsPage() {
  const { cards, isLoading, fetchCards, deleteCard, setDefault } = useCardStore();
  const [showAdd, setShowAdd] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const totalBalance = cards.reduce((s, c) => s + c.balance, 0);
  const defaultCard = cards.find((c) => c.is_default);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="My Cards"
        subtitle={`${cards.length} card${cards.length !== 1 ? 's' : ''} · Total balance ${formatCurrency(totalBalance)}`}
        action={
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
            <Plus size={16} /> Add card
          </button>
        }
      />

      {/* Default card hero */}
      {defaultCard && (
        <div className="mb-8">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Default card</p>
          <CreditCard card={defaultCard} />
        </div>
      )}

      {/* All cards grid */}
      <div>
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-4">All cards</p>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : cards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-12 text-center"
          >
            <div className="text-4xl mb-3">💳</div>
            <p className="text-[var(--color-text-secondary)] font-medium">No cards yet</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-4">Add your first card to get started</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
              <Plus size={16} /> Add card
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-5 relative"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Balance</p>
                    <p className="text-xl font-bold text-[var(--color-text-primary)]">{formatCurrency(card.balance)}</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === card.id ? null : card.id)}
                      className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {menuOpen === card.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-0 top-10 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl p-1 z-10 min-w-[140px] shadow-xl"
                      >
                        {!card.is_default && (
                          <button
                            onClick={() => { setDefault(card.id); setMenuOpen(null); }}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] w-full rounded-lg"
                          >
                            <Star size={14} /> Set as default
                          </button>
                        )}
                        <button
                          onClick={() => { deleteCard(card.id); setMenuOpen(null); }}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[rgba(239,68,68,0.1)] w-full rounded-lg"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>

                <CreditCard card={card} mini />

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-[var(--color-surface-2)] rounded-xl p-3">
                    <p className="text-xs text-[var(--color-text-muted)]">Credit Limit</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-1">{formatCurrency(card.credit_limit)}</p>
                  </div>
                  <div className="bg-[var(--color-surface-2)] rounded-xl p-3">
                    <p className="text-xs text-[var(--color-text-muted)]">Available</p>
                    <p className="text-sm font-semibold text-[var(--color-accent)] mt-1">{formatCurrency(card.credit_limit - card.balance)}</p>
                  </div>
                </div>

                {card.is_default && (
                  <span className="absolute top-5 left-5 badge badge-green">Default</span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AddCardModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}

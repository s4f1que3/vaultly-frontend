'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import CreditCard from '@/components/cards/CreditCard';
import { useCardStore } from '@/stores/useCardStore';
import { Transaction } from '@/types';
import api from '@/lib/api';
import {
  formatCurrency,
  formatDate,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from '@/lib/utils/formatters';
import { PaginatedResponse } from '@/types';

const TYPE_CONFIG = {
  income:   { icon: TrendingUp,       color: 'var(--color-income)',  label: 'Income' },
  expense:  { icon: TrendingDown,     color: 'var(--color-danger)',  label: 'Expense' },
  transfer: { icon: ArrowLeftRight,   color: '#3b82f6',              label: 'Transfer' },
};

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { cards, fetchCards } = useCardStore();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    const params = new URLSearchParams({ cardId: id, page: String(page), limit: '20' });
    api.get<PaginatedResponse<Transaction>>(`/transactions?${params}`)
      .then((res) => {
        setTransactions(res.data);
        setTotalPages(res.meta.totalPages);
      })
      .finally(() => setIsLoading(false));
  }, [id, page]);

  const card = cards.find((c) => c.id === id);

  const totalSpent   = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome  = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalTx      = transactions.length;

  return (
    <div className="px-4 py-6 sm:px-6 max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to cards
      </button>

      {/* Card visual */}
      {card && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <CreditCard card={card} />

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5">
            <div className="card p-3 sm:p-4">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Transactions</p>
              <p className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">{totalTx}</p>
            </div>
            <div className="card p-3 sm:p-4">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Spent</p>
              <p className="text-lg sm:text-xl font-bold text-[var(--color-danger)]">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="card p-3 sm:p-4">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Income</p>
              <p className="text-lg sm:text-xl font-bold text-[var(--color-income,#57c93c)]">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transactions */}
      <div>
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
          Transactions
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-3)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded bg-[var(--color-surface-3)]" />
                    <div className="h-2.5 w-20 rounded bg-[var(--color-surface-3)]" />
                  </div>
                  <div className="h-4 w-16 rounded bg-[var(--color-surface-3)]" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-12 text-center"
          >
            <div className="text-4xl mb-3">💳</div>
            <p className="text-[var(--color-text-secondary)] font-medium">No transactions yet</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Transactions made with this card will appear here.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-2">
              {transactions.map((tx, i) => {
                const typeConf = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.expense;
                const TypeIcon = typeConf.icon;
                const catColor = (CATEGORY_COLORS as Record<string, string>)[tx.category] ?? '#6366f1';
                const catIcon  = (CATEGORY_ICONS  as Record<string, string>)[tx.category] ?? '📦';
                const catLabel = (CATEGORY_LABELS as Record<string, string>)[tx.category] ?? tx.category;
                const isExpense = tx.type === 'expense';

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="card p-4 flex items-center gap-4"
                  >
                    {/* Category icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: `${catColor}20`, border: `1px solid ${catColor}33` }}
                    >
                      {catIcon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                        {tx.merchant || tx.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[var(--color-text-muted)]">{formatDate(tx.date)}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">·</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{catLabel}</span>
                      </div>
                    </div>

                    {/* Amount + type */}
                    <div className="text-right shrink-0">
                      <p
                        className="text-sm font-bold"
                        style={{ color: isExpense ? 'var(--color-danger)' : typeConf.color }}
                      >
                        {isExpense ? '-' : '+'}{formatCurrency(tx.amount)}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <TypeIcon size={10} style={{ color: typeConf.color }} />
                        <span className="text-[10px]" style={{ color: typeConf.color }}>{typeConf.label}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] disabled:opacity-40 hover:bg-[var(--color-surface-2)] transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-[var(--color-text-muted)]">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] disabled:opacity-40 hover:bg-[var(--color-surface-2)] transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

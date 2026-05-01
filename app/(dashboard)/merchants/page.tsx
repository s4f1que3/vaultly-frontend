'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, ChevronRight, ArrowLeft, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Transaction, PaginatedResponse } from '@/types';
import api from '@/lib/api';
import {
  formatCurrency,
  formatDate,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from '@/lib/utils/formatters';

interface MerchantSummary {
  merchant: string;
  count: number;
  total: number;
  lastDate: string;
}

const TYPE_CONFIG = {
  income:   { icon: TrendingUp,     color: 'var(--color-income,#57c93c)', label: 'Income' },
  expense:  { icon: TrendingDown,   color: 'var(--color-danger)',          label: 'Expense' },
  transfer: { icon: ArrowLeftRight, color: '#3b82f6',                      label: 'Transfer' },
};

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<string | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  useEffect(() => {
    api.get<MerchantSummary[]>('/transactions/merchants')
      .then(setMerchants)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setTxLoading(true);
    const params = new URLSearchParams({ merchant: selected, page: String(txPage), limit: '20' });
    api.get<PaginatedResponse<Transaction>>(`/transactions?${params}`)
      .then((res) => {
        setTxs(res.data);
        setTxTotalPages(res.meta.totalPages);
      })
      .finally(() => setTxLoading(false));
  }, [selected, txPage]);

  function openMerchant(name: string) {
    setSelected(name);
    setTxPage(1);
    setTxs([]);
  }

  function closeMerchant() {
    setSelected(null);
    setTxs([]);
    setTxPage(1);
  }

  const filtered = merchants.filter((m) =>
    m.merchant.toLowerCase().includes(search.toLowerCase())
  );

  // ── Merchant detail view ──────────────────────────────────────────────────
  if (selected) {
    const summary = merchants.find((m) => m.merchant === selected);
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button
          onClick={closeMerchant}
          className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to merchants
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-2xl shrink-0">
            🏪
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{selected}</h1>
            {summary && (
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                {summary.count} transaction{summary.count !== 1 ? 's' : ''} · {formatCurrency(summary.total)} spent
              </p>
            )}
          </div>
        </div>

        {/* Transactions */}
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Transactions</p>

        {txLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
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
        ) : txs.length === 0 ? (
          <div className="card p-10 text-center text-[var(--color-text-muted)] text-sm">No transactions found.</div>
        ) : (
          <div className="space-y-2">
            {txs.map((tx, i) => {
              const typeConf = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.expense;
              const TypeIcon = typeConf.icon;
              const catColor = (CATEGORY_COLORS as Record<string, string>)[tx.category] ?? '#6366f1';
              const catIcon  = (CATEGORY_ICONS  as Record<string, string>)[tx.category] ?? '📦';
              const catLabel = (CATEGORY_LABELS as Record<string, string>)[tx.category] ?? tx.category;

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="card p-4 flex items-center gap-4"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: `${catColor}20`, border: `1px solid ${catColor}33` }}
                  >
                    {catIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[var(--color-text-muted)]">{formatDate(tx.date)}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">·</span>
                      <span className="text-xs text-[var(--color-text-muted)]">{catLabel}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: tx.type === 'expense' ? 'var(--color-danger)' : typeConf.color }}>
                      {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
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
        )}

        {txTotalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setTxPage((p) => Math.max(1, p - 1))}
              disabled={txPage === 1}
              className="px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] disabled:opacity-40 hover:bg-[var(--color-surface-2)] transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-[var(--color-text-muted)]">{txPage} / {txTotalPages}</span>
            <button
              onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
              disabled={txPage === txTotalPages}
              className="px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] disabled:opacity-40 hover:bg-[var(--color-surface-2)] transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Merchants list view ───────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Merchants"
        subtitle={`${merchants.length} merchant${merchants.length !== 1 ? 's' : ''} with recorded transactions`}
      />

      {/* Search */}
      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search merchants…"
          className="input-base w-full max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[var(--color-surface-3)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-36 rounded bg-[var(--color-surface-3)]" />
                  <div className="h-2.5 w-24 rounded bg-[var(--color-surface-3)]" />
                </div>
                <div className="h-4 w-20 rounded bg-[var(--color-surface-3)]" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-14 text-center">
          <Store size={32} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="text-[var(--color-text-secondary)] font-medium">
            {search ? 'No merchants match your search' : 'No merchants yet'}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {!search && 'Add a merchant when creating a transaction to track spending here.'}
          </p>
        </motion.div>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {filtered.map((m, i) => (
              <motion.button
                key={m.merchant}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => openMerchant(m.merchant)}
                className="card card-hover p-4 flex items-center gap-4 w-full text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-xl shrink-0">
                  🏪
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{m.merchant}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {m.count} transaction{m.count !== 1 ? 's' : ''} · Last {formatDate(m.lastDate)}
                  </p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--color-danger)]">{formatCurrency(m.total)}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">total spent</p>
                  </div>
                  <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                </div>
              </motion.button>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}

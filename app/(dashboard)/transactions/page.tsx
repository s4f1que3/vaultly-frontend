'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Pencil, Trash2, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import TransactionModal from '@/components/transactions/TransactionModal';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Transaction, TransactionCategory, TransactionType } from '@/types';
import {
  formatCurrency, formatDate, CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS,
} from '@/lib/utils/formatters';
import { TransactionSkeleton } from '@/components/ui/Skeleton';

const TYPE_ICONS = {
  income: TrendingUp,
  expense: TrendingDown,
  transfer: ArrowLeftRight,
};
const TYPE_COLORS = {
  income: 'var(--color-success)',
  expense: 'var(--color-danger)',
  transfer: 'var(--color-info)',
};

export default function TransactionsPage() {
  const { transactions, isLoading, fetchTransactions, setFilters, filters, deleteTransaction, total } = useTransactionStore();
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<TransactionCategory | ''>('');

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const applyFilters = () => {
    setFilters({
      search: search || undefined,
      type: typeFilter || undefined,
      category: categoryFilter || undefined,
      page: 1,
    });
  };

  useEffect(() => {
    const timer = setTimeout(applyFilters, 300);
    return () => clearTimeout(timer);
  }, [search, typeFilter, categoryFilter]);

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const day = formatDate(tx.date);
    if (!acc[day]) acc[day] = [];
    acc[day].push(tx);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Transactions"
        subtitle={`${total} total transactions`}
        action={
          <button onClick={() => { setEditTx(null); setShowModal(true); }} className="btn-primary text-sm">
            <Plus size={16} /> Add
          </button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Income</p>
          <p className="text-lg font-bold text-[var(--color-success)]">+{formatCurrency(totalIncome)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Expenses</p>
          <p className="text-lg font-bold text-[var(--color-danger)]">-{formatCurrency(totalExpenses)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="input-base pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TransactionType | '')}
          className="input-base w-auto"
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="transfer">Transfer</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as TransactionCategory | '')}
          className="input-base w-auto"
        >
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Transaction list */}
      {isLoading ? (
        <div className="card divide-y divide-[var(--color-border)]">
          {[...Array(6)].map((_, i) => <TransactionSkeleton key={i} />)}
        </div>
      ) : transactions.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-[var(--color-text-secondary)] font-medium">No transactions found</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-4">
            {search || typeFilter || categoryFilter ? 'Try adjusting your filters' : 'Add your first transaction to start tracking'}
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
            <Plus size={16} /> Add transaction
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{date}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {formatCurrency(txs.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0))}
                </p>
              </div>
              <div className="card divide-y divide-[var(--color-border)]">
                <AnimatePresence>
                  {txs.map((tx) => {
                    const TypeIcon = TYPE_ICONS[tx.type];
                    return (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-4 p-4 hover:bg-[var(--color-surface-2)] transition-colors group"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: `${CATEGORY_COLORS[tx.category]}20` }}
                        >
                          {CATEGORY_ICONS[tx.category]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{tx.description}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{CATEGORY_LABELS[tx.category]}{tx.merchant ? ` · ${tx.merchant}` : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold" style={{ color: TYPE_COLORS[tx.type] }}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </p>
                          <div className="flex items-center gap-1 justify-end mt-0.5">
                            <TypeIcon size={11} style={{ color: TYPE_COLORS[tx.type] }} />
                            <span className="text-xs text-[var(--color-text-muted)] capitalize">{tx.type}</span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button
                            onClick={() => { setEditTx(tx); setShowModal(true); }}
                            className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className="p-1.5 rounded-lg hover:bg-[rgba(239,68,68,0.1)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      <TransactionModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditTx(null); }}
        transaction={editTx}
      />
    </div>
  );
}

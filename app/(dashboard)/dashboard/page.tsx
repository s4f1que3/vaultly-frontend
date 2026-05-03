'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, Target, Bell, CreditCard,
  ArrowUpRight, ArrowDownRight, Plus
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import StatCard from '@/components/dashboard/StatCard';
import CreditCard_c from '@/components/cards/CreditCard';
import { useCardStore } from '@/stores/useCardStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useGoalStore } from '@/stores/useGoalStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import {
  formatCurrency, formatCompact, formatDate, formatPercentage,
  CATEGORY_ICONS, CATEGORY_LABELS, CATEGORY_COLORS,
} from '@/lib/utils/formatters';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { createClient } from '@/lib/supabase/client';

// Greeting based on time
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { cards, fetchCards, isLoading: cardsLoading } = useCardStore();
  const { budgets, fetchBudgets } = useBudgetStore();
  const { goals, fetchGoals } = useGoalStore();
  const { notifications, fetchNotifications } = useNotificationStore();
  const { transactions, fetchTransactions, isLoading: txLoading } = useTransactionStore();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchCards();
    fetchBudgets();
    fetchGoals();
    fetchNotifications();
    fetchTransactions();

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || '';
      setUserName(name);
    });
  }, [fetchCards, fetchBudgets, fetchGoals, fetchNotifications, fetchTransactions]);

  // Computed stats
  const totalBalance = cards.reduce((s, c) => s + c.balance, 0);
  const monthlyIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;

  // Recent 5 transactions
  const recentTx = [...transactions].slice(0, 5);

  // Budget alerts (over 80%)
  const alertedBudgets = budgets.filter((b) => b.limit_amount > 0 && (b.spent_amount / b.limit_amount) * 100 >= b.alert_threshold);

  // Spending chart data (last 7 days mock from transactions)
  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const day = d.toISOString().split('T')[0];
    const amount = transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(day))
      .reduce((s, t) => s + t.amount, 0);
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), amount };
  });

  // Active goals progress
  const activeGoals = goals.filter((g) => g.status === 'active').slice(0, 3);

  // Unread notifications
  const unread = notifications.filter((n) => !n.is_read).slice(0, 3);

  return (
    <div className="px-4 py-6 sm:px-6 max-w-6xl mx-auto space-y-8">
      {/* ── Section 1: Header / Greeting ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-[var(--color-text-primary)]"
          >
            {getGreeting()}{userName ? `, ${userName.split(' ')[0]}` : ''} 👋
          </motion.h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Here&apos;s your financial overview for today
          </p>
        </div>
        <Link href="/transactions" className="btn-ghost text-sm">
          <Plus size={15} /> Add transaction
        </Link>
      </div>

      {/* ── Section 2: Key Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Balance" value={formatCompact(totalBalance)} icon={Wallet} iconColor="var(--color-accent)" trend={2.4} subValue="across all cards" index={0} />
        <StatCard label="Monthly Income" value={formatCompact(monthlyIncome)} icon={TrendingUp} iconColor="var(--color-success)" subValue="this month" index={1} />
        <StatCard label="Monthly Expenses" value={formatCompact(monthlyExpenses)} icon={TrendingDown} iconColor="var(--color-danger)" subValue="this month" index={2} />
        <StatCard label="Savings Rate" value={formatPercentage(savingsRate)} icon={PiggyBank} iconColor="var(--color-info)" subValue={`${formatCompact(savings)} saved`} index={3} />
      </div>

      {/* ── Section 3: Spending Chart + Default Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">7-Day Spending</h2>
            <span className="badge badge-red">-{formatCompact(monthlyExpenses)}</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={last7}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: unknown) => [formatCurrency(v as number), 'Spent']}
                labelStyle={{ color: 'var(--color-text-muted)' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2} fill="url(#spendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Default card preview */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Default Card</h2>
            <Link href="/cards" className="text-xs text-[var(--color-accent)] hover:underline">View all</Link>
          </div>
          {cardsLoading ? (
            <CardSkeleton />
          ) : cards.length > 0 ? (
            <CreditCard_c card={cards.find((c) => c.is_default) || cards[0]} mini />
          ) : (
            <div className="text-center py-8">
              <CreditCard size={32} className="mx-auto text-[var(--color-text-muted)] mb-2" />
              <p className="text-sm text-[var(--color-text-secondary)]">No cards yet</p>
              <Link href="/cards" className="text-xs text-[var(--color-accent)] hover:underline mt-1 inline-block">Add a card</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 4: Recent Transactions ── */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Transactions</h2>
          <Link href="/transactions" className="text-xs text-[var(--color-accent)] hover:underline">See all</Link>
        </div>
        {txLoading ? (
          <div className="divide-y divide-[var(--color-border)]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="skeleton w-9 h-9 rounded-xl" />
                <div className="flex-1 space-y-1.5"><div className="skeleton h-3.5 w-40" /><div className="skeleton h-3 w-24" /></div>
                <div className="skeleton h-4 w-20" />
              </div>
            ))}
          </div>
        ) : recentTx.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">No transactions yet</p>
            <Link href="/transactions" className="text-xs text-[var(--color-accent)] hover:underline mt-1 inline-block">Add one →</Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--color-surface-2)] transition-colors">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: `${CATEGORY_COLORS[tx.category]}20` }}
                >
                  {CATEGORY_ICONS[tx.category]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{tx.description}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatDate(tx.date)} · {CATEGORY_LABELS[tx.category]}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                    {tx.type === 'income' ? <ArrowUpRight size={14} className="inline" /> : <ArrowDownRight size={14} className="inline" />}
                    {formatCurrency(tx.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 5: Budgets ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Budget Status</h2>
          <Link href="/budgets" className="text-xs text-[var(--color-accent)] hover:underline">Manage →</Link>
        </div>
        {budgets.length === 0 ? (
          <div className="card p-6 text-center">
            <PiggyBank size={28} className="mx-auto text-[var(--color-text-muted)] mb-2" />
            <p className="text-sm text-[var(--color-text-secondary)]">No budgets set</p>
            <Link href="/budgets" className="text-xs text-[var(--color-accent)] hover:underline mt-1 inline-block">Create a budget →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.slice(0, 6).map((b, i) => {
              const pct = Math.min((b.spent_amount / b.limit_amount) * 100, 100);
              const isAlert = pct >= b.alert_threshold;
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{CATEGORY_ICONS[b.category]}</span>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{CATEGORY_LABELS[b.category]}</span>
                    </div>
                    {isAlert && <span className="badge badge-yellow">Alert</span>}
                  </div>
                  <div className="h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.04 }}
                      className="h-full rounded-full"
                      style={{ background: isAlert ? 'var(--color-warning)' : 'var(--color-accent)' }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span>{formatCurrency(b.spent_amount)} spent</span>
                    <span>{formatCurrency(b.limit_amount)} limit</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 6: Goals ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Savings Goals</h2>
          <Link href="/goals" className="text-xs text-[var(--color-accent)] hover:underline">View all →</Link>
        </div>
        {activeGoals.length === 0 ? (
          <div className="card p-6 text-center">
            <Target size={28} className="mx-auto text-[var(--color-text-muted)] mb-2" />
            <p className="text-sm text-[var(--color-text-secondary)]">No active goals</p>
            <Link href="/goals" className="text-xs text-[var(--color-accent)] hover:underline mt-1 inline-block">Set a goal →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeGoals.map((g, i) => {
              const pct = Math.min((g.current_amount / g.target_amount) * 100, 100);
              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="card p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{g.icon || '🎯'}</span>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{g.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{formatPercentage(pct)} complete</p>
                    </div>
                  </div>
                  <div className="h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.06 }}
                      className="h-full rounded-full bg-[var(--color-accent)]"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span>{formatCurrency(g.current_amount)}</span>
                    <span>{formatCurrency(g.target_amount)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 7: Notifications ── */}
      {unread.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              <Bell size={14} className="inline mr-2 text-[var(--color-accent)]" />
              Recent Alerts
            </h2>
            <Link href="/notifications" className="text-xs text-[var(--color-accent)] hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {unread.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-4 flex items-start gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{n.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{n.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

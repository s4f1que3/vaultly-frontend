'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import {
  formatCurrency, formatCompact, CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS,
} from '@/lib/utils/formatters';

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    borderRadius: 10,
    fontSize: 12,
    color: 'var(--color-text-primary)',
  },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
};

const TICK_PROPS = { fill: 'var(--color-text-muted)', fontSize: 11 };

export default function AnalyticsPage() {
  const { transactions, fetchTransactions } = useTransactionStore();
  const { budgets, fetchBudgets } = useBudgetStore();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchTransactions();
    fetchBudgets();
  }, [fetchTransactions, fetchBudgets]);

  // ── Data derivation ──────────────────────────────────────────────────────────
  const income = transactions.filter((t) => t.type === 'income');
  const expenses = transactions.filter((t) => t.type === 'expense');
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
  const netSavings = totalIncome - totalExpenses;

  // Category breakdown (pie)
  const categoryMap: Record<string, number> = {};
  expenses.forEach((t) => { categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount; });
  const categoryData = Object.entries(categoryMap)
    .map(([k, v]) => ({ name: CATEGORY_LABELS[k as keyof typeof CATEGORY_LABELS] || k, value: v, key: k, color: CATEGORY_COLORS[k as keyof typeof CATEGORY_COLORS] || '#9c9585' }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Monthly trend (last 6 months)
  const monthlyMap: Record<string, { income: number; expenses: number }> = {};
  transactions.forEach((t) => {
    const m = t.date.slice(0, 7);
    if (!monthlyMap[m]) monthlyMap[m] = { income: 0, expenses: 0 };
    if (t.type === 'income') monthlyMap[m].income += t.amount;
    if (t.type === 'expense') monthlyMap[m].expenses += t.amount;
  });
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([m, d]) => ({
      month: new Date(m + '-01').toLocaleDateString('en', { month: 'short' }),
      income: d.income,
      expenses: d.expenses,
      net: d.income - d.expenses,
    }));

  // Daily spending (last N days)
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const dailyData = [...Array(days)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const day = d.toISOString().split('T')[0];
    return {
      date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      amount: expenses.filter((t) => t.date.startsWith(day)).reduce((s, t) => s + t.amount, 0),
    };
  });

  // Budget vs actual (radar)
  const radarData = budgets.map((b) => ({
    category: CATEGORY_ICONS[b.category] + ' ' + CATEGORY_LABELS[b.category].split(' ')[0],
    budget: b.limit_amount,
    spent: b.spent_amount,
  })).slice(0, 6);

  // Top spending days
  const dayOfWeekMap: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  expenses.forEach((t) => {
    const d = new Date(t.date);
    const day = d.toLocaleDateString('en', { weekday: 'short' });
    if (day in dayOfWeekMap) dayOfWeekMap[day] += t.amount;
  });
  const weeklyPattern = Object.entries(dayOfWeekMap).map(([day, amount]) => ({ day, amount }));

  return (
    <div className="px-4 py-6 sm:px-6 max-w-6xl mx-auto space-y-6">
      <PageHeader title="Analytics" subtitle="Detailed insights into your spending patterns" />

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Income', value: formatCompact(totalIncome), color: 'var(--color-success)' },
          { label: 'Total Expenses', value: formatCompact(totalExpenses), color: 'var(--color-danger)' },
          { label: 'Net Savings', value: formatCompact(netSavings), color: netSavings >= 0 ? 'var(--color-accent)' : 'var(--color-danger)' },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-4">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">{k.label}</p>
            <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Chart 1: Monthly Income vs Expenses (Bar) ── */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Monthly Income vs Expenses</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={TICK_PROPS} axisLine={false} tickLine={false} />
            <YAxis tick={TICK_PROPS} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
            <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: unknown) => formatCurrency(v as number)} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-text-muted)' }} />
            <Bar dataKey="income" fill="#57c93c" radius={[4, 4, 0, 0]} name="Income" />
            <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Chart 2: Daily Spending (Area) + period selector ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Daily Spending</h2>
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-[var(--color-accent)] text-[#0d0a06]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#57c93c" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#57c93c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={TICK_PROPS} axisLine={false} tickLine={false} interval={Math.floor(days / 6)} />
            <YAxis tick={TICK_PROPS} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
            <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: unknown) => [formatCurrency(v as number), 'Spent']} />
            <Area type="monotone" dataKey="amount" stroke="#57c93c" strokeWidth={2} fill="url(#dailyGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Chart 3: Category Breakdown (Pie) + Chart 4: Net Savings (Line) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Spending by Category</h2>
          {categoryData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-[var(--color-text-muted)] text-sm">No expense data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: unknown) => formatCurrency(v as number)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-3">
                {categoryData.slice(0, 6).map((c) => (
                  <div key={c.key} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-[var(--color-text-muted)] truncate">{c.name}</span>
                    <span className="ml-auto font-medium text-[var(--color-text-primary)]">{formatCompact(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Net savings trend */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Net Savings Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={TICK_PROPS} axisLine={false} tickLine={false} />
              <YAxis tick={TICK_PROPS} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
              <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: unknown) => [formatCurrency(v as number), 'Net']} />
              <Line type="monotone" dataKey="net" stroke="#57c93c" strokeWidth={2.5} dot={{ fill: '#57c93c', strokeWidth: 0, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Chart 5: Budget vs Actual (Radar) + Chart 6: Weekly Pattern (Bar) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Budget vs Actual (Radar)</h2>
          {radarData.length < 3 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-2xl">📊</span>
              <p className="text-sm text-[var(--color-text-muted)]">
                {radarData.length === 0 ? 'Set budgets to see radar chart' : 'Add at least 3 budgets to see the radar chart'}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart
                data={radarData}
                margin={{ top: 20, right: 40, bottom: 20, left: 40 }}
                outerRadius="62%"
              >
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  tickSize={8}
                />
                <Radar name="Budget" dataKey="budget" stroke="#57c93c" fill="#57c93c" fillOpacity={0.15} strokeWidth={1.5} />
                <Radar name="Spent" dataKey="spent" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={1.5} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-text-muted)', paddingTop: 8 }} />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: unknown) => formatCurrency(v as number)} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Spending by Day of Week</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyPattern}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={TICK_PROPS} axisLine={false} tickLine={false} />
              <YAxis tick={TICK_PROPS} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
              <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: unknown) => [formatCurrency(v as number), 'Spent']} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useBillingStore } from '@/stores/useBillingStore';
import {
  formatCurrency, formatCompact, CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS,
} from '@/lib/utils/formatters';
import api from '@/lib/api';
import { SpendingAnomaly, CategoryMonthTrend, SeasonalityData, SpendingForecast } from '@/types';

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
  const { isChecking, access } = useBillingStore();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [anomalies, setAnomalies] = useState<SpendingAnomaly[]>([]);
  const [categoryTrends, setCategoryTrends] = useState<CategoryMonthTrend[]>([]);
  const [seasonality, setSeasonality] = useState<SeasonalityData | null>(null);
  const [forecast, setForecast] = useState<SpendingForecast | null>(null);

  useEffect(() => {
    if (!isChecking && access?.hasAccess) {
      fetchTransactions();
      fetchBudgets();
      // Load anomalies and build category trends from transactions
      api.get<{ anomalies: SpendingAnomaly[] }>('/intelligence/anomalies')
        .then((r) => setAnomalies(r.anomalies ?? []))
        .catch(() => {});
      api.get<SeasonalityData>('/intelligence/seasonality')
        .then(setSeasonality).catch(() => {});
      api.get<SpendingForecast>('/intelligence/forecast')
        .then(setForecast).catch(() => {});
    }
  }, [fetchTransactions, fetchBudgets, isChecking, access]);

  // Build month-over-month category trends from loaded transactions
  useEffect(() => {
    if (!transactions.length) return;
    const expenses = transactions.filter((t) => t.type === 'expense');
    const byCategory = new Map<string, Map<string, number>>();
    for (const tx of expenses) {
      const month = tx.date.slice(0, 7);
      if (!byCategory.has(tx.category)) byCategory.set(tx.category, new Map());
      const prev = byCategory.get(tx.category)!.get(month) ?? 0;
      byCategory.get(tx.category)!.set(month, prev + tx.amount);
    }
    const trends: CategoryMonthTrend[] = [];
    for (const [category, monthMap] of byCategory) {
      const sorted = [...monthMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
      const amounts = sorted.map(([, v]) => v);
      const average = amounts.reduce((s, v) => s + v, 0) / (amounts.length || 1);
      const last = amounts[amounts.length - 1] ?? 0;
      const prev = amounts[amounts.length - 2] ?? 0;
      const changePercent = prev > 0 ? Math.round(((last - prev) / prev) * 100) : 0;
      trends.push({
        category,
        months: sorted.map(([label, amount]) => ({ label: label.slice(5), amount })),
        average,
        trend: changePercent > 10 ? 'increasing' : changePercent < -10 ? 'decreasing' : 'stable',
        changePercent,
      });
    }
    setCategoryTrends(trends.sort((a, b) => b.average - a.average).slice(0, 8));
  }, [transactions]);

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

      {/* Spending Anomalies */}
      {anomalies.length > 0 && (
        <div className="bg-[var(--color-surface-2)] rounded-2xl p-5 border border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="text-yellow-400" /> Spending Anomalies
          </h2>
          <div className="space-y-3">
            {anomalies.slice(0, 6).map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-[var(--color-border)] last:border-0">
                <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${a.severity === 'high' ? 'bg-red-400' : a.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{a.title}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{a.description}</p>
                </div>
                <span className="text-sm font-medium text-red-400 shrink-0">{formatCurrency(a.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Trend Sparklines */}
      {categoryTrends.length > 0 && (
        <div className="bg-[var(--color-surface-2)] rounded-2xl p-5 border border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Category Trends (Month-over-Month)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryTrends.map((ct) => (
              <div key={ct.category} className="bg-[var(--color-bg-secondary)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{(CATEGORY_ICONS as Record<string, string>)[ct.category] ?? '📦'}</span>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {(CATEGORY_LABELS as Record<string, string>)[ct.category] ?? ct.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {ct.trend === 'increasing'
                      ? <TrendingUp size={13} className="text-red-400" />
                      : ct.trend === 'decreasing'
                      ? <TrendingDown size={13} className="text-green-400" />
                      : <Minus size={13} className="text-[var(--color-text-secondary)]" />}
                    <span className={`text-xs font-medium ${ct.changePercent > 0 ? 'text-red-400' : ct.changePercent < 0 ? 'text-green-400' : 'text-[var(--color-text-secondary)]'}`}>
                      {ct.changePercent > 0 ? '+' : ''}{ct.changePercent}%
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={60}>
                  <AreaChart data={ct.months} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${ct.category}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={(CATEGORY_COLORS as Record<string, string>)[ct.category] ?? '#3b82f6'} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={(CATEGORY_COLORS as Record<string, string>)[ct.category] ?? '#3b82f6'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="amount" stroke={(CATEGORY_COLORS as Record<string, string>)[ct.category] ?? '#3b82f6'} strokeWidth={1.5} fill={`url(#grad-${ct.category})`} dot={false} />
                    <Tooltip contentStyle={{ display: 'none' }} />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">avg {formatCurrency(ct.average)}/mo</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spending Forecaster */}
      {forecast && forecast.forecasts.length > 0 && (
        <div className="bg-[var(--color-surface-2)] rounded-2xl p-5 border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Next Month Forecast</h2>
            <span className="text-xs text-[var(--color-text-secondary)]">
              Weighted avg · {forecast.summary.monthElapsedPercent}% through month
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">
            Projected: <span className="font-semibold text-[var(--color-text-primary)]">{formatCurrency(forecast.summary.totalForecastedMonthly)}</span>
            {' · '}Current pace: <span className={`font-semibold ${forecast.summary.overallPacePercent > 10 ? 'text-red-400' : forecast.summary.overallPacePercent < -10 ? 'text-green-400' : 'text-[var(--color-text-primary)]'}`}>
              {forecast.summary.overallPacePercent > 0 ? '+' : ''}{forecast.summary.overallPacePercent}%
            </span>
          </p>
          <div className="space-y-3">
            {forecast.forecasts.slice(0, 8).map((f) => (
              <div key={f.category} className="flex items-center gap-3">
                <span className="w-5 text-base shrink-0">{(CATEGORY_ICONS as Record<string, string>)[f.category] ?? '📦'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--color-text-primary)] truncate">{(CATEGORY_LABELS as Record<string, string>)[f.category] ?? f.category}</span>
                    <span className="text-xs font-medium text-[var(--color-text-primary)] shrink-0 ml-2">{formatCurrency(f.forecastedAmount)}</span>
                  </div>
                  <div className="h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${f.pace === 'ahead' ? 'bg-red-400' : f.pace === 'behind' ? 'bg-green-400' : 'bg-[var(--color-accent)]'}`}
                      style={{ width: `${Math.min(100, f.forecastedAmount > 0 ? (f.currentMonthSpend / f.forecastedAmount) * 100 : 0)}%` }}
                    />
                  </div>
                </div>
                <span className={`text-xs shrink-0 w-16 text-right font-medium ${f.pace === 'ahead' ? 'text-red-400' : f.pace === 'behind' ? 'text-green-400' : 'text-[var(--color-text-secondary)]'}`}>
                  {f.pace === 'ahead' ? `+${f.pacePercent}%` : f.pace === 'behind' ? `${f.pacePercent}%` : 'on track'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seasonality */}
      {seasonality?.hasEnoughData && (
        <div className="bg-[var(--color-surface-2)] rounded-2xl p-5 border border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Seasonal Patterns</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">Based on your last 12 months of spending</p>

          {/* Upcoming spikes alert */}
          {(seasonality.upcomingSpikes ?? []).filter(Boolean).length > 0 && (
            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 mb-4 flex items-start gap-2">
              <TrendingUp size={14} className="text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-yellow-400">Upcoming spending spikes</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {(seasonality.upcomingSpikes ?? []).filter(Boolean).map((s) =>
                    `${s!.category} in ${s!.month} (${s!.multiplier.toFixed(1)}× normal)`
                  ).join(' · ')}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {seasonality.categories.filter((c) => c.hasSeasonality).slice(0, 6).map((cat) => (
              <div key={cat.category} className="bg-[var(--color-bg-secondary)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{(CATEGORY_ICONS as Record<string, string>)[cat.category] ?? '📦'}</span>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {(CATEGORY_LABELS as Record<string, string>)[cat.category] ?? cat.category}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {cat.troughMonth} → {cat.peakMonth}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {cat.monthlyMultipliers.map(({ month, multiplier }) => (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-sm"
                        style={{
                          height: `${Math.max(4, multiplier * 24)}px`,
                          background: multiplier > 1.2 ? '#f87171' : multiplier < 0.8 ? '#4ade80' : 'var(--color-accent)',
                          opacity: multiplier === 0 ? 0.15 : 0.8,
                        }}
                      />
                      <span className="text-[9px] text-[var(--color-text-secondary)]">{month.slice(0, 1)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                  Peak {cat.peakMultiplier.toFixed(1)}× · Trough {cat.troughMultiplier.toFixed(1)}×
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

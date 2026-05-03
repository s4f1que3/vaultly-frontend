'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, Calendar, CreditCard,
  ShoppingBag, Target, ChevronDown, Trophy, AlertTriangle,
  CheckCircle2, Clock, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { formatCurrency, formatCompact, CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/utils/formatters';
import type { MonthlySummary, YearlySummary, SummaryPeriods } from '@/types';
import api from '@/lib/api';

const CHART_TOOLTIP = {
  contentStyle: {
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    borderRadius: 10,
    fontSize: 12,
    color: 'var(--color-text-primary)',
  },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
};
const TICK = { fill: 'var(--color-text-muted)', fontSize: 11 };

function ChangeChip({ value, suffix = '%' }: { value: number | null; suffix?: string }) {
  if (value === null) return <span className="text-xs text-[var(--color-text-muted)]">—</span>;
  const positive = value <= 0; // less spending = positive for expenses
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
      {value > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(value)}{suffix}
    </span>
  );
}

function BudgetBar({ spent, limit, status }: { spent: number; limit: number; status: string }) {
  const pct = Math.min(100, limit > 0 ? (spent / limit) * 100 : 0);
  const color = status === 'exceeded' ? 'var(--color-danger)' : status === 'warning' ? '#f59e0b' : 'var(--color-accent)';
  return (
    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

// ── Monthly View ─────────────────────────────────────────────────────────────

function MonthlyView({ summary }: { summary: MonthlySummary }) {
  const { overview, vsLastMonth, byCategory, budgetPerformance, byCard, topMerchants, dailyBreakdown, topTransactions, goalsSnapshot } = summary;

  const categoryChartData = byCategory.slice(0, 7).map(c => ({
    name: CATEGORY_LABELS[c.category as keyof typeof CATEGORY_LABELS] || c.category,
    value: c.amount,
    color: CATEGORY_COLORS[c.category as keyof typeof CATEGORY_COLORS] || '#9c9585',
  }));

  const dailyChartData = dailyBreakdown.map(d => ({
    date: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    expenses: d.expenses,
    income: d.income,
  }));

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Income', value: overview.totalIncome, color: 'var(--color-success)', change: vsLastMonth.incomeChange, icon: TrendingUp },
          { label: 'Expenses', value: overview.totalExpenses, color: 'var(--color-danger)', change: vsLastMonth.expenseChange, icon: TrendingDown },
          { label: 'Net Savings', value: overview.netSavings, color: overview.netSavings >= 0 ? 'var(--color-accent)' : 'var(--color-danger)', change: null, icon: overview.netSavings >= 0 ? TrendingUp : TrendingDown },
          { label: 'Savings Rate', value: null, display: `${overview.savingsRate}%`, color: overview.savingsRate >= 20 ? 'var(--color-success)' : overview.savingsRate >= 10 ? '#f59e0b' : 'var(--color-danger)', change: null, icon: Target },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[var(--color-text-muted)]">{k.label}</p>
              <k.icon size={14} style={{ color: k.color }} />
            </div>
            <p className="text-xl font-bold" style={{ color: k.color }}>
              {k.display ?? formatCompact(k.value!)}
            </p>
            {k.change !== null && (
              <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <ChangeChip value={k.change} />
                <span>vs {vsLastMonth.prevMonth}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Transactions', value: overview.transactionCount, suffix: '' },
          { label: 'Avg Daily Spend', value: null, display: formatCurrency(overview.avgDailySpend) },
          { label: 'Subscriptions', value: null, display: formatCurrency(overview.subscriptionTotal) },
        ].map((s, i) => (
          <div key={s.label} className="card p-3 text-center">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">{s.label}</p>
            <p className="text-base font-semibold text-[var(--color-text-primary)]">
              {s.display ?? s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Daily spending chart */}
      {dailyChartData.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Daily Cash Flow</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dailyChartData}>
              <defs>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#57c93c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#57c93c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={formatCompact} width={50} />
              <Tooltip {...CHART_TOOLTIP} formatter={(v: unknown) => formatCurrency(v as number)} />
              <Area type="monotone" dataKey="income" stroke="#57c93c" strokeWidth={1.5} fill="url(#incGrad)" name="Income" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={1.5} fill="url(#expGrad)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Category breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Spending by Category</h3>
          {categoryChartData.length > 0 ? (
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <PieChart width={120} height={120}>
                  <Pie data={categoryChartData} cx={55} cy={55} innerRadius={32} outerRadius={55} dataKey="value" strokeWidth={0}>
                    {categoryChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP} formatter={(v: unknown) => formatCurrency(v as number)} />
                </PieChart>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {byCategory.slice(0, 6).map(c => (
                  <div key={c.category} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm">{CATEGORY_ICONS[c.category as keyof typeof CATEGORY_ICONS] || '📦'}</span>
                      <span className="text-xs text-[var(--color-text-muted)] truncate">{CATEGORY_LABELS[c.category as keyof typeof CATEGORY_LABELS] || c.category}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-[var(--color-text-muted)]">{c.percentage}%</span>
                      <span className="text-xs font-medium text-[var(--color-text-primary)]">{formatCompact(c.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No expense data</p>
          )}
        </div>

        {/* Budget performance */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Budget Performance</h3>
          {budgetPerformance.length > 0 ? (
            <div className="space-y-3">
              {budgetPerformance.map(b => (
                <div key={b.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{CATEGORY_ICONS[b.category as keyof typeof CATEGORY_ICONS] || '📦'}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">{CATEGORY_LABELS[b.category as keyof typeof CATEGORY_LABELS] || b.category}</span>
                      {b.status === 'exceeded' && <AlertTriangle size={11} className="text-[var(--color-danger)]" />}
                      {b.status === 'warning' && <AlertTriangle size={11} className="text-yellow-500" />}
                      {b.status === 'ok' && <CheckCircle2 size={11} className="text-[var(--color-success)]" />}
                    </div>
                    <span className="text-xs font-medium text-[var(--color-text-primary)]">
                      {formatCompact(b.spent)} / {formatCompact(b.limit)}
                    </span>
                  </div>
                  <BudgetBar spent={b.spent} limit={b.limit} status={b.status} />
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 text-right">{b.utilizationPct}% used</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No budgets set for this month</p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* By card */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <CreditCard size={14} className="text-[var(--color-accent)]" /> Spending by Card
          </h3>
          {byCard.length > 0 ? (
            <div className="space-y-3">
              {byCard.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-primary)]">{c.holder}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      {c.lastFour === '—' ? 'Cash / Unlinked' : `•••• ${c.lastFour}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{formatCurrency(c.amount)}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{c.percentage}% of total</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No card data</p>
          )}
        </div>

        {/* Top merchants */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <ShoppingBag size={14} className="text-[var(--color-accent)]" /> Top Merchants
          </h3>
          {topMerchants.length > 0 ? (
            <div className="space-y-2.5">
              {topMerchants.slice(0, 6).map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--color-text-muted)] w-4">{i + 1}</span>
                    <div>
                      <p className="text-xs font-medium text-[var(--color-text-primary)]">{m.merchant}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">{m.transactionCount} visit{m.transactionCount !== 1 ? 's' : ''} · avg {formatCurrency(m.avgPerVisit)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">{formatCompact(m.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No merchant data</p>
          )}
        </div>
      </div>

      {/* Top transactions */}
      {topTransactions.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Biggest Expenses</h3>
          <div className="space-y-2">
            {topTransactions.map((t, i) => (
              <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-base">{CATEGORY_ICONS[t.category as keyof typeof CATEGORY_ICONS] || '📦'}</span>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-primary)]">{t.description}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{t.merchant ? `${t.merchant} · ` : ''}{new Date(t.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-[var(--color-danger)]">-{formatCurrency(t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals snapshot */}
      {goalsSnapshot.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <Target size={14} className="text-[var(--color-accent)]" /> Goals at End of Month
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {goalsSnapshot.map((g, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">{g.name}</p>
                  {g.status === 'completed'
                    ? <CheckCircle2 size={13} className="text-[var(--color-success)]" />
                    : g.status === 'paused'
                    ? <Clock size={13} className="text-[var(--color-text-muted)]" />
                    : null}
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 mb-1">
                  <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${g.progressPct}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
                  <span>{formatCurrency(g.currentAmount)}</span>
                  <span>{g.progressPct}% of {formatCurrency(g.targetAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Yearly View ───────────────────────────────────────────────────────────────

function YearlyView({ summary }: { summary: YearlySummary }) {
  const { overview, vsLastYear, highlights, monthlyBreakdown, byCategory, budgetYearSummary, byCard, topMerchants, goalsSnapshot } = summary;

  const monthlyChartData = monthlyBreakdown.map(m => ({
    month: m.label.slice(0, 3),
    income: m.income,
    expenses: m.expenses,
    savings: m.netSavings,
  }));

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Income', value: overview.totalIncome, color: 'var(--color-success)', change: vsLastYear.incomeChange },
          { label: 'Total Expenses', value: overview.totalExpenses, color: 'var(--color-danger)', change: vsLastYear.expenseChange },
          { label: 'Net Savings', value: overview.netSavings, color: overview.netSavings >= 0 ? 'var(--color-accent)' : 'var(--color-danger)', change: null },
          { label: 'Savings Rate', value: null, display: `${overview.savingsRate}%`, color: overview.savingsRate >= 20 ? 'var(--color-success)' : '#f59e0b', change: null },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-4">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">{k.label}</p>
            <p className="text-xl font-bold" style={{ color: k.color }}>
              {k.display ?? formatCompact(k.value!)}
            </p>
            {k.change !== null && (
              <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <ChangeChip value={k.change} />
                <span>vs {summary.period.year - 1}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Avg monthly stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Avg Monthly Income', value: overview.avgMonthlyIncome },
          { label: 'Avg Monthly Spend', value: overview.avgMonthlyExpenses },
          { label: 'Subscriptions Paid', value: overview.totalSubscriptionCost },
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">{s.label}</p>
            <p className="text-base font-semibold text-[var(--color-text-primary)]">{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Highlights */}
      {(highlights.bestMonth || highlights.worstMonth) && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {highlights.bestMonth && (
            <div className="card p-4 border border-[var(--color-success)]/20">
              <div className="flex items-center gap-2 mb-1">
                <Trophy size={14} className="text-[var(--color-success)]" />
                <span className="text-xs text-[var(--color-text-muted)]">Best Month</span>
              </div>
              <p className="text-sm font-bold text-[var(--color-text-primary)]">{highlights.bestMonth.label}</p>
              <p className="text-xs text-[var(--color-success)]">+{formatCompact(highlights.bestMonth.netSavings)} saved</p>
            </div>
          )}
          {highlights.worstMonth && (
            <div className="card p-4 border border-[var(--color-danger)]/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={14} className="text-[var(--color-danger)]" />
                <span className="text-xs text-[var(--color-text-muted)]">Highest Spend</span>
              </div>
              <p className="text-sm font-bold text-[var(--color-text-primary)]">{highlights.worstMonth.label}</p>
              <p className="text-xs text-[var(--color-danger)]">{formatCompact(highlights.worstMonth.expenses)} spent</p>
            </div>
          )}
          {highlights.highestSpendCategory && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag size={14} className="text-[var(--color-accent)]" />
                <span className="text-xs text-[var(--color-text-muted)]">Top Category</span>
              </div>
              <p className="text-sm font-bold text-[var(--color-text-primary)] capitalize">{highlights.highestSpendCategory.category}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{formatCompact(highlights.highestSpendCategory.amount)} · {highlights.highestSpendCategory.percentage}%</p>
            </div>
          )}
          {highlights.topMerchant && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag size={14} className="text-[var(--color-accent)]" />
                <span className="text-xs text-[var(--color-text-muted)]">Top Merchant</span>
              </div>
              <p className="text-sm font-bold text-[var(--color-text-primary)]">{highlights.topMerchant.merchant}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{formatCompact(highlights.topMerchant.total)} · {highlights.topMerchant.transactionCount} visits</p>
            </div>
          )}
        </div>
      )}

      {/* Monthly trend chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Monthly Breakdown</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyChartData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={TICK} axisLine={false} tickLine={false} />
            <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={formatCompact} width={50} />
            <Tooltip {...CHART_TOOLTIP} formatter={(v: unknown) => formatCurrency(v as number)} />
            <Bar dataKey="income" fill="#57c93c" radius={[3, 3, 0, 0]} name="Income" />
            <Bar dataKey="expenses" fill="#ef4444" radius={[3, 3, 0, 0]} name="Expenses" />
          </BarChart>
        </ResponsiveContainer>

        {/* Monthly table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="text-left py-2 font-medium">Month</th>
                <th className="text-right py-2 font-medium">Income</th>
                <th className="text-right py-2 font-medium">Expenses</th>
                <th className="text-right py-2 font-medium">Savings</th>
                <th className="text-right py-2 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {monthlyBreakdown.filter(m => m.transactionCount > 0).map(m => (
                <tr key={m.month} className="border-b border-[var(--color-border)]/50">
                  <td className="py-2 text-[var(--color-text-primary)]">{m.label}</td>
                  <td className="py-2 text-right text-[var(--color-success)]">{formatCompact(m.income)}</td>
                  <td className="py-2 text-right text-[var(--color-danger)]">{formatCompact(m.expenses)}</td>
                  <td className={`py-2 text-right font-medium ${m.netSavings >= 0 ? 'text-[var(--color-accent)]' : 'text-[var(--color-danger)]'}`}>
                    {m.netSavings >= 0 ? '+' : ''}{formatCompact(m.netSavings)}
                  </td>
                  <td className="py-2 text-right text-[var(--color-text-muted)]">{m.savingsRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Category year total */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Spending by Category</h3>
          <div className="space-y-2.5">
            {byCategory.slice(0, 8).map(c => (
              <div key={c.category}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{CATEGORY_ICONS[c.category as keyof typeof CATEGORY_ICONS] || '📦'}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">{CATEGORY_LABELS[c.category as keyof typeof CATEGORY_LABELS] || c.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[var(--color-text-muted)]">avg {formatCompact(c.avgPerMonth)}/mo</span>
                    <span className="text-xs font-medium text-[var(--color-text-primary)]">{formatCompact(c.amount)}</span>
                  </div>
                </div>
                <div className="w-full h-1 rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${c.percentage}%`, backgroundColor: CATEGORY_COLORS[c.category as keyof typeof CATEGORY_COLORS] || '#9c9585' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget year summary */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Budget Year Summary</h3>
          {budgetYearSummary.length > 0 ? (
            <div className="space-y-3">
              {budgetYearSummary.slice(0, 6).map(b => (
                <div key={b.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{CATEGORY_ICONS[b.category as keyof typeof CATEGORY_ICONS] || '📦'}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">{CATEGORY_LABELS[b.category as keyof typeof CATEGORY_LABELS] || b.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-[var(--color-text-primary)]">{b.overallUtilization}%</span>
                      <span className="text-[10px] text-[var(--color-text-muted)] ml-1">{b.monthsTracked}mo tracked</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, b.overallUtilization)}%`, backgroundColor: b.overallUtilization > 100 ? 'var(--color-danger)' : b.overallUtilization > 80 ? '#f59e0b' : 'var(--color-accent)' }} />
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                    {formatCompact(b.totalSpent)} spent of {formatCompact(b.totalLimit)} budgeted
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No budget data for this year</p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* By card */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <CreditCard size={14} className="text-[var(--color-accent)]" /> Spending by Card
          </h3>
          <div className="space-y-3">
            {byCard.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">{c.holder}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">•••• {c.lastFour}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{formatCurrency(c.amount)}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{c.percentage}% of total</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top merchants */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <ShoppingBag size={14} className="text-[var(--color-accent)]" /> Top Merchants
          </h3>
          <div className="space-y-2.5">
            {topMerchants.slice(0, 8).map((m, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--color-text-muted)] w-4">{i + 1}</span>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-primary)]">{m.merchant}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{m.transactionCount} visits</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">{formatCompact(m.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goals year-end snapshot */}
      {goalsSnapshot.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <Target size={14} className="text-[var(--color-accent)]" /> Goals Snapshot
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {goalsSnapshot.map((g, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">{g.name}</p>
                  {g.status === 'completed' && <CheckCircle2 size={13} className="text-[var(--color-success)]" />}
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 mb-1">
                  <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${g.progressPct}%` }} />
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)]">{g.progressPct}% · {formatCurrency(g.currentAmount)} of {formatCurrency(g.targetAmount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [periods, setPeriods] = useState<SummaryPeriods | null>(null);
  const [view, setView] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number } | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [yearlySummary, setYearlySummary] = useState<YearlySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<SummaryPeriods>('/summaries/periods').then(data => {
      setPeriods(data);
      if (data.months.length) setSelectedMonth(data.months[0]);
      if (data.years.length) setSelectedYear(data.years[0]);
    }).catch(() => {});
  }, []);

  const loadMonthly = useCallback(async (month: number, year: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<MonthlySummary>(`/summaries/monthly?month=${month}&year=${year}`);
      setMonthlySummary(data);
    } catch {
      setError('Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadYearly = useCallback(async (year: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<YearlySummary>(`/summaries/yearly?year=${year}`);
      setYearlySummary(data);
    } catch {
      setError('Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'monthly' && selectedMonth) {
      loadMonthly(selectedMonth.month, selectedMonth.year);
    }
  }, [view, selectedMonth, loadMonthly]);

  useEffect(() => {
    if (view === 'yearly' && selectedYear) {
      loadYearly(selectedYear);
    }
  }, [view, selectedYear, loadYearly]);

  const hasPeriods = periods && (periods.months.length > 0 || periods.years.length > 0);

  return (
    <div className="px-4 py-6 sm:px-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="History"
        subtitle="Monthly and yearly financial summaries"
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Monthly / Yearly toggle */}
        <div className="flex rounded-xl overflow-hidden border border-[var(--color-border)]">
          {(['monthly', 'yearly'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium transition-all capitalize ${
                view === v
                  ? 'bg-[var(--color-accent)] text-[#0d0a06]'
                  : 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Period picker */}
        {view === 'monthly' && periods && periods.months.length > 0 && (
          <div className="relative">
            <select
              value={selectedMonth ? `${selectedMonth.year}-${selectedMonth.month}` : ''}
              onChange={e => {
                const [y, m] = e.target.value.split('-').map(Number);
                setSelectedMonth({ year: y, month: m });
              }}
              className="appearance-none card px-4 py-2 pr-8 text-sm text-[var(--color-text-primary)] cursor-pointer"
            >
              {periods.months.map(p => (
                <option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>{p.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
          </div>
        )}

        {view === 'yearly' && periods && periods.years.length > 0 && (
          <div className="relative">
            <select
              value={selectedYear ?? ''}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="appearance-none card px-4 py-2 pr-8 text-sm text-[var(--color-text-primary)] cursor-pointer"
            >
              {periods.years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
          </div>
        )}

        {selectedMonth && view === 'monthly' && (
          <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-1.5">
            <Calendar size={13} />
            {periods?.months.find(m => m.month === selectedMonth.month && m.year === selectedMonth.year)?.label}
          </p>
        )}
      </div>

      {/* Empty state */}
      {!hasPeriods && !loading && (
        <div className="card p-12 text-center">
          <Calendar size={32} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">No history yet</p>
          <p className="text-xs text-[var(--color-text-muted)]">Add some transactions to start building your financial history</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
              <div className="h-20 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-4 border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-sm">{error}</div>
      )}

      {/* Summary content */}
      <AnimatePresence mode="wait">
        {!loading && !error && (
          <motion.div
            key={`${view}-${view === 'monthly' ? `${selectedMonth?.year}-${selectedMonth?.month}` : selectedYear}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'monthly' && monthlySummary && <MonthlyView summary={monthlySummary} />}
            {view === 'yearly' && yearlySummary && <YearlyView summary={yearlySummary} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

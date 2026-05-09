'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import api from '@/lib/api';
import { Projections } from '@/types';
import { formatCurrency, formatDateShort } from '@/lib/utils/formatters';

const WINDOWS = [
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
];

export default function CashFlowPage() {
  const [projections, setProjections] = useState<Projections | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await api.get<Projections>(`/intelligence/projections?days=${days}`);
        setProjections(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [days]);

  const proj = projections;
  const LOW_THRESHOLD = 200;

  const chartData = proj?.projection.map((p) => ({
    date: formatDateShort(p.date),
    balance: p.projected,
    hasEvent: p.events.length > 0,
  })) ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Cash Flow Forecast"
        subtitle="Day-by-day balance projection including upcoming bills and income"
        action={
          <div className="flex items-center gap-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-1">
            {WINDOWS.map(({ label, days: d }) => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${days === d ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
                {label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-[var(--color-text-secondary)]">Loading forecast…</div>
      ) : proj ? (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Current Balance', value: formatCurrency(proj.summary.currentBalance), color: 'text-[var(--color-text-primary)]' },
              { label: `Projected (${days}d)`, value: formatCurrency(proj.summary.projectedBalance), color: proj.summary.projectedBalance >= 0 ? 'text-green-400' : 'text-red-400' },
              { label: 'Lowest Point', value: formatCurrency(proj.summary.lowestPoint ?? 0), color: (proj.summary.lowestPoint ?? 0) < LOW_THRESHOLD ? 'text-red-400' : 'text-yellow-400' },
              { label: 'Low Balance Days', value: `${proj.summary.lowBalanceDays} days`, color: proj.summary.lowBalanceDays > 0 ? 'text-red-400' : 'text-green-400' },
            ].map(({ label, value, color }) => (
              <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--color-bg-card)] rounded-2xl p-4 border border-[var(--color-border)]">
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </motion.div>
            ))}
          </div>

          {/* Alert banner */}
          {proj.summary.lowBalanceDays > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">Low balance warning</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Your balance drops below {formatCurrency(LOW_THRESHOLD)} on {proj.summary.lowBalanceDays} day{proj.summary.lowBalanceDays !== 1 ? 's' : ''}.
                  {proj.summary.firstLowBalanceDate && ` First occurs on ${formatDateShort(proj.summary.firstLowBalanceDate)}.`}
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 border border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-6">Projected Balance</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 6)} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(value: unknown) => [formatCurrency(Number(value ?? 0)), 'Balance']}
                />
                <ReferenceLine y={LOW_THRESHOLD} stroke="#ef4444" strokeDasharray="4 4" opacity={0.6} label={{ value: 'Low', fill: '#ef4444', fontSize: 10 }} />
                <Area type="monotone" dataKey="balance" stroke="var(--color-accent)" strokeWidth={2} fill="url(#balanceGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Upcoming events */}
          <div className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Upcoming Events</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {proj.projection
                .filter((p) => p.events.length > 0)
                .slice(0, 20)
                .map((p) =>
                  p.events.map((evt, i) => (
                    <div key={`${p.date}-${i}`} className="flex items-center gap-3 py-2 border-b border-[var(--color-border)] last:border-0">
                      <Calendar size={14} className="text-[var(--color-text-secondary)] shrink-0" />
                      <span className="text-xs text-[var(--color-text-secondary)] w-16 shrink-0">{formatDateShort(p.date)}</span>
                      <span className="text-sm text-[var(--color-text-primary)] flex-1">{evt.label}</span>
                      <span className={`text-sm font-medium shrink-0 ${evt.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {evt.type === 'income' ? '+' : '-'}{formatCurrency(evt.amount)}
                      </span>
                      {evt.type === 'income'
                        ? <TrendingUp size={14} className="text-green-400 shrink-0" />
                        : <TrendingDown size={14} className="text-red-400 shrink-0" />}
                    </div>
                  )),
                )}
              {proj.projection.filter((p) => p.events.length > 0).length === 0 && (
                <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">No scheduled events in this window</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

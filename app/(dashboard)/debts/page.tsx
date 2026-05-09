'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, TrendingDown } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import { useNetWorthStore } from '@/stores/useNetWorthStore';
import { DebtPayoffPlan, PayoffStrategy } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import api from '@/lib/api';

export default function DebtsPage() {
  const { netWorth, fetchNetWorth } = useNetWorthStore();
  const [strategy, setStrategy] = useState<PayoffStrategy>('avalanche');
  const [monthlyBudget, setMonthlyBudget] = useState(500);
  const [plan, setPlan] = useState<DebtPayoffPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchNetWorth(); }, [fetchNetWorth]);

  const calculate = async () => {
    setIsLoading(true); setError('');
    try {
      const data = await api.post<DebtPayoffPlan>('/debts/payoff', { monthlyBudget, strategy });
      setPlan(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
    } finally { setIsLoading(false); }
  };

  const liabilities = netWorth?.liabilities.items ?? [];
  const totalDebt = netWorth?.totalLiabilities ?? 0;
  const minPayments = liabilities.reduce((s, l) => s + l.minimum_payment, 0);

  // Chart data: balance over time
  const chartData = plan?.schedule.filter((_, i) => i % 3 === 0 || plan.payoffMonths <= 24).map((s) => ({
    label: s.label,
    balance: s.totalBalance,
  })) ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Debt Payoff Planner"
        subtitle="Avalanche vs snowball — see which strategy saves you the most"
        action={
          <button onClick={() => window.location.href = '/net-worth'} className="flex items-center gap-2 text-sm text-[var(--color-accent)] hover:underline">
            <Plus size={14} /> Add liabilities
          </button>
        }
      />

      {liabilities.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] rounded-2xl p-12 text-center border border-[var(--color-border)]">
          <TrendingDown size={40} className="mx-auto mb-4 text-[var(--color-text-secondary)] opacity-40" />
          <p className="text-[var(--color-text-secondary)]">No liabilities found. Add your debts from the Net Worth page first.</p>
          <a href="/net-worth" className="mt-4 inline-block bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
            Go to Net Worth
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Config */}
          <div className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Payoff Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">Strategy</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['avalanche', 'snowball'] as const).map((s) => (
                    <button key={s} onClick={() => setStrategy(s)}
                      className={`py-2 rounded-lg border text-sm font-medium transition-colors capitalize ${strategy === s ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                  {strategy === 'avalanche'
                    ? 'Pay highest interest first — minimizes total interest paid'
                    : 'Pay smallest balance first — builds momentum with quick wins'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                  Monthly budget for debt repayment
                </label>
                <input
                  type="number" value={monthlyBudget} onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                  min={minPayments} step={50}
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                />
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Minimum required: {formatCurrency(minPayments)}/mo
                </p>
              </div>
            </div>
            {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
            <button onClick={calculate} disabled={isLoading || monthlyBudget < minPayments}
              className="mt-4 bg-[var(--color-accent)] text-white px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {isLoading ? 'Calculating…' : 'Calculate Plan'}
            </button>
          </div>

          {/* Debt list */}
          <div className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Your Debts</h3>
            <div className="space-y-3">
              {liabilities.map((l) => (
                <div key={l.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{l.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{l.interest_rate}% APR · {formatCurrency(l.minimum_payment)}/mo min</p>
                  </div>
                  <span className="text-sm font-semibold text-red-400">{formatCurrency(l.balance)}</span>
                </div>
              ))}
              <div className="border-t border-[var(--color-border)] pt-3 flex justify-between font-semibold text-sm">
                <span>Total Debt</span>
                <span className="text-red-400">{formatCurrency(totalDebt)}</span>
              </div>
            </div>
          </div>

          {/* Plan results */}
          {plan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Debt-Free Date', value: new Date(plan.payoffDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), color: 'text-green-400' },
                  { label: 'Months to Pay Off', value: `${plan.payoffMonths} months`, color: 'text-[var(--color-text-primary)]' },
                  { label: 'Total Interest', value: formatCurrency(plan.totalInterestPaid), color: 'text-red-400' },
                  { label: 'Total Paid', value: formatCurrency(plan.totalPaid), color: 'text-[var(--color-text-primary)]' },
                ].map(({ label, value, color }) => (
                  <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[var(--color-bg-card)] rounded-2xl p-4 border border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-secondary)] mb-1">{label}</p>
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Balance over time chart */}
              <div className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-border)]">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Balance Over Time</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 5)} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [formatCurrency(v), 'Remaining Balance']} />
                    <Area type="monotone" dataKey="balance" stroke="#ef4444" strokeWidth={2} fill="url(#debtGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Payoff order */}
              {plan.debtOrder.length > 0 && (
                <div className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-border)]">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Payoff Order</h3>
                  <div className="space-y-3">
                    {plan.debtOrder.map((d, i) => (
                      <div key={d.id} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[var(--color-accent)] text-white text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{d.name}</p>
                        </div>
                        <div className="flex items-center gap-1 text-green-400">
                          <Target size={13} />
                          <span className="text-xs font-medium">{d.payoffLabel}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

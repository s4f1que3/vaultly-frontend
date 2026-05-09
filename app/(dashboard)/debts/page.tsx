'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, TrendingDown, Target, Zap, Loader2 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import { useNetWorthStore } from '@/stores/useNetWorthStore';
import { DebtPayoffPlan, PayoffStrategy } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import api from '@/lib/api';

// ── Pure math ──────────────────────────────────────────────────────────────────

function monthlyRate(annualPct: number) { return annualPct / 100 / 12; }

function calcPayment(principal: number, annualPct: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  if (annualPct === 0) return principal / (years * 12);
  const r = monthlyRate(annualPct);
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function calcPurchasingPower(monthlyBudget: number, annualPct: number, years: number): number {
  if (monthlyBudget <= 0 || years <= 0) return 0;
  if (annualPct === 0) return monthlyBudget * years * 12;
  const r = monthlyRate(annualPct);
  const n = years * 12;
  return monthlyBudget * (1 - Math.pow(1 + r, -n)) / r;
}

function buildAmortization(principal: number, annualPct: number, years: number, extraMonthly = 0) {
  const r = monthlyRate(annualPct);
  const payment = calcPayment(principal, annualPct, years) + extraMonthly;
  let balance = principal;
  let totalInterest = 0;
  const data: { year: number; balance: number; cumulativeInterest: number }[] = [];
  data.push({ year: 0, balance: principal, cumulativeInterest: 0 });
  const maxMonths = years * 12;

  for (let m = 1; m <= maxMonths && balance > 0.01; m++) {
    const interest = balance * r;
    const principalPaid = Math.min(payment - interest, balance);
    balance = Math.max(0, balance - principalPaid);
    totalInterest += interest;
    if (m % 12 === 0) {
      data.push({ year: m / 12, balance: Math.round(balance), cumulativeInterest: Math.round(totalInterest) });
    }
  }
  return data;
}

function extraPaymentStats(principal: number, annualPct: number, years: number, extra: number) {
  if (extra <= 0) return null;
  const basePayment = calcPayment(principal, annualPct, years);
  const r = monthlyRate(annualPct);
  let balance = principal;
  let months = 0;
  let totalInterest = 0;
  while (balance > 0.01 && months < years * 12 * 2) {
    const interest = balance * r;
    const paid = Math.min(basePayment + extra - interest, balance);
    balance -= paid;
    totalInterest += interest;
    months++;
  }
  const baseTotalInterest = calcPayment(principal, annualPct, years) * years * 12 - principal;
  return {
    monthsSaved: years * 12 - months,
    interestSaved: Math.max(0, baseTotalInterest - totalInterest),
  };
}

const QUICK_TERMS = [5, 10, 15, 20, 25, 30];

// ── Loan Calculator Tab ────────────────────────────────────────────────────────

function LoanCalculator() {
  const [loanAmount, setLoanAmount] = useState('250000');
  const [downPayment, setDownPayment] = useState('');
  const [rate, setRate] = useState('6.5');
  const [term, setTerm] = useState(30);
  const [targetPayment, setTargetPayment] = useState('1500');
  const [extraPayment, setExtraPayment] = useState('');

  const loanNum = parseFloat(loanAmount) || 0;
  const downNum = parseFloat(downPayment) || 0;
  const rateNum = parseFloat(rate) || 0;
  const targetNum = parseFloat(targetPayment) || 0;
  const extraNum = parseFloat(extraPayment) || 0;

  const principal = Math.max(0, loanNum - downNum);

  const monthly = useMemo(() => calcPayment(principal, rateNum, term), [principal, rateNum, term]);
  const totalPaid = useMemo(() => monthly * term * 12, [monthly, term]);
  const totalInterest = useMemo(() => totalPaid - principal, [totalPaid, principal]);
  const interestPct = principal > 0 ? (totalInterest / principal) * 100 : 0;
  const principalPct = 100 - Math.min(100, Math.max(0, (totalInterest / totalPaid) * 100));

  const purchasingPower = useMemo(
    () => calcPurchasingPower(targetNum, rateNum, term),
    [targetNum, rateNum, term],
  );

  const extra = useMemo(
    () => extraPaymentStats(principal, rateNum, term, extraNum),
    [principal, rateNum, term, extraNum],
  );

  const amortData = useMemo(
    () => buildAmortization(principal, rateNum, term, extraNum),
    [principal, rateNum, term, extraNum],
  );

  const termComparison = useMemo(() =>
    QUICK_TERMS.map((y) => {
      const m = calcPayment(principal, rateNum, y);
      const ti = m * y * 12 - principal;
      return { years: y, monthly: m, totalInterest: ti, totalCost: m * y * 12 };
    }),
  [principal, rateNum]);

  return (
    <div className="space-y-5">

      {/* ── Inputs ── */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Loan Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Loan amount ($)</label>
            <input
              type="number" value={loanAmount} min={0} step={1000}
              placeholder="e.g. 250000"
              onChange={(e) => setLoanAmount(e.target.value)}
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Down payment ($) <span className="text-[var(--color-text-muted)]">(optional)</span></label>
            <input
              type="number" value={downPayment} min={0} step={1000}
              placeholder="e.g. 50000"
              onChange={(e) => setDownPayment(e.target.value)}
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Annual interest rate (%)</label>
            <input
              type="number" value={rate} min={0} max={40} step={0.1}
              placeholder="e.g. 6.5"
              onChange={(e) => setRate(e.target.value)}
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Loan term</label>
            <div className="flex gap-1.5 flex-wrap">
              {QUICK_TERMS.map((y) => (
                <button
                  key={y} onClick={() => setTerm(y)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all flex-1 ${
                    term === y
                      ? 'border-[rgba(87,201,60,0.6)] bg-[rgba(87,201,60,0.12)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[rgba(87,201,60,0.3)]'
                  }`}
                >
                  {y}yr
                </button>
              ))}
            </div>
          </div>
        </div>
        {downNum > 0 && loanNum > 0 && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Financing {formatCurrency(principal)} after {formatCurrency(downNum)} down ({((downNum / loanNum) * 100).toFixed(1)}%)
          </p>
        )}
      </div>

      {/* ── Result hero ── */}
      <motion.div layout className="card p-6">
        <p className="text-xs text-[var(--color-text-muted)] mb-1 text-center">Monthly Payment</p>
        <p className="text-5xl font-bold text-[var(--color-accent)] text-center mb-5">
          {formatCurrency(monthly)}
        </p>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Principal', value: formatCurrency(principal), color: 'var(--color-text-primary)' },
            { label: 'Total Interest', value: formatCurrency(totalInterest), color: 'var(--color-danger)' },
            { label: 'Total Cost', value: formatCurrency(totalPaid), color: 'var(--color-text-primary)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-3 rounded-xl bg-[var(--color-surface-2)]">
              <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">{label}</p>
              <p className="text-sm font-semibold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Principal vs interest bar */}
        <div>
          <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mb-1">
            <span>Principal {principalPct.toFixed(0)}%</span>
            <span>Interest {(100 - principalPct).toFixed(0)}%</span>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[var(--color-accent)] transition-all duration-500"
              style={{ width: `${principalPct}%` }}
            />
            <div className="flex-1 bg-[var(--color-danger)] opacity-70" />
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 text-center">
            You pay {formatCurrency(totalInterest)} in interest — {interestPct.toFixed(0)}% of the loan amount
          </p>
        </div>
      </motion.div>

      {/* ── Insights: purchasing power + extra payments ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Purchasing power */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-info)]/10 flex items-center justify-center">
              <Zap size={14} className="text-[var(--color-info)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Purchasing Power</h3>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            At {rateNum}% for {term} years, how much can you borrow with a given monthly budget?
          </p>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Monthly budget ($)</label>
          <input
            type="number" value={targetPayment} min={0} step={50}
            placeholder="e.g. 1500"
            onChange={(e) => setTargetPayment(e.target.value)}
            className="input-base mb-3"
          />
          <div className="rounded-xl bg-[var(--color-surface-2)] p-3 text-center">
            <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Max loan you can afford</p>
            <p className="text-2xl font-bold text-[var(--color-info)]">{formatCurrency(purchasingPower)}</p>
            {downNum > 0 && (
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                Total purchase price with {formatCurrency(downNum)} down: {formatCurrency(purchasingPower + downNum)}
              </p>
            )}
          </div>
        </div>

        {/* Extra payment savings */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
              <Target size={14} className="text-[var(--color-accent)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Pay It Off Early</h3>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            See how much you save by adding extra to each payment.
          </p>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Extra per month ($)</label>
          <input
            type="number" value={extraPayment} min={0} step={50}
            placeholder="e.g. 200"
            onChange={(e) => setExtraPayment(e.target.value)}
            className="input-base mb-3"
          />
          <div className="rounded-xl bg-[var(--color-surface-2)] p-3">
            {extra && extra.monthsSaved > 0 ? (
              <div className="text-center space-y-1">
                <p className="text-[10px] text-[var(--color-text-muted)]">You save</p>
                <p className="text-2xl font-bold text-[var(--color-accent)]">{formatCurrency(extra.interestSaved)}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  in interest and pay off {Math.floor(extra.monthsSaved / 12)}yr {extra.monthsSaved % 12}mo early
                </p>
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)] text-center py-2">Enter an extra amount to see savings</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Term comparison ── */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Term Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="text-left pb-2 font-medium">Term</th>
                <th className="text-right pb-2 font-medium">Monthly</th>
                <th className="text-right pb-2 font-medium">Total Interest</th>
                <th className="text-right pb-2 font-medium">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {termComparison.map(({ years, monthly: m, totalInterest: ti, totalCost: tc }) => (
                <tr
                  key={years}
                  className={`transition-colors ${years === term ? 'bg-[rgba(87,201,60,0.06)]' : ''}`}
                >
                  <td className={`py-2.5 font-medium ${years === term ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>
                    {years} years {years === term && <span className="text-[9px] ml-1 opacity-60">← selected</span>}
                  </td>
                  <td className="py-2.5 text-right text-[var(--color-text-primary)] font-medium">{formatCurrency(m)}</td>
                  <td className="py-2.5 text-right text-[var(--color-danger)]">{formatCurrency(ti)}</td>
                  <td className="py-2.5 text-right text-[var(--color-text-secondary)]">{formatCurrency(tc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Amortization chart ── */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Balance Over Time</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          {extraNum > 0
            ? `With $${extraNum}/mo extra — paid off ${Math.floor((extra?.monthsSaved ?? 0) / 12)}yr ${(extra?.monthsSaved ?? 0) % 12}mo early`
            : `Remaining balance each year over ${term} years`}
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={amortData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="intGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              tickLine={false} axisLine={false}
              tickFormatter={(v) => `${v}yr`}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              tickLine={false} axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }}
              formatter={(v: unknown, name: string) => [
                formatCurrency(Number(v ?? 0)),
                name === 'balance' ? 'Remaining Balance' : 'Cumulative Interest',
              ]}
              labelFormatter={(l) => `Year ${l}`}
            />
            <Area type="monotone" dataKey="balance" stroke="#ef4444" strokeWidth={2} fill="url(#balGrad)" dot={false} />
            <Area type="monotone" dataKey="cumulativeInterest" stroke="var(--color-accent)" strokeWidth={1.5} fill="url(#intGrad)" dot={false} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 justify-center text-[10px] text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#ef4444] inline-block rounded" /> Remaining balance</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[var(--color-accent)] inline-block rounded" style={{ borderTop: '2px dashed' }} /> Cumulative interest</span>
        </div>
      </div>
    </div>
  );
}

// ── Payoff Planner Tab ─────────────────────────────────────────────────────────

function PayoffPlanner() {
  const { netWorth, fetchNetWorth } = useNetWorthStore();
  const [strategy, setStrategy] = useState<PayoffStrategy>('avalanche');
  const [monthlyBudget, setMonthlyBudget] = useState(500);
  const [plan, setPlan] = useState<DebtPayoffPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchNetWorth(); }, [fetchNetWorth]);

  const liabilities = netWorth?.liabilities.items ?? [];
  const totalDebt = netWorth?.totalLiabilities ?? 0;
  const minPayments = liabilities.reduce((s, l) => s + l.minimum_payment, 0);

  const calculate = async () => {
    setIsLoading(true); setError('');
    try {
      const data = await api.post<DebtPayoffPlan>('/debts/payoff', { monthlyBudget, strategy });
      setPlan(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
    } finally { setIsLoading(false); }
  };

  const chartData = plan?.schedule
    .filter((_, i) => i % 3 === 0 || plan.payoffMonths <= 24)
    .map((s) => ({ label: s.label, balance: s.totalBalance })) ?? [];

  if (liabilities.length === 0) {
    return (
      <div className="card p-12 text-center">
        <TrendingDown size={40} className="mx-auto mb-4 text-[var(--color-text-muted)] opacity-40" />
        <p className="text-[var(--color-text-secondary)] font-medium mb-1">No debts added yet</p>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">Add your liabilities from the Net Worth page first.</p>
        <a href="/net-worth" className="btn-primary text-sm inline-flex items-center gap-1.5">Go to Net Worth</a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Config */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Payoff Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">Strategy</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {(['avalanche', 'snowball'] as const).map((s) => (
                <button key={s} onClick={() => setStrategy(s)}
                  className={`py-2 rounded-lg border text-sm font-medium transition-all capitalize ${
                    strategy === s
                      ? 'border-[rgba(87,201,60,0.6)] bg-[rgba(87,201,60,0.12)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[rgba(87,201,60,0.3)]'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              {strategy === 'avalanche'
                ? 'Pay highest interest first — saves the most money'
                : 'Pay smallest balance first — quick wins build momentum'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Monthly debt budget ($)</label>
            <input
              type="number" value={monthlyBudget} step={50} min={minPayments}
              onChange={(e) => setMonthlyBudget(Number(e.target.value))}
              className="input-base"
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Min required: {formatCurrency(minPayments)}/mo
            </p>
          </div>
        </div>
        {error && <p className="text-[var(--color-danger)] text-xs mt-3">{error}</p>}
        <button
          onClick={calculate}
          disabled={isLoading || monthlyBudget < minPayments}
          className="btn-primary mt-4"
        >
          {isLoading ? <><Loader2 size={14} className="animate-spin" /> Calculating…</> : 'Calculate Plan'}
        </button>
      </div>

      {/* Debt list */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Your Debts</h3>
        <div className="space-y-3">
          {liabilities.map((l) => (
            <div key={l.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{l.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{l.interest_rate}% APR · {formatCurrency(l.minimum_payment)}/mo min</p>
              </div>
              <span className="text-sm font-semibold text-[var(--color-danger)]">{formatCurrency(l.balance)}</span>
            </div>
          ))}
          <div className="border-t border-[var(--color-border)] pt-3 flex justify-between font-semibold text-sm">
            <span className="text-[var(--color-text-primary)]">Total Debt</span>
            <span className="text-[var(--color-danger)]">{formatCurrency(totalDebt)}</span>
          </div>
        </div>
      </div>

      {/* Plan results */}
      <AnimatePresence>
        {plan && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Debt-Free Date', value: new Date(plan.payoffDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), color: 'var(--color-success)' },
                { label: 'Months to Pay Off', value: `${plan.payoffMonths}mo`, color: 'var(--color-text-primary)' },
                { label: 'Total Interest', value: formatCurrency(plan.totalInterestPaid), color: 'var(--color-danger)' },
                { label: 'Total Paid', value: formatCurrency(plan.totalPaid), color: 'var(--color-text-primary)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="card p-4">
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">{label}</p>
                  <p className="text-lg font-bold" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Balance Over Time</h3>
              <ResponsiveContainer width="100%" height={200}>
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
                  <Tooltip contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }} formatter={(v: unknown) => [formatCurrency(Number(v ?? 0)), 'Remaining Balance']} />
                  <Area type="monotone" dataKey="balance" stroke="#ef4444" strokeWidth={2} fill="url(#debtGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {plan.debtOrder.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Payoff Order</h3>
                <div className="space-y-3">
                  {plan.debtOrder.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[var(--color-accent)] text-[#0d0a06] text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                      <p className="text-sm font-medium text-[var(--color-text-primary)] flex-1">{d.name}</p>
                      <div className="flex items-center gap-1 text-[var(--color-success)]">
                        <Target size={13} />
                        <span className="text-xs font-medium">{d.payoffLabel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DebtsPage() {
  const [tab, setTab] = useState<'calculator' | 'planner'>('calculator');

  return (
    <div className="px-4 py-6 sm:px-6 max-w-4xl mx-auto">
      <PageHeader
        title="Debt Planner"
        subtitle="Calculate loan payments and plan your path to debt-free"
      />

      {/* Tab switcher */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {([
          { key: 'calculator', label: 'Loan Calculator', icon: Calculator },
          { key: 'planner',    label: 'Payoff Planner',  icon: TrendingDown },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              tab === key
                ? 'border-[rgba(87,201,60,0.6)] bg-[rgba(87,201,60,0.12)] text-[var(--color-accent)]'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[rgba(87,201,60,0.3)]'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {tab === 'calculator' ? <LoanCalculator /> : <PayoffPlanner />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

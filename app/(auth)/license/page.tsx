'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingBag, KeyRound, ArrowLeft, Infinity, Check } from 'lucide-react';

const PERKS = [
  'One-time payment — no recurring fees',
  'Full access to every Vaultly feature',
  'All future updates included',
  'Lifetime account, never expires',
];

export default function LicensePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <button
          onClick={() => router.push('/subscribe')}
          className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          Back to plans
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[var(--color-accent-dim)] rounded-2xl mb-4">
            <Infinity size={28} className="text-[var(--color-accent)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Lifetime License
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Pay once, use forever. No subscription required.
          </p>
        </div>

        {/* Price card */}
        <div className="card p-6 mb-4">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">One-time payment</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-4xl font-bold text-[var(--color-text-primary)]">$400</span>
                <span className="text-sm text-[var(--color-text-muted)]">USD</span>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-[var(--color-accent-dim)] text-[var(--color-accent)] rounded-full">
              Lifetime
            </span>
          </div>

          <ul className="space-y-2.5 mb-6">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-2.5">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[var(--color-accent-dim)] flex items-center justify-center">
                  <Check size={10} className="text-[var(--color-accent)]" strokeWidth={3} />
                </span>
                <span className="text-sm text-[var(--color-text-secondary)]">{perk}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => router.push('/license/purchase')}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} />
            Buy lifetime license
          </button>
        </div>

        {/* Already have a key */}
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-[var(--color-surface-2)] rounded-xl flex items-center justify-center flex-shrink-0">
            <KeyRound size={18} className="text-[var(--color-text-muted)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Already have a license?
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Create your account using your license key
            </p>
          </div>
          <button
            onClick={() => router.push('/signup/license')}
            className="btn-ghost text-sm flex-shrink-0"
          >
            Sign up
          </button>
        </div>
      </motion.div>
    </div>
  );
}

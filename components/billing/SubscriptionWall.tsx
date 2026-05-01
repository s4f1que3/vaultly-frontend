'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, CreditCard, AlertTriangle, Clock, RefreshCw, Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { useBillingStore } from '@/stores/useBillingStore';
import type { AccessCheck } from '@/types';

interface Props {
  access: AccessCheck;
}

const CONFIG: Record<string, {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: (access: AccessCheck) => string;
}> = {
  frozen: {
    icon: Lock,
    iconColor: 'text-[var(--color-danger)]',
    iconBg: 'bg-[rgba(239,68,68,0.1)]',
    title: 'Account frozen',
    description: () =>
      'Your payment failed and the grace period has passed. Reactivate your subscription to regain access.',
  },
  past_due: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-400/10',
    title: 'Payment past due',
    description: (a) =>
      a.gracePeriodEnd
        ? `Your payment failed. You have until ${format(parseISO(a.gracePeriodEnd), 'MMMM d, yyyy')} to update your payment method.`
        : 'Your payment failed. Please update your payment method to continue.',
  },
  expired: {
    icon: Clock,
    iconColor: 'text-[var(--color-text-muted)]',
    iconBg: 'bg-[var(--color-surface-2)]',
    title: 'Subscription expired',
    description: () => 'Your subscription period has ended. Resubscribe to get back full access.',
  },
  pending: {
    icon: RefreshCw,
    iconColor: 'text-[var(--color-accent)]',
    iconBg: 'bg-[var(--color-accent-dim)]',
    title: 'Subscription pending',
    description: () => 'Your PayPal authorization is pending. If you completed payment, please wait a moment.',
  },
  none: {
    icon: CreditCard,
    iconColor: 'text-[var(--color-accent)]',
    iconBg: 'bg-[var(--color-accent-dim)]',
    title: 'Subscription required',
    description: () => 'Vaultly is a premium app. Subscribe to get full access to all features.',
  },
};

export default function SubscriptionWall({ access }: Props) {
  const router = useRouter();
  const { getPaymentMethodUpdateUrl, isLoading } = useBillingStore();
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const cfg = CONFIG[access.status] ?? CONFIG.none;
  const Icon = cfg.icon;

  const isFrozenOrPastDue = access.status === 'frozen' || access.status === 'past_due';
  const needsNewSubscription =
    access.status === 'none' || access.status === 'expired' || access.status === 'cancelled';

  const handleUpdatePayment = async () => {
    setUpdatingPayment(true);
    try {
      const url = await getPaymentMethodUpdateUrl();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // If no subscription found, send to subscribe page
      router.push('/subscribe');
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleResubscribe = () => router.push('/subscribe');

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md w-full card p-10"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`w-16 h-16 ${cfg.iconBg} rounded-full flex items-center justify-center mx-auto mb-5`}
        >
          <Icon size={32} className={cfg.iconColor} />
        </motion.div>

        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          {cfg.title}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-7">
          {cfg.description(access)}
        </p>

        {/* CTA buttons */}
        <div className="space-y-3">
          {isFrozenOrPastDue && (
            <button
              onClick={handleUpdatePayment}
              disabled={updatingPayment || isLoading}
              className="btn-primary w-full text-sm flex items-center justify-center gap-2"
            >
              {updatingPayment ? (
                <><Loader2 size={15} className="animate-spin" /> Opening PayPal…</>
              ) : (
                <><CreditCard size={15} /> Update payment method</>
              )}
            </button>
          )}

          {needsNewSubscription && (
            <button
              onClick={handleResubscribe}
              className="btn-primary w-full text-sm flex items-center justify-center gap-2"
            >
              <CreditCard size={15} />
              {access.status === 'cancelled' ? 'Resubscribe' : 'Subscribe now'}
            </button>
          )}

          {access.status === 'pending' && (
            <button
              onClick={() => window.location.reload()}
              className="btn-ghost w-full text-sm"
            >
              <RefreshCw size={15} className="inline mr-2" />
              Refresh
            </button>
          )}
        </div>

        {/* Always offer the license path as an escape hatch */}
        <div className="mt-6 pt-5 border-t border-[var(--color-border)] flex items-center justify-center gap-4 text-xs text-[var(--color-text-muted)]">
          <Link href="/license" className="flex items-center gap-1.5 hover:text-[var(--color-accent)] transition-colors">
            <KeyRound size={12} />
            Use a lifetime license
          </Link>
          <span>·</span>
          <a href="mailto:contact@vaultly.app" className="hover:text-[var(--color-accent)] transition-colors">
            Contact support
          </a>
        </div>
      </motion.div>
    </div>
  );
}

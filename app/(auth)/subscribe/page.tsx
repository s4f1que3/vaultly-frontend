'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Zap, Shield, BarChart3, AlertCircle, Loader2, Infinity } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useBillingStore } from '@/stores/useBillingStore';
import type { BillingPlan } from '@/types';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paypal?: any;
  }
}

const FEATURES = [
  'Full transaction tracking',
  'Smart budget alerts',
  'Financial goals & milestones',
  'Advanced analytics & charts',
  'Card management',
  'Push notifications',
  'Spending insights',
  'Monthly & yearly summaries',
];

const PLANS = [
  {
    id: 'monthly' as BillingPlan,
    name: 'Monthly',
    price: 8,
    period: '/mo',
    badge: null,
    description: 'Billed monthly — cancel anytime',
  },
  {
    id: 'yearly' as BillingPlan,
    name: 'Yearly',
    price: 100,
    period: '/yr',
    badge: 'Save $16',
    description: 'Billed once per year',
  },
];

export default function SubscribePage() {
  const router = useRouter();
  const { activateSubscription } = useBillingStore();
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>('monthly');
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const paypalRef = useRef<HTMLDivElement>(null);
  const buttonsInstance = useRef<{ close: () => void } | null>(null);

  // Load PayPal JS SDK once
  useEffect(() => {
    if (window.paypal) { setSdkReady(true); return; }
    if (document.getElementById('paypal-sdk')) { setSdkReady(true); return; }

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setError('Failed to load PayPal. Please refresh the page.');
    document.head.appendChild(script);
  }, []);

  // Re-render PayPal buttons whenever plan or SDK readiness changes
  useEffect(() => {
    if (!sdkReady || !paypalRef.current || !window.paypal) return;

    // Destroy previous instance
    if (buttonsInstance.current) {
      buttonsInstance.current.close();
      buttonsInstance.current = null;
    }
    if (paypalRef.current) paypalRef.current.innerHTML = '';

    const buttons = window.paypal.Buttons({
      style: {
        shape: 'pill',
        color: 'gold',
        layout: 'vertical',
        label: 'subscribe',
      },

      createSubscription: async () => {
        setError('');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/billing/subscribe`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ plan: selectedPlan, email: session.user.email }),
          },
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to create subscription');
        }

        const { subscriptionId } = await res.json();
        return subscriptionId;
      },

      onApprove: async (data: { subscriptionID: string }) => {
        setIsActivating(true);
        setError('');
        try {
          await activateSubscription(data.subscriptionID);
          router.replace('/dashboard');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Activation failed. Please contact support.');
          setIsActivating(false);
        }
      },

      onCancel: () => {
        setError('Payment cancelled — your plan is still available when you\'re ready.');
      },

      onError: (err: unknown) => {
        console.error('PayPal error', err);
        setError('Something went wrong with PayPal. Please try again.');
      },
    });

    if (buttons.isEligible()) {
      buttons.render(paypalRef.current);
      buttonsInstance.current = buttons;
    } else {
      setError('PayPal is not available in your region.');
    }

    return () => {
      buttons.close?.();
    };
  }, [sdkReady, selectedPlan]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-[var(--color-accent-dim)] text-[var(--color-accent)] text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
          >
            <Zap size={12} />
            Premium Access
          </motion.div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            Choose your plan
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm max-w-md mx-auto">
            Full access to every Vaultly feature. Cancel anytime, no questions asked.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Plans + PayPal */}
          <div className="space-y-3">
            {PLANS.map((plan, i) => (
              <motion.button
                key={plan.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all relative ${
                  selectedPlan === plan.id
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-2.5 left-4 bg-[var(--color-accent)] text-[#0d0a06] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {plan.badge}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedPlan === plan.id
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
                        : 'border-[var(--color-border)]'
                    }`}
                  >
                    {selectedPlan === plan.id && (
                      <Check size={11} className="text-[#0d0a06]" strokeWidth={3} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--color-text-primary)] text-base">
                      {plan.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {plan.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-baseline gap-0.5">
                    <span className="text-2xl font-bold text-[var(--color-text-primary)]">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-[var(--color-text-muted)]">
                      {plan.period}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}

            {/* PayPal buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="space-y-3 pt-1"
            >
              {error && (
                <div className="flex items-start gap-2 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl p-3 text-sm text-[var(--color-danger)]">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {isActivating ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-[var(--color-text-secondary)]">
                  <Loader2 size={16} className="animate-spin text-[var(--color-accent)]" />
                  Activating your subscription…
                </div>
              ) : (
                <>
                  {!sdkReady && (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-[var(--color-text-muted)]">
                      <Loader2 size={14} className="animate-spin" />
                      Loading payment options…
                    </div>
                  )}
                  {/* PayPal renders here — shows PayPal button + "Debit or Credit Card" option */}
                  <div ref={paypalRef} className={sdkReady ? '' : 'hidden'} />
                </>
              )}

              <p className="text-center text-xs text-[var(--color-text-muted)]">
                Secured by PayPal · Pay with PayPal or credit/debit card
              </p>

              {/* Lifetime license option */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--color-border)]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[var(--color-bg)] px-3 text-xs text-[var(--color-text-muted)]">or</span>
                </div>
              </div>

              <Link
                href="/license"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text-primary)] transition-all"
              >
                <Infinity size={15} className="text-[var(--color-accent)]" />
                Buy a lifetime license — $400 one-time
              </Link>
            </motion.div>
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <Shield size={18} className="text-[var(--color-accent)]" />
              <h2 className="font-semibold text-[var(--color-text-primary)] text-sm">
                Everything included
              </h2>
            </div>

            <ul className="space-y-3">
              {FEATURES.map((feature, i) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.04 }}
                  className="flex items-center gap-3"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-accent-dim)] flex items-center justify-center">
                    <Check size={11} className="text-[var(--color-accent)]" strokeWidth={3} />
                  </span>
                  <span className="text-sm text-[var(--color-text-secondary)]">{feature}</span>
                </motion.li>
              ))}
            </ul>

            <div className="mt-6 pt-5 border-t border-[var(--color-border)] space-y-2">
              {[
                { icon: BarChart3, text: 'Bill date matches your signup day — no surprises' },
                { icon: Shield, text: 'Grace period on any missed payment until month end' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2">
                  <Icon size={13} className="text-[var(--color-accent)] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[var(--color-text-muted)]">{text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

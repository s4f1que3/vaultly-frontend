'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { useBillingStore } from '@/stores/useBillingStore';

type Phase = 'activating' | 'plan_change' | 'success' | 'error';

export default function BillingSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { activateSubscription, completePlanChange, fetchStatus } = useBillingStore();
  const [phase, setPhase] = useState<Phase>('activating');
  const [errorMsg, setErrorMsg] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const subscriptionId = params.get('subscription_id');
    const mode = params.get('mode'); // 'plan_change' if coming from plan change flow

    if (!subscriptionId) {
      setErrorMsg('Missing subscription ID in return URL');
      setPhase('error');
      return;
    }

    const activate = async () => {
      try {
        if (mode === 'plan_change') {
          setPhase('plan_change');
          await completePlanChange(subscriptionId);
        } else {
          setPhase('activating');
          await activateSubscription(subscriptionId);
        }
        await fetchStatus();
        setPhase('success');
        setTimeout(() => router.replace('/dashboard'), 2200);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Activation failed. Please contact support.');
        setPhase('error');
      }
    };

    activate();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm w-full card p-10"
      >
        {(phase === 'activating' || phase === 'plan_change') && (
          <>
            <Loader2 size={48} className="animate-spin text-[var(--color-accent)] mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {phase === 'plan_change' ? 'Updating your plan…' : 'Activating your subscription…'}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">
              Verifying your payment with PayPal
            </p>
          </>
        )}

        {phase === 'success' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="w-16 h-16 bg-[var(--color-accent-dim)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-[var(--color-accent)]" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">You&apos;re in!</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              Welcome to Vaultly Premium. Redirecting to your dashboard…
            </p>
          </motion.div>
        )}

        {phase === 'error' && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="w-16 h-16 bg-[rgba(239,68,68,0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-[var(--color-danger)]" />
            </div>
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Something went wrong
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-2 mb-5">{errorMsg}</p>
            <button
              onClick={() => router.push('/subscribe')}
              className="btn-primary text-sm w-full"
            >
              Try again
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

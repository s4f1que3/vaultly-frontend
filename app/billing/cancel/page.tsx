'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function BillingCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm w-full card p-10"
      >
        <div className="w-16 h-16 bg-[var(--color-surface-2)] rounded-full flex items-center justify-center mx-auto mb-4">
          <X size={32} className="text-[var(--color-text-muted)]" />
        </div>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Payment cancelled</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 mb-6">
          You cancelled the PayPal checkout. No payment was taken.
        </p>
        <button
          onClick={() => router.push('/subscribe')}
          className="btn-primary text-sm w-full"
        >
          Back to plans
        </button>
      </motion.div>
    </div>
  );
}

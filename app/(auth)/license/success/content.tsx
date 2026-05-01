'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Copy, KeyRound, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function LicenseSuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const licenseKey = params.get('key') ?? '';
  const email = params.get('email') ?? '';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md card p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-16 h-16 bg-[var(--color-accent-dim)] rounded-full flex items-center justify-center mx-auto mb-5"
        >
          <Check size={30} className="text-[var(--color-accent)]" strokeWidth={2.5} />
        </motion.div>

        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          Payment successful!
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-7">
          Your license key has been emailed to{' '}
          <span className="font-medium text-[var(--color-text-primary)]">{email}</span>.
          It&apos;s also shown below — save it somewhere safe.
        </p>

        {/* License key display */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound size={13} className="text-[var(--color-accent)]" />
            <span className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wide">
              Your License Key
            </span>
          </div>
          <p className="text-lg font-bold text-[var(--color-text-primary)] font-mono tracking-widest break-all mb-4">
            {licenseKey}
          </p>
          <button
            onClick={handleCopy}
            className="w-full btn-ghost text-sm flex items-center justify-center gap-2"
          >
            {copied ? (
              <><Check size={14} className="text-[var(--color-accent)]" /> Copied!</>
            ) : (
              <><Copy size={14} /> Copy key</>
            )}
          </button>
        </div>

        <button
          onClick={() => router.push('/signup/license')}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          Create my account
          <ArrowRight size={15} />
        </button>

        <p className="text-xs text-[var(--color-text-muted)] mt-4">
          This key is single-use. Once linked to your account it cannot be transferred.
        </p>
      </motion.div>
    </div>
  );
}

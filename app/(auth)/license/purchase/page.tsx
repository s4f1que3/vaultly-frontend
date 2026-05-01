'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, AlertCircle, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paypal?: any;
  }
}

export default function LicensePurchasePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const paypalRef = useRef<HTMLDivElement>(null);
  const buttonsInstance = useRef<{ close: () => void } | null>(null);

  // Load PayPal SDK for one-time orders (different params from subscription SDK)
  useEffect(() => {
    const existingScript = document.getElementById('paypal-order-sdk');
    if (existingScript) {
      if (window.paypal) setSdkReady(true);
      else existingScript.addEventListener('load', () => setSdkReady(true));
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const script = document.createElement('script');
    script.id = 'paypal-order-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setError('Failed to load PayPal. Please refresh.');
    document.head.appendChild(script);
  }, []);

  // Render PayPal buttons once email is confirmed and SDK is ready
  useEffect(() => {
    if (!sdkReady || !emailConfirmed || !paypalRef.current || !window.paypal) return;

    if (buttonsInstance.current) {
      buttonsInstance.current.close();
      buttonsInstance.current = null;
    }
    if (paypalRef.current) paypalRef.current.innerHTML = '';

    const buttons = window.paypal.Buttons({
      style: { shape: 'pill', color: 'gold', layout: 'vertical', label: 'pay' },

      createOrder: async () => {
        setError('');
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/licenses/initiate-purchase`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          },
        );
        if (!res.ok) throw new Error('Failed to create order');
        const { orderId } = await res.json();
        return orderId;
      },

      onApprove: async (data: { orderID: string }) => {
        setIsCapturing(true);
        setError('');
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/licenses/capture-purchase`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order_id: data.orderID, email }),
            },
          );
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Payment captured but license generation failed');
          }
          const { licenseKey } = await res.json();
          // Navigate to success page with the license key
          router.push(`/license/success?key=${encodeURIComponent(licenseKey)}&email=${encodeURIComponent(email)}`);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Something went wrong. Please contact support.');
          setIsCapturing(false);
        }
      },

      onCancel: () => setError('Payment cancelled — your card was not charged.'),
      onError: (err: unknown) => {
        console.error('PayPal error', err);
        setError('PayPal encountered an error. Please try again.');
      },
    });

    if (buttons.isEligible()) {
      buttons.render(paypalRef.current);
      buttonsInstance.current = buttons;
    }

    return () => { buttons.close?.(); };
  }, [sdkReady, emailConfirmed, email]);

  const handleConfirmEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setEmailConfirmed(true);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <button
          onClick={() => router.push('/license')}
          className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        <div className="card p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              Buy Lifetime License
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Your license key will be emailed to you instantly after payment.
            </p>
          </div>

          {/* Price summary */}
          <div className="bg-[var(--color-surface)] rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Vaultly Lifetime License</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">One-time · Never expires</p>
            </div>
            <span className="text-xl font-bold text-[var(--color-text-primary)]">$400</span>
          </div>

          {/* Step 1: Email */}
          {!emailConfirmed ? (
            <form onSubmit={handleConfirmEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                  Email to receive your license key
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-base pl-9"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl p-3 text-sm text-[var(--color-danger)]">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full">
                Continue to payment
              </button>
            </form>
          ) : (
            /* Step 2: PayPal */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[var(--color-surface)] rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-[var(--color-accent)]" />
                  <span className="text-sm text-[var(--color-text-primary)]">{email}</span>
                </div>
                <button
                  onClick={() => { setEmailConfirmed(false); setError(''); }}
                  className="text-xs text-[var(--color-accent)] hover:underline"
                >
                  Change
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl p-3 text-sm text-[var(--color-danger)]">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {isCapturing ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-[var(--color-text-secondary)]">
                  <Loader2 size={16} className="animate-spin text-[var(--color-accent)]" />
                  Processing your payment…
                </div>
              ) : (
                <>
                  {!sdkReady && (
                    <div className="flex items-center justify-center gap-2 py-3 text-sm text-[var(--color-text-muted)]">
                      <Loader2 size={14} className="animate-spin" />
                      Loading payment options…
                    </div>
                  )}
                  <div ref={paypalRef} className={sdkReady ? '' : 'hidden'} />
                </>
              )}

              <p className="text-center text-xs text-[var(--color-text-muted)]">
                Secured by PayPal · Pay with PayPal or credit/debit card
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

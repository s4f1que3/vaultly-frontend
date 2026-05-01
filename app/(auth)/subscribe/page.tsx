'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Check, Zap, Shield, BarChart3, AlertCircle, Loader2, Infinity,
  ArrowRight, RefreshCw, User, Mail, Lock, Eye, EyeOff, LogIn,
} from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/ui/Footer';
import { createClient } from '@/lib/supabase/client';
import { useBillingStore } from '@/stores/useBillingStore';
import { useOtpRateLimit } from '@/hooks/useOtpRateLimit';
import OtpCountdownTimer from '@/components/ui/OtpCountdownTimer';
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

type AuthFlow = 'checking' | 'create_account' | 'verify_otp' | 'ready';

export default function SubscribePage() {
  const router = useRouter();
  const { activateSubscription } = useBillingStore();
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>('monthly');
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [paypalRenderKey, setPaypalRenderKey] = useState(0);
  const paypalRef = useRef<HTMLDivElement>(null);
  const buttonsInstance = useRef<{ close: () => void } | null>(null);

  // Auth flow
  const [authFlow, setAuthFlow] = useState<AuthFlow>('checking');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const rateLimit = useOtpRateLimit(signupEmail);

  // Check auth state on mount
  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      setAuthFlow(session ? 'ready' : 'create_account');
    });
  }, []);

  // Load PayPal JS SDK only once user is ready to pay
  useEffect(() => {
    if (authFlow !== 'ready') return;
    if (window.paypal) { setSdkReady(true); return; }
    if (document.getElementById('paypal-sdk')) { setSdkReady(true); return; }

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setError('Failed to load PayPal. Please refresh the page.');
    document.head.appendChild(script);
  }, [authFlow]);

  // Re-render PayPal buttons whenever plan or SDK readiness changes
  useEffect(() => {
    if (authFlow !== 'ready') return;
    if (!sdkReady || !paypalRef.current || !window.paypal) return;

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
          setPaypalRenderKey((k) => k + 1);
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
  }, [sdkReady, selectedPlan, authFlow, paypalRenderKey]);

  const handleCreateAccount = async () => {
    setAuthError('');
    if (!signupName.trim() || signupName.trim().length < 2) {
      setAuthError('Name must be at least 2 characters');
      return;
    }
    if (!signupEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) {
      setAuthError('Invalid email address');
      return;
    }
    if (!signupPassword || signupPassword.length < 8) {
      setAuthError('Password must be at least 8 characters');
      return;
    }
    if (!agreedToTerms) {
      setAuthError('You must agree to the Terms & Conditions to continue.');
      return;
    }

    setIsCreatingAccount(true);
    const supabase = createClient();
    const { data: result, error: authErr } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: { data: { full_name: signupName.trim() } },
    });
    setIsCreatingAccount(false);

    if (authErr) {
      setAuthError(authErr.message);
      return;
    }

    if (result.user && result.user.identities?.length === 0) {
      setAuthError('An account with this email already exists. Please log in instead.');
      return;
    }

    if (result.session) {
      setAuthFlow('ready');
      return;
    }

    rateLimit.recordRequest(signupEmail);
    setAuthFlow('verify_otp');
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setOtpError('Enter the 6-digit code'); return; }
    setVerifying(true);
    setOtpError('');
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: signupEmail,
      token: otp,
      type: 'email',
    });
    setVerifying(false);
    if (verifyError) {
      setOtpError(verifyError.message);
    } else {
      rateLimit.clear();
      setAuthFlow('ready');
    }
  };

  const resendCode = async () => {
    if (!rateLimit.canResend) return;
    setResending(true);
    setResendMessage('');
    const supabase = createClient();
    const { error: resendErr } = await supabase.auth.resend({ type: 'signup', email: signupEmail });
    setResending(false);
    if (resendErr) {
      setResendMessage(resendErr.message);
    } else {
      rateLimit.recordRequest();
      setResendMessage('Code resent — check your inbox.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
    <div className="flex-1 flex items-center justify-center p-4">
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
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-[var(--color-text-secondary)] mt-3"
          >
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-[var(--color-accent)] font-medium hover:underline inline-flex items-center gap-1"
            >
              <LogIn size={13} />
              Log in
            </Link>
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Plans + Auth/PayPal */}
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

            {/* Auth / PayPal section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="space-y-3 pt-1"
            >

              {/* Checking auth */}
              {authFlow === 'checking' && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={18} className="animate-spin text-[var(--color-accent)]" />
                </div>
              )}

              {/* Create account */}
              {authFlow === 'create_account' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[var(--color-border)]" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-[var(--color-bg)] px-3 text-xs text-[var(--color-text-muted)]">
                        Create your account to subscribe
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                      type="text"
                      placeholder="Full name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="input-base pl-9 text-sm"
                      autoComplete="name"
                    />
                  </div>

                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="input-base pl-9 text-sm"
                      autoComplete="email"
                    />
                  </div>

                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Password (min. 8 characters)"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="input-base pl-9 pr-10 text-sm"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Terms checkbox */}
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-[var(--color-border)] bg-[var(--color-surface-2)] accent-[var(--color-accent)] cursor-pointer"
                    />
                    <span className="text-xs text-[var(--color-text-muted)] leading-relaxed group-hover:text-[var(--color-text-secondary)] transition-colors">
                      I agree to the{' '}
                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        Terms &amp; Conditions
                      </a>
                    </span>
                  </label>

                  {authError && (
                    <div className="flex items-start gap-2 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl p-3 text-sm text-[var(--color-danger)]">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleCreateAccount}
                    disabled={isCreatingAccount || !agreedToTerms}
                    className="btn-primary w-full text-sm"
                  >
                    {isCreatingAccount
                      ? <><Loader2 size={15} className="animate-spin" /> Creating account…</>
                      : <>Continue to payment <ArrowRight size={15} /></>
                    }
                  </button>

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
              )}

              {/* OTP verification */}
              {authFlow === 'verify_otp' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[var(--color-border)]" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-[var(--color-bg)] px-3 text-xs text-[var(--color-text-muted)]">
                        Verify your email
                      </span>
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      We sent a 6-digit code to{' '}
                      <span className="text-[var(--color-text-primary)] font-medium">{signupEmail}</span>
                    </p>
                  </div>

                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="input-base text-center text-2xl tracking-[0.5em] font-mono"
                      autoFocus
                    />
                    {otpError && (
                      <p className="text-[var(--color-danger)] text-xs mt-1 text-center">{otpError}</p>
                    )}
                  </div>

                  <button
                    onClick={verifyOtp}
                    disabled={verifying || otp.length !== 6}
                    className="btn-primary w-full text-sm"
                  >
                    {verifying
                      ? <><Loader2 size={15} className="animate-spin" /> Verifying…</>
                      : <>Verify &amp; continue to payment <ArrowRight size={15} /></>
                    }
                  </button>

                  <div className="space-y-2 text-center">
                    {rateLimit.isLockedOut ? (
                      <p className="text-xs text-[var(--color-danger)]">
                        Too many attempts. Try again in{' '}
                        <span className="font-semibold tabular-nums">
                          {rateLimit.lockoutMinutes}:{String(rateLimit.lockoutRemSeconds).padStart(2, '0')}
                        </span>
                      </p>
                    ) : rateLimit.cooldownSeconds > 0 ? (
                      <div className="flex flex-col items-center gap-1">
                        <OtpCountdownTimer seconds={rateLimit.cooldownSeconds} />
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {rateLimit.attemptsLeft} attempt{rateLimit.attemptsLeft !== 1 ? 's' : ''} left
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={resendCode}
                        disabled={resending || !rateLimit.canResend}
                        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resending
                          ? <><Loader2 size={11} className="animate-spin" /> Resending…</>
                          : <><RefreshCw size={11} /> Resend code</>
                        }
                        {!resending && rateLimit.attemptsLeft <= 2 && rateLimit.attemptsLeft > 0 && (
                          <span className="text-[var(--color-text-muted)]">({rateLimit.attemptsLeft} left)</span>
                        )}
                      </button>
                    )}
                    {resendMessage && (
                      <p className={`text-xs ${resendMessage.includes('resent') ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                        {resendMessage}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => { setAuthFlow('create_account'); rateLimit.clear(); }}
                      className="block mx-auto text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    >
                      Go back
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Ready to pay — PayPal */}
              {authFlow === 'ready' && (
                <>
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
                      <div ref={paypalRef} className={sdkReady ? '' : 'hidden'} />
                    </>
                  )}

                  <p className="text-center text-xs text-[var(--color-text-muted)]">
                    Secured by PayPal · Pay with PayPal or credit/debit card
                  </p>

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
                </>
              )}
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
    <Footer />
    </div>
  );
}

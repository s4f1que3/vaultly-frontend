'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2, ArrowLeft, Lock, Eye, EyeOff, CheckCircle, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useOtpRateLimit } from '@/hooks/useOtpRateLimit';
import OtpCountdownTimer from '@/components/ui/OtpCountdownTimer';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type Step = 'enter_email' | 'enter_otp' | 'new_password' | 'done';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});
const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
});

type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('enter_email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const rateLimit = useOtpRateLimit(email);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  // Step 1: check email exists, then send OTP
  const onEmailSubmit = async (data: EmailForm) => {
    setGeneralError('');
    try {
      const res = await fetch(`${BASE_URL}/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setGeneralError(json?.message || 'No account found with this email address');
        return;
      }
    } catch {
      setGeneralError('Could not reach the server. Please try again.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(data.email);
    if (error) {
      setGeneralError(error.message);
      return;
    }

    setEmail(data.email);
    setStep('enter_otp');
    rateLimit.recordRequest(data.email);
  };

  const resendCode = async () => {
    if (!rateLimit.canResend) return;
    setResending(true);
    setResendMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setResending(false);
    if (error) {
      setResendMessage(error.message);
    } else {
      rateLimit.recordRequest();
      setResendMessage('Code resent — check your inbox.');
    }
  };

  // Step 2: verify OTP
  const verifyOtp = async () => {
    if (otp.length !== 6) { setOtpError('Enter the 6-digit code'); return; }
    setVerifying(true);
    setOtpError('');
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery',
    });
    setVerifying(false);
    if (error) {
      setOtpError(error.message);
    } else {
      setStep('new_password');
    }
  };

  // Step 3: set new password
  const onPasswordSubmit = async (data: PasswordForm) => {
    setGeneralError('');
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      setGeneralError(error.message);
      return;
    }
    await supabase.auth.signOut();
    setStep('done');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] dot-pattern px-4">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[var(--color-accent)] opacity-5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px]"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-block mb-4"
          >
            <Image src="/logo.png" alt="Vaultly" width={64} height={64} className="mx-auto rounded-2xl" />
          </motion.div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            {step === 'enter_email' && 'Reset your password'}
            {step === 'enter_otp' && 'Check your email'}
            {step === 'new_password' && 'Set new password'}
            {step === 'done' && 'Password updated'}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {step === 'enter_email' && "Enter your email and we'll send you a code"}
            {step === 'enter_otp' && `We sent a 6-digit code to ${email}`}
            {step === 'new_password' && 'Choose a strong new password'}
            {step === 'done' && 'You can now sign in with your new password'}
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-8">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Email ── */}
            {step === 'enter_email' && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                      {...emailForm.register('email')}
                      type="email"
                      placeholder="you@example.com"
                      className="input-base pl-9"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-[var(--color-danger)] text-xs mt-1">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                {generalError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3 text-sm text-[var(--color-danger)] break-words"
                  >
                    {generalError}
                  </motion.div>
                )}

                <button type="submit" disabled={emailForm.formState.isSubmitting} className="btn-primary w-full text-sm">
                  {emailForm.formState.isSubmitting
                    ? <><Loader2 size={16} className="animate-spin" /> Checking...</>
                    : <>Send code <ArrowRight size={16} /></>
                  }
                </button>
              </motion.form>
            )}

            {/* ── Step 2: OTP ── */}
            {step === 'enter_otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
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
                    ? <><Loader2 size={16} className="animate-spin" /> Verifying...</>
                    : <>Verify code <ArrowRight size={16} /></>
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
                        ? <><Loader2 size={11} className="animate-spin" /> Resending...</>
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
                    onClick={() => { setOtp(''); setOtpError(''); setStep('enter_email'); rateLimit.clear(); }}
                    className="block mx-auto text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    Go back
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: New password ── */}
            {step === 'new_password' && (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    New password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                      {...passwordForm.register('password')}
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      className="input-base pl-9 pr-10"
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.password && (
                    <p className="text-[var(--color-danger)] text-xs mt-1 break-words">
                      {passwordForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                      {...passwordForm.register('confirm')}
                      type={showPass ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      className="input-base pl-9"
                      autoComplete="new-password"
                    />
                  </div>
                  {passwordForm.formState.errors.confirm && (
                    <p className="text-[var(--color-danger)] text-xs mt-1">{passwordForm.formState.errors.confirm.message}</p>
                  )}
                </div>

                {generalError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3 text-sm text-[var(--color-danger)] break-all"
                  >
                    {generalError}
                  </motion.div>
                )}

                <button type="submit" disabled={passwordForm.formState.isSubmitting} className="btn-primary w-full text-sm">
                  {passwordForm.formState.isSubmitting
                    ? <><Loader2 size={16} className="animate-spin" /> Updating...</>
                    : <>Update password <ArrowRight size={16} /></>
                  }
                </button>
              </motion.form>
            )}

            {/* ── Step 4: Done ── */}
            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-4"
              >
                <CheckCircle size={44} className="mx-auto text-[var(--color-accent)]" />
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Password updated!</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Sign in with your new password to continue.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/login')}
                  className="btn-primary w-full text-sm mt-2"
                >
                  Go to sign in <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          {(step === 'enter_email' || step === 'enter_otp') && (
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
          Plan, Track, Save — with Vaultly
        </p>
      </motion.div>
    </div>
  );
}

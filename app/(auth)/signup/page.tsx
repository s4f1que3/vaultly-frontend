'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useOtpRateLimit } from '@/hooks/useOtpRateLimit';
import OtpCountdownTimer from '@/components/ui/OtpCountdownTimer';

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});
type FormData = z.infer<typeof schema>;

type PostSignupState = 'idle' | 'verify_otp' | 'redirecting';

export default function SignupPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [postSignup, setPostSignup] = useState<PostSignupState>('idle');
  const [signupEmail, setSignupEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const supabase = createClient();
  const rateLimit = useOtpRateLimit(signupEmail);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    const { data: result, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name },
      },
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    // Supabase silently "succeeds" for existing emails when confirmation is on,
    // but returns an empty identities array — treat this as a duplicate.
    if (result.user && result.user.identities?.length === 0) {
      setError('An account with this email already exists. Please sign in instead.');
      return;
    }

    // Session present = email confirmation disabled, user is logged in immediately
    if (result.session) {
      setPostSignup('redirecting');
      router.push('/dashboard');
      router.refresh();
      return;
    }

    // No session = email confirmation required — show OTP input
    setSignupEmail(data.email);
    setPostSignup('verify_otp');
    rateLimit.recordRequest(data.email);
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setOtpError('Enter the 6-digit code'); return; }
    setVerifying(true);
    setOtpError('');
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
      setPostSignup('redirecting');
      router.push('/dashboard');
      router.refresh();
    }
  };

  const resendCode = async () => {
    if (!rateLimit.canResend) return;
    setResending(true);
    setResendMessage('');
    const { error } = await supabase.auth.resend({ type: 'signup', email: signupEmail });
    setResending(false);
    if (error) {
      setResendMessage(error.message);
    } else {
      rateLimit.recordRequest();
      setResendMessage('Code resent — check your inbox.');
    }
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
            Create your account
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Start your financial journey with Vaultly
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-8">

          {/* ── OTP verification ── */}
          {postSignup === 'verify_otp' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-2 space-y-5"
            >
              <div className="text-center space-y-1">
                <div className="text-4xl mb-3">📬</div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Enter your code</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  We sent a 6-digit code to <span className="text-[var(--color-text-primary)] font-medium">{signupEmail}</span>
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
                  onClick={() => { setPostSignup('idle'); rateLimit.clear(); }}
                  className="block mx-auto text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                  Go back
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Redirecting to dashboard ── */}
          {postSignup === 'redirecting' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-3"
            >
              <div className="text-4xl">🎉</div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Account created!</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">Taking you to your dashboard…</p>
              <Loader2 size={20} className="animate-spin mx-auto text-[var(--color-accent)]" />
            </motion.div>
          )}

          {/* ── Sign-up form ── */}
          {postSignup === 'idle' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Full name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    {...register('full_name')}
                    placeholder="John Doe"
                    className="input-base pl-9"
                    autoComplete="name"
                  />
                </div>
                {errors.full_name && (
                  <p className="text-[var(--color-danger)] text-xs mt-1">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className="input-base pl-9"
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-[var(--color-danger)] text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    className="input-base pl-9 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[var(--color-danger)] text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    {...register('confirm_password')}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    className="input-base pl-9"
                    autoComplete="new-password"
                  />
                </div>
                {errors.confirm_password && (
                  <p className="text-[var(--color-danger)] text-xs mt-1">{errors.confirm_password.message}</p>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3 text-sm text-[var(--color-danger)] break-all"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full text-sm"
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Creating account...</>
                ) : (
                  <>Create account <ArrowRight size={16} /></>
                )}
              </button>

              <div className="text-center mt-4">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[var(--color-accent)] font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
          Plan, Track, Save — with Vaultly
        </p>
      </motion.div>
    </div>
  );
}

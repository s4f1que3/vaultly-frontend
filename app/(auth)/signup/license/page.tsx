'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, KeyRound, ArrowLeft, Loader2, Check } from 'lucide-react';
import Footer from '@/components/ui/Footer';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  license_key: z.string().min(10, 'Please enter your license key'),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});
type FormData = z.infer<typeof schema>;

export default function LicenseSignupPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean | null>(null);
  const [keyError, setKeyError] = useState('');
  const [error, setError] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingLicenseKey, setPendingLicenseKey] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const licenseKeyValue = watch('license_key', '');

  const validateKey = async () => {
    const key = licenseKeyValue.trim();
    if (!key) return;
    setIsValidatingKey(true);
    setKeyError('');
    setKeyValid(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/licenses/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: key }),
      });
      const data = await res.json();
      if (data.valid) {
        setKeyValid(true);
      } else {
        setKeyValid(false);
        setKeyError(data.message || 'Invalid license key');
      }
    } catch {
      setKeyValid(false);
      setKeyError('Could not validate key. Please try again.');
    } finally {
      setIsValidatingKey(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!keyValid) {
      setError('Please validate your license key first');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms & Conditions to continue.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // Double-check the key is still valid right before signup
      const validateRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/licenses/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: data.license_key.trim() }),
      });
      const validateData = await validateRes.json();
      if (!validateData.valid) {
        setError(validateData.message || 'License key is no longer valid');
        return;
      }

      const supabase = createClient();
      const { error: signupError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      // Store the license key to redeem after OTP confirmation
      localStorage.setItem('pending_license', data.license_key.trim().toUpperCase());
      setPendingEmail(data.email);
      setPendingLicenseKey(data.license_key.trim().toUpperCase());
      setShowOtp(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length < 6) return;
    setIsVerifying(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otp,
        type: 'signup',
      });
      if (otpError) {
        setError(otpError.message);
        return;
      }
      // Redirect — dashboard layout will redeem the license from localStorage
      router.replace('/dashboard');
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const resendOtp = async () => {
    setIsResending(true);
    setError('');
    setResendSuccess(false);
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
      });
      if (resendError) {
        setError(resendError.message);
      } else {
        setResendSuccess(true);
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((c) => {
            if (c <= 1) { clearInterval(interval); return 0; }
            return c - 1;
          });
        }, 1000);
      }
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (showOtp) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm card p-8 space-y-5"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-[var(--color-accent-dim)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail size={22} className="text-[var(--color-accent)]" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Check your email</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              We sent a 6-digit code to{' '}
              <span className="font-medium text-[var(--color-text-primary)]">{pendingEmail}</span>
            </p>
          </div>

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

          {error && (
            <p className="text-sm text-[var(--color-danger)] text-center">{error}</p>
          )}

          <button
            onClick={verifyOtp}
            disabled={otp.length < 6 || isVerifying}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <><Loader2 size={15} className="animate-spin" /> Verifying…</>
            ) : (
              'Confirm & create account'
            )}
          </button>

          <div className="text-center">
            {resendSuccess && (
              <p className="text-xs text-[var(--color-accent)] mb-2">
                Code resent — check your inbox (and spam folder)
              </p>
            )}
            <button
              onClick={resendOtp}
              disabled={isResending || resendCooldown > 0}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40"
            >
              {isResending ? (
                <><Loader2 size={12} className="animate-spin inline mr-1" />Resending…</>
              ) : resendCooldown > 0 ? (
                `Resend code in ${resendCooldown}s`
              ) : (
                "Didn't receive it? Resend code"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <button
          onClick={() => router.push('/license')}
          className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        <div className="card p-8 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              Sign up with license
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Enter your license key to create a lifetime account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Full name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input {...register('full_name')} placeholder="John Doe" className="input-base pl-9" />
              </div>
              {errors.full_name && <p className="text-xs text-[var(--color-danger)] mt-1">{errors.full_name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input {...register('email')} type="email" placeholder="you@example.com" className="input-base pl-9" />
              </div>
              {errors.email && <p className="text-xs text-[var(--color-danger)] mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input {...register('password')} type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" className="input-base pl-9 pr-10" />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-[var(--color-danger)] mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input {...register('confirm_password')} type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" className="input-base pl-9 pr-10" />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.confirm_password && <p className="text-xs text-[var(--color-danger)] mt-1">{errors.confirm_password.message}</p>}
            </div>

            {/* License key */}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">License key</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    {...register('license_key', {
                      onChange: () => { setKeyValid(null); setKeyError(''); },
                    })}
                    placeholder="VLTLY-XXXX-XXXX-XXXX-XXXX"
                    className={`input-base pl-9 font-mono text-sm ${keyValid === true ? 'border-emerald-500/50' : keyValid === false ? 'border-[rgba(239,68,68,0.5)]' : ''}`}
                  />
                  {keyValid === true && (
                    <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={validateKey}
                  disabled={isValidatingKey || !licenseKeyValue}
                  className="btn-ghost text-xs px-3 flex-shrink-0"
                >
                  {isValidatingKey ? <Loader2 size={13} className="animate-spin" /> : 'Verify'}
                </button>
              </div>
              {keyError && <p className="text-xs text-[var(--color-danger)] mt-1">{keyError}</p>}
              {keyValid === true && <p className="text-xs text-emerald-400 mt-1">License key is valid</p>}
              {errors.license_key && <p className="text-xs text-[var(--color-danger)] mt-1">{errors.license_key.message}</p>}
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

            {error && (
              <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl p-3 text-sm text-[var(--color-danger)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !keyValid || !agreedToTerms}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><Loader2 size={15} className="animate-spin" /> Creating account…</>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--color-text-muted)]">
            Don&apos;t have a license?{' '}
            <Link href="/license" className="text-[var(--color-accent)] hover:underline">
              Buy one
            </Link>
            {' · '}
            <Link href="/login" className="text-[var(--color-accent)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
    <Footer />
    </>
  );
}

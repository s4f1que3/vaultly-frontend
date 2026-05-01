'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Footer from '@/components/ui/Footer';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (authError) {
      setError(authError.message);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] dot-pattern">
    <div className="flex-1 flex items-center justify-center px-4">
      {/* Green ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[var(--color-accent)] opacity-5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px]"
      >
        {/* Logo */}
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
            Welcome back
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Sign in to your Vaultly account
          </p>
        </div>

        {/* Form card */}
        <div className="glass-strong rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
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

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[var(--color-accent)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-base pl-9 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[var(--color-danger)] text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3 text-sm text-[var(--color-danger)]"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full text-sm"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Don&apos;t have an account?{' '}
              <Link href="/subscribe" className="text-[var(--color-accent)] font-medium hover:underline">
                View plans
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
          Plan, Track, Save — with Vaultly
        </p>
      </motion.div>
    </div>
    <Footer />
    </div>
  );
}

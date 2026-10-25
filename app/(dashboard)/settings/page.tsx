'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Bell, Shield, ChevronRight, Loader2, Check,
  Mail, Eye, EyeOff, X, Lock,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import OtpCountdownTimer from '@/components/ui/OtpCountdownTimer';
import { createClient } from '@/lib/supabase/client';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Section { id: string; label: string; icon: React.ElementType }
const SECTIONS: Section[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

const CURRENCIES = ['USD', 'BBD', 'XCD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'CHF', 'SGD'];

export default function SettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({ full_name: '', email: '', currency: 'USD' });
  const [notifSettings, setNotifSettings] = useState({
    notifications_enabled: true,
    budget_alerts: true,
    goal_reminders: true,
    weekly_summary: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ currentEmail: '', password: '', newEmail: '' });
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [emailChanging, setEmailChanging] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailStep, setEmailStep] = useState<'form' | 'otp'>('form');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpCooldown, setEmailOtpCooldown] = useState(0);
  const [emailOtpSending, setEmailOtpSending] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStep, setPasswordStep] = useState<'form' | 'otp'>('form');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordOtp, setPasswordOtp] = useState('');
  const [passwordOtpCooldown, setPasswordOtpCooldown] = useState(0);
  const [passwordOtpSending, setPasswordOtpSending] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setProfile({
          full_name: data.user.user_metadata?.full_name || '',
          email: data.user.email || '',
          currency: data.user.user_metadata?.currency || 'USD',
        });
      }
    });

    api.get<{ data: typeof notifSettings }>('/settings').then((res) => {
      if (res?.data) {
        setNotifSettings({
          notifications_enabled: res.data.notifications_enabled ?? true,
          budget_alerts: res.data.budget_alerts ?? true,
          goal_reminders: res.data.goal_reminders ?? true,
          weekly_summary: res.data.weekly_summary ?? true,
        });
      }
    }).catch(() => {});
  }, []);

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { full_name: profile.full_name, currency: profile.currency } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const saveNotifications = async () => {
    setIsSaving(true);
    try {
      await api.patch('/settings', notifSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  function startCooldown(setFn: React.Dispatch<React.SetStateAction<number>>) {
    setFn(60);
    const iv = setInterval(() => {
      setFn((prev) => { if (prev <= 1) { clearInterval(iv); return 0; } return prev - 1; });
    }, 1000);
  }

  function closeEmailModal() {
    setShowEmailModal(false);
    setEmailStep('form');
    setEmailOtp('');
    setEmailOtpCooldown(0);
    setEmailError('');
    setEmailSuccess(false);
    setEmailForm({ currentEmail: '', password: '', newEmail: '' });
  }

  const handleSendEmailOtp = async () => {
    setEmailError('');
    if (!emailForm.currentEmail || !emailForm.password || !emailForm.newEmail) {
      setEmailError('All fields are required');
      return;
    }
    setEmailOtpSending(true);
    try {
      await api.post('/auth/send-email-change-otp', {
        currentEmail: emailForm.currentEmail,
        password: emailForm.password,
        newEmail: emailForm.newEmail,
      });
      setEmailStep('otp');
      startCooldown(setEmailOtpCooldown);
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setEmailOtpSending(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setEmailError('');
    if (emailOtp.length !== 6) { setEmailError('Enter the 6-digit code'); return; }
    setEmailChanging(true);
    try {
      await api.post('/auth/change-email', { ...emailForm, otp: emailOtp });
      setEmailSuccess(true);
      setProfile((p) => ({ ...p, email: emailForm.newEmail }));
      setTimeout(() => closeEmailModal(), 2000);
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : 'Failed to change email');
    } finally {
      setEmailChanging(false);
    }
  };

  function closePasswordModal() {
    setShowPasswordModal(false);
    setPasswordStep('form');
    setPasswordOtp('');
    setPasswordOtpCooldown(0);
    setPasswordError('');
    setPasswordSuccess(false);
    setPasswordForm({ currentPassword: '', newPassword: '' });
  }

  const handleSendPasswordOtp = async () => {
    setPasswordError('');
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    setPasswordOtpSending(true);
    try {
      await api.post('/auth/send-password-change-otp', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordStep('otp');
      startCooldown(setPasswordOtpCooldown);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setPasswordOtpSending(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (passwordOtp.length !== 6) { setPasswordError('Enter the 6-digit code'); return; }
    setPasswordChanging(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        otp: passwordOtp,
      });
      setPasswordSuccess(true);
      setTimeout(() => closePasswordModal(), 2000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordChanging(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="px-4 py-6 sm:px-6 max-w-4xl mx-auto">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-52 flex-shrink-0">
          <div className="card p-2 space-y-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeSection === id
                    ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Icon size={16} />
                {label}
                <ChevronRight size={14} className="ml-auto opacity-50" />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeSection === 'profile' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="card p-6 space-y-5">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Profile Information</h2>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Full name</label>
                <input
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="input-base"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Email</label>
                <div className="flex gap-2">
                  <input value={profile.email} disabled className="input-base opacity-50 cursor-not-allowed flex-1" />
                  <button
                    onClick={() => { setShowEmailModal(true); setEmailError(''); setEmailSuccess(false); }}
                    className="btn-ghost text-sm px-3 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Mail size={14} /> Change
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Default currency</label>
                <select
                  value={profile.currency}
                  onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                  className="input-base"
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={saveProfile} disabled={isSaving} className="btn-primary text-sm">
                {isSaving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : saved ? <><Check size={15} /> Saved!</> : 'Save changes'}
              </button>
            </motion.div>
          )}

          {activeSection === 'notifications' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="card p-6 space-y-5">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Notification Preferences</h2>
              {[
                { key: 'notifications_enabled', label: 'Push notifications', desc: 'Receive push notifications on your device' },
                { key: 'budget_alerts', label: 'Budget alerts', desc: 'Get alerted when spending approaches your budget limit' },
                { key: 'goal_reminders', label: 'Goal reminders', desc: 'Receive reminders to contribute to your savings goals' },
                { key: 'weekly_summary', label: 'Weekly summary', desc: 'Get a weekly overview of your finances every Monday' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                    className={`relative w-11 h-6 rounded-full transition-all ${notifSettings[key as keyof typeof notifSettings] ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface-2)]'}`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${notifSettings[key as keyof typeof notifSettings] ? 'left-6' : 'left-1'}`}
                    />
                  </button>
                </div>
              ))}
              <button onClick={saveNotifications} disabled={isSaving} className="btn-primary text-sm">
                {isSaving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : saved ? <><Check size={15} /> Saved!</> : 'Save preferences'}
              </button>
            </motion.div>
          )}

          {activeSection === 'security' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="card p-6 space-y-4">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Security</h2>
              <div className="border border-[var(--color-border)] rounded-xl p-4">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Change password</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-3">Verify your identity with a code sent to your email, then set a new password.</p>
                <button
                  onClick={() => { setShowPasswordModal(true); setPasswordError(''); setPasswordSuccess(false); }}
                  className="btn-ghost text-sm flex items-center gap-1.5"
                >
                  <Lock size={14} /> Change password
                </button>
              </div>
              <div className="border border-[rgba(239,68,68,0.2)] rounded-xl p-4">
                <p className="text-sm font-medium text-[var(--color-danger)]">Danger zone</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-3">These actions are irreversible. Please proceed with caution.</p>
                <button onClick={handleSignOut} className="btn-ghost text-sm border-[rgba(239,68,68,0.3)] text-[var(--color-danger)]">Sign out of all devices</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Change email modal */}
      <AnimatePresence>
        {showEmailModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={closeEmailModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="glass-strong rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Change email address</h2>
                  <button onClick={closeEmailModal} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"><X size={18} /></button>
                </div>

                {emailSuccess ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-2">
                    <Check size={36} className="mx-auto text-[var(--color-accent)]" />
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Email updated successfully!</p>
                  </motion.div>
                ) : emailStep === 'form' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Current email</label>
                      <input type="email" value={emailForm.currentEmail} onChange={(e) => setEmailForm((f) => ({ ...f, currentEmail: e.target.value }))} placeholder="your@current-email.com" className="input-base" autoComplete="email" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Password</label>
                      <div className="relative">
                        <input type={showEmailPass ? 'text' : 'password'} value={emailForm.password} onChange={(e) => setEmailForm((f) => ({ ...f, password: e.target.value }))} placeholder="Your current password" className="input-base pr-10" autoComplete="current-password" />
                        <button type="button" onClick={() => setShowEmailPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                          {showEmailPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">New email</label>
                      <input type="email" value={emailForm.newEmail} onChange={(e) => setEmailForm((f) => ({ ...f, newEmail: e.target.value }))} placeholder="your@new-email.com" className="input-base" autoComplete="off" />
                    </div>
                    {emailError && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3 text-sm text-[var(--color-danger)] break-words">
                        {emailError}
                      </motion.div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button onClick={closeEmailModal} className="btn-ghost text-sm flex-1">Cancel</button>
                      <button onClick={handleSendEmailOtp} disabled={emailOtpSending} className="btn-primary text-sm flex-1">
                        {emailOtpSending ? <><Loader2 size={15} className="animate-spin" /> Sending...</> : 'Send verification code'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 rounded-xl p-3 flex items-center gap-2.5">
                      <Mail size={14} className="text-[var(--color-accent)] flex-shrink-0" />
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        A 6-digit code was sent to <span className="font-semibold text-[var(--color-text-primary)]">{emailForm.newEmail}</span>
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Verification code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="input-base tracking-[0.4em] text-center font-mono text-lg"
                        autoComplete="one-time-code"
                      />
                    </div>
                    {emailError && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3 text-sm text-[var(--color-danger)] break-words">
                        {emailError}
                      </motion.div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <button onClick={() => { setEmailStep('form'); setEmailOtp(''); setEmailError(''); }} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                        ← Back
                      </button>
                      {emailOtpCooldown > 0 ? (
                        <OtpCountdownTimer seconds={emailOtpCooldown} />
                      ) : (
                        <button onClick={handleSendEmailOtp} disabled={emailOtpSending} className="text-xs text-[var(--color-accent)] hover:underline">
                          {emailOtpSending ? 'Sending...' : 'Resend code'}
                        </button>
                      )}
                    </div>
                    <button onClick={handleVerifyEmailOtp} disabled={emailChanging || emailOtp.length !== 6} className="btn-primary text-sm w-full">
                      {emailChanging ? <><Loader2 size={15} className="animate-spin" /> Verifying...</> : 'Verify & update email'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Change password modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={closePasswordModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="glass-strong rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Change password</h2>
                  <button onClick={closePasswordModal} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"><X size={18} /></button>
                </div>

                {passwordSuccess ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-2">
                    <Check size={36} className="mx-auto text-[var(--color-accent)]" />
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Password changed successfully!</p>
                  </motion.div>
                ) : passwordStep === 'form' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Current password</label>
                      <div className="relative">
                        <input type={showCurrentPass ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))} placeholder="Your current password" className="input-base pr-10" autoComplete="current-password" />
                        <button type="button" onClick={() => setShowCurrentPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                          {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">New password</label>
                      <div className="relative">
                        <input type={showNewPass ? 'text' : 'password'} value={passwordForm.newPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))} placeholder="At least 8 characters" className="input-base pr-10" autoComplete="new-password" />
                        <button type="button" onClick={() => setShowNewPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                          {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    {passwordError && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3 text-sm text-[var(--color-danger)] break-words">
                        {passwordError}
                      </motion.div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button onClick={closePasswordModal} className="btn-ghost text-sm flex-1">Cancel</button>
                      <button onClick={handleSendPasswordOtp} disabled={passwordOtpSending} className="btn-primary text-sm flex-1">
                        {passwordOtpSending ? <><Loader2 size={15} className="animate-spin" /> Sending...</> : 'Send verification code'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 rounded-xl p-3 flex items-center gap-2.5">
                      <Mail size={14} className="text-[var(--color-accent)] flex-shrink-0" />
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        A 6-digit code was sent to <span className="font-semibold text-[var(--color-text-primary)]">{profile.email}</span>
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Verification code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={passwordOtp}
                        onChange={(e) => setPasswordOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="input-base tracking-[0.4em] text-center font-mono text-lg"
                        autoComplete="one-time-code"
                      />
                    </div>
                    {passwordError && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3 text-sm text-[var(--color-danger)] break-words">
                        {passwordError}
                      </motion.div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <button onClick={() => { setPasswordStep('form'); setPasswordOtp(''); setPasswordError(''); }} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                        ← Back
                      </button>
                      {passwordOtpCooldown > 0 ? (
                        <OtpCountdownTimer seconds={passwordOtpCooldown} />
                      ) : (
                        <button onClick={handleSendPasswordOtp} disabled={passwordOtpSending} className="text-xs text-[var(--color-accent)] hover:underline">
                          {passwordOtpSending ? 'Sending...' : 'Resend code'}
                        </button>
                      )}
                    </div>
                    <button onClick={handleChangePassword} disabled={passwordChanging || passwordOtp.length !== 6} className="btn-primary text-sm w-full">
                      {passwordChanging ? <><Loader2 size={15} className="animate-spin" /> Verifying...</> : 'Verify & change password'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Bell, CreditCard, Shield, ChevronRight, Loader2, Check,
  Mail, Eye, EyeOff, X, AlertTriangle, ExternalLink, RefreshCw,
  Calendar, Clock, CheckCircle, XCircle, Lock, ArrowRightLeft,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { createClient } from '@/lib/supabase/client';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useBillingStore } from '@/stores/useBillingStore';
import { format, parseISO } from 'date-fns';
import type { BillingPlan, PaymentRecord } from '@/types';

interface Section { id: string; label: string; icon: React.ElementType }
const SECTIONS: Section[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Subscription', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
];

const CURRENCIES = ['USD', 'BBD', 'XCD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'CHF', 'SGD'];

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'text-emerald-400 bg-emerald-400/10' },
  past_due: { label: 'Past due', color: 'text-yellow-400 bg-yellow-400/10' },
  frozen: { label: 'Frozen', color: 'text-[var(--color-danger)] bg-[rgba(239,68,68,0.1)]' },
  cancelled: { label: 'Cancelled', color: 'text-[var(--color-text-muted)] bg-[var(--color-surface-2)]' },
  pending: { label: 'Pending', color: 'text-[var(--color-accent)] bg-[var(--color-accent-dim)]' },
};

function maskCard(last4: string | null, brand: string | null) {
  if (!last4) return '•••• •••• •••• ••••';
  const b = brand ? `${brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase()} ` : '';
  return `${b}•••• •••• •••• ${last4}`;
}

function BillingSection() {
  const {
    subscription, access, paymentHistory,
    fetchPaymentHistory,
    changePlan, cancelSubscription, reactivateSubscription, getPaymentMethodUpdateUrl,
    isLoading,
  } = useBillingStore();

  const router = useRouter();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPlanChange, setShowPlanChange] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>('monthly');
  const [isChangingPayment, setIsChangingPayment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  const handleUpdatePayment = async () => {
    setIsChangingPayment(true);
    setActionError('');
    try {
      const url = await getPaymentMethodUpdateUrl();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to get update URL');
    } finally {
      setIsChangingPayment(false);
    }
  };

  const handleChangePlan = async () => {
    if (!subscription) return;
    setIsChangingPlan(true);
    setActionError('');
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Not authenticated');

      const result = await changePlan(selectedPlan, user.email);
      // Redirect to PayPal for approval
      window.location.href = result.approveUrl;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to initiate plan change');
      setIsChangingPlan(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    setActionError('');
    try {
      await cancelSubscription();
      setShowCancelConfirm(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  // Licensed users — show lifetime card, no subscription management needed
  if (access?.status === 'licensed') {
    return (
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-accent-dim)] rounded-xl flex items-center justify-center flex-shrink-0">
            <RefreshCw size={18} className="text-[var(--color-accent)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Lifetime License</p>
            <p className="text-xs text-[var(--color-text-muted)]">One-time purchase · Never expires</p>
          </div>
          <span className="ml-auto text-xs font-semibold px-2.5 py-1 bg-[var(--color-accent-dim)] text-[var(--color-accent)] rounded-full">
            Active
          </span>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          You have lifetime access to Vaultly. No recurring charges will ever be applied to your account.
        </p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="card p-6 text-center">
        <CreditCard size={36} className="mx-auto text-[var(--color-text-muted)] mb-3" />
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">No active subscription</p>
        <button onClick={() => router.push('/subscribe')} className="btn-primary text-sm">
          Subscribe now
        </button>
      </div>
    );
  }

  const badge = STATUS_BADGE[subscription.status] ?? STATUS_BADGE.pending;
  const isActive = subscription.status === 'active';
  const isCancelled = subscription.status === 'cancelled';

  return (
    <div className="space-y-4">
      {/* Subscription overview */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Your subscription
          </h2>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        {/* Plan + price */}
        <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[var(--color-accent-dim)] rounded-xl flex items-center justify-center">
              <RefreshCw size={16} className="text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                Vaultly {subscription.plan === 'monthly' ? 'Monthly' : 'Yearly'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {subscription.plan === 'monthly' ? '$8.00 / month' : '$100.00 / year'}
              </p>
            </div>
          </div>
          {isActive && !isCancelled && (
            <button
              onClick={() => {
                setSelectedPlan(subscription.plan === 'monthly' ? 'yearly' : 'monthly');
                setShowPlanChange(true);
              }}
              className="btn-ghost text-xs flex items-center gap-1.5"
            >
              <ArrowRightLeft size={12} />
              Change
            </button>
          )}
        </div>

        {/* Billing dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--color-surface)] rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar size={12} className="text-[var(--color-text-muted)]" />
              <span className="text-xs text-[var(--color-text-muted)]">
                {isCancelled ? 'Access until' : 'Next billing'}
              </span>
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {isCancelled
                ? format(parseISO(subscription.current_period_end), 'MMM d, yyyy')
                : format(parseISO(subscription.next_billing_date), 'MMM d, yyyy')}
            </p>
          </div>

          <div className="bg-[var(--color-surface)] rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={12} className="text-[var(--color-text-muted)]" />
              <span className="text-xs text-[var(--color-text-muted)]">Bill day</span>
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {subscription.plan === 'monthly'
                ? `${subscription.billing_day}${daySuffix(subscription.billing_day)} of each month`
                : `${format(parseISO(subscription.current_period_start), 'MMM d')} each year`}
            </p>
          </div>
        </div>

        {/* Grace period warning */}
        {subscription.status === 'past_due' && subscription.grace_period_end && (
          <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 flex items-start gap-2.5">
            <AlertTriangle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-yellow-400">Payment failed</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Grace period ends{' '}
                <span className="font-semibold">
                  {format(parseISO(subscription.grace_period_end), 'MMMM d, yyyy')}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Payment method */}
        <div className="flex items-center justify-between py-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <Lock size={14} className="text-[var(--color-text-muted)]" />
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Payment method</p>
              <p className="text-sm font-medium text-[var(--color-text-primary)] font-mono tracking-wider">
                {maskCard(subscription.payment_method_last4, subscription.payment_method_brand)}
              </p>
            </div>
          </div>
          {isActive && (
            <button
              onClick={handleUpdatePayment}
              disabled={isChangingPayment}
              className="btn-ghost text-xs flex items-center gap-1.5"
            >
              {isChangingPayment ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <ExternalLink size={12} />
              )}
              Update
            </button>
          )}
        </div>

        {/* Cancellation / Reactivation */}
        {isActive && (
          <div className="pt-1 space-y-2">
            {isCancelled ? (
              <>
                <p className="text-xs text-[var(--color-text-muted)] text-center">
                  Access continues until{' '}
                  {format(parseISO(subscription.current_period_end), 'MMMM d, yyyy')}
                </p>
                <button
                  onClick={async () => {
                    setIsReactivating(true);
                    setActionError('');
                    try {
                      const supabase = createClient();
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user?.email) throw new Error('Not authenticated');
                      const approveUrl = await reactivateSubscription(user.email);
                      window.location.href = approveUrl;
                    } catch (err) {
                      setActionError(err instanceof Error ? err.message : 'Failed to reactivate');
                      setIsReactivating(false);
                    }
                  }}
                  disabled={isReactivating || isLoading}
                  className="btn-primary text-sm w-full flex items-center justify-center gap-2"
                >
                  {isReactivating ? (
                    <><Loader2 size={14} className="animate-spin" /> Redirecting to PayPal…</>
                  ) : (
                    'Reactivate subscription'
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-xs text-[var(--color-danger)] hover:underline w-full text-center"
              >
                Cancel subscription
              </button>
            )}
          </div>
        )}
      </div>

      {/* Payment history */}
      {paymentHistory.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
            Payment history
          </h3>
          <div className="space-y-2">
            {paymentHistory.map((p) => (
              <PaymentRow key={p.id} record={p} />
            ))}
          </div>
        </div>
      )}

      {/* Global action error */}
      {actionError && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl p-3 text-sm text-[var(--color-danger)]">
          {actionError}
        </div>
      )}

      {/* Cancel confirm modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowCancelConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <div
                className="glass-strong rounded-2xl p-6 w-full max-w-sm space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Cancel subscription?
                  </h2>
                  <button onClick={() => setShowCancelConfirm(false)}>
                    <X size={18} className="text-[var(--color-text-muted)]" />
                  </button>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  You&apos;ll keep access until{' '}
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {format(parseISO(subscription.current_period_end), 'MMMM d, yyyy')}
                  </span>
                  . After that, your account will be frozen and your payment method will be removed.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="btn-ghost text-sm flex-1"
                  >
                    Keep subscription
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="text-sm flex-1 px-4 py-2.5 rounded-xl border border-[rgba(239,68,68,0.3)] text-[var(--color-danger)] hover:bg-[rgba(239,68,68,0.1)] transition-all flex items-center justify-center gap-2"
                  >
                    {isCancelling ? (
                      <><Loader2 size={14} className="animate-spin" /> Cancelling…</>
                    ) : (
                      'Cancel subscription'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Plan change modal */}
      <AnimatePresence>
        {showPlanChange && subscription && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowPlanChange(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <div
                className="glass-strong rounded-2xl p-6 w-full max-w-sm space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Change plan
                  </h2>
                  <button onClick={() => setShowPlanChange(false)}>
                    <X size={18} className="text-[var(--color-text-muted)]" />
                  </button>
                </div>

                {/* Switching to yearly */}
                {selectedPlan === 'yearly' && (
                  <div className="space-y-3">
                    <div className="bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 rounded-xl p-4">
                      <p className="text-xs font-semibold text-[var(--color-accent)] mb-1">Monthly → Yearly</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        You&apos;ll be charged <span className="font-semibold text-[var(--color-text-primary)]">$100.00</span> immediately via PayPal. Your current monthly period is not refunded. Save $16/year going forward.
                      </p>
                    </div>
                  </div>
                )}

                {/* Switching to monthly */}
                {selectedPlan === 'monthly' && (
                  <div className="space-y-3">
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
                      <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Yearly → Monthly</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        No charge now. Monthly billing of{' '}
                        <span className="font-semibold text-[var(--color-text-primary)]">$8.00</span> begins on{' '}
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          {format(parseISO(subscription.current_period_end), 'MMMM d, yyyy')}
                        </span>{' '}
                        when your current year ends.
                      </p>
                    </div>
                  </div>
                )}

                {actionError && (
                  <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl p-3 text-sm text-[var(--color-danger)]">
                    {actionError}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowPlanChange(false); setActionError(''); }}
                    className="btn-ghost text-sm flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePlan}
                    disabled={isChangingPlan || isLoading}
                    className="btn-primary text-sm flex-1 flex items-center justify-center gap-2"
                  >
                    {isChangingPlan ? (
                      <><Loader2 size={14} className="animate-spin" /> Redirecting…</>
                    ) : (
                      <>Switch to {selectedPlan}</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaymentRow({ record }: { record: PaymentRecord }) {
  const isSuccess = record.status === 'succeeded';
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] last:border-0">
      <div className="flex items-center gap-2.5">
        {isSuccess ? (
          <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
        ) : (
          <XCircle size={15} className="text-[var(--color-danger)] flex-shrink-0" />
        )}
        <div>
          <p className="text-xs font-medium text-[var(--color-text-primary)]">
            {record.description || `Vaultly ${record.plan} subscription`}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {format(parseISO(record.billing_date + 'T00:00:00'), 'MMM d, yyyy')}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${isSuccess ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-danger)]'}`}>
          ${record.amount.toFixed(2)}
        </p>
        <p className={`text-xs ${isSuccess ? 'text-emerald-400' : 'text-[var(--color-danger)]'}`}>
          {isSuccess ? 'Paid' : 'Failed'}
        </p>
      </div>
    </div>
  );
}

function daySuffix(day: number) {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

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

  const handleChangeEmail = async () => {
    setEmailError('');
    if (!emailForm.currentEmail || !emailForm.password || !emailForm.newEmail) {
      setEmailError('All fields are required');
      return;
    }
    setEmailChanging(true);
    try {
      await api.post('/auth/change-email', emailForm);
      setEmailSuccess(true);
      setProfile((p) => ({ ...p, email: emailForm.newEmail }));
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSuccess(false);
        setEmailForm({ currentEmail: '', password: '', newEmail: '' });
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change email';
      setEmailError(msg);
    } finally {
      setEmailChanging(false);
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

          {activeSection === 'billing' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <BillingSection />
            </motion.div>
          )}

          {activeSection === 'security' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="card p-6 space-y-4">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Security</h2>
              <div className="border border-[var(--color-border)] rounded-xl p-4">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Change password</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-3">Update your password to keep your account secure</p>
                <button className="btn-ghost text-sm">Send password reset email</button>
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowEmailModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <div className="glass-strong rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Change email address</h2>
                  <button onClick={() => setShowEmailModal(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {emailSuccess ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-2">
                    <Check size={36} className="mx-auto text-[var(--color-accent)]" />
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Email updated successfully!</p>
                  </motion.div>
                ) : (
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
                      <button onClick={() => setShowEmailModal(false)} className="btn-ghost text-sm flex-1">Cancel</button>
                      <button onClick={handleChangeEmail} disabled={emailChanging} className="btn-primary text-sm flex-1">
                        {emailChanging ? <><Loader2 size={15} className="animate-spin" /> Updating...</> : 'Update email'}
                      </button>
                    </div>
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

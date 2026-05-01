import { create } from 'zustand';
import api from '@/lib/api';
import type { AppSubscription, AccessCheck, PaymentRecord, BillingPlan } from '@/types';

interface BillingStore {
  subscription: AppSubscription | null;
  access: AccessCheck | null;
  paymentHistory: PaymentRecord[];
  isLoading: boolean;
  isChecking: boolean;

  fetchStatus: () => Promise<void>;
  fetchPaymentHistory: () => Promise<void>;
  initiateSubscribe: (plan: BillingPlan, email: string) => Promise<string>;
  activateSubscription: (subscriptionId: string) => Promise<void>;
  changePlan: (newPlan: BillingPlan, email: string) => Promise<{ approveUrl: string; immediate: boolean; effectiveDate?: string }>;
  completePlanChange: (subscriptionId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  reactivateSubscription: (email: string) => Promise<string>;
  getPaymentMethodUpdateUrl: () => Promise<string>;
  reset: () => void;
}

export const useBillingStore = create<BillingStore>((set, get) => ({
  subscription: null,
  access: null,
  paymentHistory: [],
  isLoading: false,
  isChecking: false,

  fetchStatus: async () => {
    set({ isChecking: true });
    try {
      const res = await api.get<{ subscription: AppSubscription | null; access: AccessCheck }>(
        '/billing/status',
      );
      set({ subscription: res.subscription, access: res.access });
    } catch {
      set({ subscription: null, access: null });
    } finally {
      set({ isChecking: false });
    }
  },

  fetchPaymentHistory: async () => {
    try {
      const res = await api.get<{ history: PaymentRecord[] }>('/billing/payment-history');
      set({ paymentHistory: res.history });
    } catch {
      set({ paymentHistory: [] });
    }
  },

  initiateSubscribe: async (plan, email) => {
    set({ isLoading: true });
    try {
      const res = await api.post<{ subscriptionId: string }>('/billing/subscribe', { plan, email });
      return res.subscriptionId;
    } finally {
      set({ isLoading: false });
    }
  },

  activateSubscription: async (subscriptionId) => {
    set({ isLoading: true });
    try {
      const res = await api.post<{ subscription: AppSubscription }>('/billing/activate', {
        subscription_id: subscriptionId,
      });
      set({ subscription: res.subscription, access: { hasAccess: true, status: 'active' } });
    } finally {
      set({ isLoading: false });
    }
  },

  changePlan: async (newPlan, email) => {
    set({ isLoading: true });
    try {
      return await api.post<{ approveUrl: string; immediate: boolean; effectiveDate?: string }>(
        '/billing/change-plan',
        { new_plan: newPlan, email },
      );
    } finally {
      set({ isLoading: false });
    }
  },

  completePlanChange: async (subscriptionId) => {
    set({ isLoading: true });
    try {
      const res = await api.post<{ subscription: AppSubscription }>(
        '/billing/complete-plan-change',
        { subscription_id: subscriptionId },
      );
      set({ subscription: res.subscription, access: { hasAccess: true, status: 'active' } });
    } finally {
      set({ isLoading: false });
    }
  },

  cancelSubscription: async () => {
    set({ isLoading: true });
    try {
      const res = await api.post<{ subscription: AppSubscription }>('/billing/cancel', {});
      set({ subscription: res.subscription });
      // Access continues until period end
      await get().fetchStatus();
    } finally {
      set({ isLoading: false });
    }
  },

  reactivateSubscription: async (email) => {
    set({ isLoading: true });
    try {
      const res = await api.post<{ subscriptionId: string; approveUrl: string }>(
        '/billing/reactivate',
        { email },
      );
      return res.approveUrl;
    } finally {
      set({ isLoading: false });
    }
  },

  getPaymentMethodUpdateUrl: async () => {
    const res = await api.get<{ updateUrl: string }>('/billing/payment-method-update-url');
    return res.updateUrl;
  },

  reset: () =>
    set({ subscription: null, access: null, paymentHistory: [], isLoading: false, isChecking: false }),
}));

import { create } from 'zustand';
import api from '@/lib/api';
import { Subscription } from '@/types';

interface SubscriptionStore {
  subscriptions: Subscription[];
  isLoading: boolean;
  error: string | null;
  fetchSubscriptions: () => Promise<void>;
  addSubscription: (data: Partial<Subscription>) => Promise<void>;
  updateSubscription: (id: string, data: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscriptions: [],
  isLoading: false,
  error: null,

  fetchSubscriptions: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<{ data: Subscription[] }>('/subscriptions');
      set({ subscriptions: res.data ?? [] });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load subscriptions' });
    } finally {
      set({ isLoading: false });
    }
  },

  addSubscription: async (data) => {
    const res = await api.post<Subscription>('/subscriptions', data);
    set({ subscriptions: [...get().subscriptions, res] });
  },

  updateSubscription: async (id, data) => {
    const res = await api.patch<Subscription>(`/subscriptions/${id}`, data);
    set({ subscriptions: get().subscriptions.map(s => s.id === id ? res : s) });
  },

  deleteSubscription: async (id) => {
    await api.delete(`/subscriptions/${id}`);
    set({ subscriptions: get().subscriptions.filter(s => s.id !== id) });
  },
}));

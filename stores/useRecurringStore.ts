import { create } from 'zustand';
import { RecurringTransaction } from '@/types';
import api from '@/lib/api';

interface AddSubscriptionPayload {
  company: string;
  amount: number;
  period: 'monthly' | 'yearly';
  billing_day: number;
  billing_month?: number;
}

interface RecurringState {
  items: RecurringTransaction[];
  isLoading: boolean;
  fetchRecurring: () => Promise<void>;
  addRecurring: (data: Partial<RecurringTransaction>) => Promise<RecurringTransaction>;
  addSubscription: (data: AddSubscriptionPayload) => Promise<void>;
  updateRecurring: (id: string, data: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  toggleActive: (item: RecurringTransaction) => Promise<void>;
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchRecurring: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<{ data: RecurringTransaction[] }>('/recurring-transactions');
      set({ items: res.data });
    } finally {
      set({ isLoading: false });
    }
  },

  addRecurring: async (data) => {
    const created = await api.post<RecurringTransaction>('/recurring-transactions', data);
    set((state) => ({ items: [created, ...state.items] }));
    return created;
  },

  addSubscription: async (data) => {
    const created = await api.post<Record<string, unknown>>('/subscriptions', data);
    const item: RecurringTransaction = {
      id: created.id as string,
      user_id: created.user_id as string,
      name: created.company as string,
      amount: created.amount as number,
      type: 'expense',
      category: 'general',
      merchant: created.company as string,
      frequency: created.period === 'yearly' ? 'yearly' : 'monthly',
      day_of_month: created.billing_day as number,
      next_due_date: created.next_due_date as string,
      is_active: created.is_active as boolean,
      icon: created.icon as string | undefined,
      color: created.color as string | undefined,
      source: 'subscription',
      created_at: (created.created_at as string) ?? new Date().toISOString(),
    };
    set((state) => ({ items: [item, ...state.items] }));
  },

  updateRecurring: async (id, data) => {
    const prev = get().items;
    set((state) => ({ items: state.items.map((r) => r.id === id ? { ...r, ...data } : r) }));
    try {
      await api.patch(`/recurring-transactions/${id}`, data);
    } catch (err) {
      set({ items: prev });
      throw err;
    }
  },

  toggleActive: async (item) => {
    const newState = !item.is_active;
    set((state) => ({
      items: state.items.map((r) => r.id === item.id ? { ...r, is_active: newState } : r),
    }));
    try {
      const endpoint = item.source === 'subscription'
        ? `/subscriptions/${item.id}`
        : `/recurring-transactions/${item.id}`;
      await api.patch(endpoint, { is_active: newState });
    } catch (err) {
      set((state) => ({
        items: state.items.map((r) => r.id === item.id ? { ...r, is_active: item.is_active } : r),
      }));
      throw err;
    }
  },

  deleteRecurring: async (id) => {
    const prev = get().items;
    const item = get().items.find((r) => r.id === id);
    set((state) => ({ items: state.items.filter((r) => r.id !== id) }));
    try {
      const endpoint = item?.source === 'subscription'
        ? `/subscriptions/${id}`
        : `/recurring-transactions/${id}`;
      await api.delete(endpoint);
    } catch (err) {
      set({ items: prev });
      throw err;
    }
  },
}));

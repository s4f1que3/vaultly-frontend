import { create } from 'zustand';
import { RecurringTransaction } from '@/types';
import api from '@/lib/api';

interface RecurringState {
  items: RecurringTransaction[];
  isLoading: boolean;
  fetchRecurring: () => Promise<void>;
  addRecurring: (data: Partial<RecurringTransaction>) => Promise<RecurringTransaction>;
  updateRecurring: (id: string, data: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
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

  deleteRecurring: async (id) => {
    const prev = get().items;
    set((state) => ({ items: state.items.filter((r) => r.id !== id) }));
    try {
      await api.delete(`/recurring-transactions/${id}`);
    } catch (err) {
      set({ items: prev });
      throw err;
    }
  },
}));

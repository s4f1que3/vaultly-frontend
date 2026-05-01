import { create } from 'zustand';
import { Budget } from '@/types';
import api from '@/lib/api';

interface BudgetState {
  budgets: Budget[];
  isLoading: boolean;
  fetchBudgets: () => Promise<void>;
  addBudget: (data: Partial<Budget>) => Promise<Budget>;
  updateBudget: (id: string, data: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  isLoading: false,

  fetchBudgets: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<{ data: Budget[] }>('/budgets');
      set({ budgets: res.data });
    } finally {
      set({ isLoading: false });
    }
  },

  addBudget: async (data) => {
    const created = await api.post<Budget>('/budgets', data);
    set((state) => ({ budgets: [...state.budgets, created] }));
    return created;
  },

  updateBudget: async (id, data) => {
    const prev = get().budgets;
    set((state) => ({
      budgets: state.budgets.map((b) => b.id === id ? { ...b, ...data } : b),
    }));
    try {
      await api.patch(`/budgets/${id}`, data);
    } catch (err) {
      set({ budgets: prev });
      throw err;
    }
  },

  deleteBudget: async (id) => {
    const prev = get().budgets;
    set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }));
    try {
      await api.delete(`/budgets/${id}`);
    } catch (err) {
      set({ budgets: prev });
      throw err;
    }
  },
}));

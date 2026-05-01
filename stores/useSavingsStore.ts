import { create } from 'zustand';
import api from '@/lib/api';

export interface SavingsPot {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  amount: number;
  notes?: string;
  created_at: string;
}

interface SavingsStore {
  pots: SavingsPot[];
  isLoading: boolean;
  fetchPots: () => Promise<void>;
  addPot: (data: Partial<SavingsPot>) => Promise<void>;
  updatePot: (id: string, data: Partial<SavingsPot>) => Promise<void>;
  deletePot: (id: string) => Promise<void>;
}

export const useSavingsStore = create<SavingsStore>((set, get) => ({
  pots: [],
  isLoading: false,

  fetchPots: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<{ data: SavingsPot[] }>('/savings-pots');
      set({ pots: res.data ?? [] });
    } finally {
      set({ isLoading: false });
    }
  },

  addPot: async (data) => {
    const res = await api.post<SavingsPot>('/savings-pots', data);
    set((s) => ({ pots: [res, ...s.pots] }));
  },

  updatePot: async (id, data) => {
    const prev = get().pots;
    set((s) => ({ pots: s.pots.map((p) => p.id === id ? { ...p, ...data } : p) }));
    try {
      await api.patch(`/savings-pots/${id}`, data);
    } catch {
      set({ pots: prev });
      throw new Error('Failed to update savings pot');
    }
  },

  deletePot: async (id) => {
    const prev = get().pots;
    set((s) => ({ pots: s.pots.filter((p) => p.id !== id) }));
    try {
      await api.delete(`/savings-pots/${id}`);
    } catch {
      set({ pots: prev });
      throw new Error('Failed to delete savings pot');
    }
  },
}));

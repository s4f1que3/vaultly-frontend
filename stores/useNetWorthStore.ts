import { create } from 'zustand';
import { NetWorth, Liability } from '@/types';
import api from '@/lib/api';

interface NetWorthState {
  netWorth: NetWorth | null;
  isLoading: boolean;
  fetchNetWorth: () => Promise<void>;
  addLiability: (data: Partial<Liability>) => Promise<Liability>;
  updateLiability: (id: string, data: Partial<Liability>) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;
}

export const useNetWorthStore = create<NetWorthState>((set, get) => ({
  netWorth: null,
  isLoading: false,

  fetchNetWorth: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<NetWorth>('/net-worth');
      set({ netWorth: data });
    } finally {
      set({ isLoading: false });
    }
  },

  addLiability: async (data) => {
    const created = await api.post<Liability>('/net-worth/liabilities', data);
    get().fetchNetWorth();
    return created;
  },

  updateLiability: async (id, data) => {
    await api.patch(`/net-worth/liabilities/${id}`, data);
    get().fetchNetWorth();
  },

  deleteLiability: async (id) => {
    await api.delete(`/net-worth/liabilities/${id}`);
    get().fetchNetWorth();
  },
}));

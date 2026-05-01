import { create } from 'zustand';
import { Transaction, TransactionFilters, PaginatedResponse } from '@/types';
import api from '@/lib/api';
import { useBudgetStore } from '@/stores/useBudgetStore';

interface TransactionState {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  filters: TransactionFilters;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  fetchTransactions: () => Promise<void>;
  addTransaction: (data: Partial<Transaction>) => Promise<Transaction>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  filters: { page: 1, limit: 20 },

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters, page: 1 } }));
    get().fetchTransactions();
  },

  fetchTransactions: async () => {
    set({ isLoading: true });
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.append(k, String(v));
      });
      const res = await api.get<PaginatedResponse<Transaction>>(`/transactions?${params}`);
      set({
        transactions: res.data,
        total: res.meta.total,
        page: res.meta.page,
        totalPages: res.meta.totalPages,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  addTransaction: async (data) => {
    const tempId = `temp-${Date.now()}`;
    const tempTx = { ...data, id: tempId, created_at: new Date().toISOString() } as Transaction;
    set((state) => ({ transactions: [tempTx, ...state.transactions] }));
    try {
      const created = await api.post<Transaction>('/transactions', data);
      set((state) => ({
        transactions: state.transactions.map((t) => t.id === tempId ? created : t),
      }));
      useBudgetStore.getState().fetchBudgets();
      return created;
    } catch (err) {
      set((state) => ({ transactions: state.transactions.filter((t) => t.id !== tempId) }));
      throw err;
    }
  },

  updateTransaction: async (id, data) => {
    const prev = get().transactions;
    set((state) => ({
      transactions: state.transactions.map((t) => t.id === id ? { ...t, ...data } : t),
    }));
    try {
      await api.patch(`/transactions/${id}`, data);
      useBudgetStore.getState().fetchBudgets();
    } catch (err) {
      set({ transactions: prev });
      throw err;
    }
  },

  deleteTransaction: async (id) => {
    const prev = get().transactions;
    set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }));
    try {
      await api.delete(`/transactions/${id}`);
      useBudgetStore.getState().fetchBudgets();
    } catch (err) {
      set({ transactions: prev });
      throw err;
    }
  },
}));

import { create } from 'zustand';
import { Card } from '@/types';
import api from '@/lib/api';

interface CardState {
  cards: Card[];
  isLoading: boolean;
  fetchCards: () => Promise<void>;
  addCard: (data: Partial<Card>) => Promise<Card>;
  updateCard: (id: string, data: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  isLoading: false,

  fetchCards: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<{ data: Card[] }>('/cards');
      set({ cards: res.data });
    } finally {
      set({ isLoading: false });
    }
  },

  addCard: async (data) => {
    const created = await api.post<Card>('/cards', data);
    set((state) => ({ cards: [...state.cards, created] }));
    return created;
  },

  updateCard: async (id, data) => {
    const prev = get().cards;
    set((state) => ({
      cards: state.cards.map((c) => c.id === id ? { ...c, ...data } : c),
    }));
    try {
      await api.patch(`/cards/${id}`, data);
    } catch (err) {
      set({ cards: prev });
      throw err;
    }
  },

  deleteCard: async (id) => {
    const prev = get().cards;
    set((state) => ({ cards: state.cards.filter((c) => c.id !== id) }));
    try {
      await api.delete(`/cards/${id}`);
    } catch (err) {
      set({ cards: prev });
      throw err;
    }
  },

  setDefault: async (id) => {
    await api.patch(`/cards/${id}/default`);
    set((state) => ({
      cards: state.cards.map((c) => ({ ...c, is_default: c.id === id })),
    }));
  },
}));

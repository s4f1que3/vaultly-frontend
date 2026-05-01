import { create } from 'zustand';
import { Goal, GoalStatus } from '@/types';
import api from '@/lib/api';

interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  fetchGoals: () => Promise<void>;
  addGoal: (data: Partial<Goal>) => Promise<Goal>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  contributeToGoal: (id: string, amount: number) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,

  fetchGoals: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<{ data: Goal[] }>('/goals');
      set({ goals: res.data });
    } finally {
      set({ isLoading: false });
    }
  },

  addGoal: async (data) => {
    const created = await api.post<Goal>('/goals', data);
    set((state) => ({ goals: [...state.goals, created] }));
    return created;
  },

  updateGoal: async (id, data) => {
    const prev = get().goals;
    set((state) => ({
      goals: state.goals.map((g) => g.id === id ? { ...g, ...data } : g),
    }));
    try {
      await api.patch(`/goals/${id}`, data);
    } catch (err) {
      set({ goals: prev });
      throw err;
    }
  },

  deleteGoal: async (id) => {
    const prev = get().goals;
    set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
    try {
      await api.delete(`/goals/${id}`);
    } catch (err) {
      set({ goals: prev });
      throw err;
    }
  },

  contributeToGoal: async (id, amount) => {
    const prev = get().goals;
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === id
          ? { ...g, current_amount: g.current_amount + amount, status: (g.current_amount + amount >= g.target_amount ? 'completed' : 'active') as GoalStatus }
          : g
      ),
    }));
    try {
      await api.post(`/goals/${id}/contribute`, { amount });
    } catch (err) {
      set({ goals: prev });
      throw err;
    }
  },
}));

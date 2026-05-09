import { create } from 'zustand';
import { Household, HouseholdMember, HouseholdInvite } from '@/types';
import api from '@/lib/api';

interface HouseholdState {
  household: Household | null;
  members: HouseholdMember[];
  invites: HouseholdInvite[];
  role: 'owner' | 'member' | null;
  pendingInvites: (HouseholdInvite & { household?: { name: string } })[];
  isLoading: boolean;
  fetchHousehold: () => Promise<void>;
  createHousehold: (name: string) => Promise<void>;
  inviteMember: (email: string) => Promise<void>;
  acceptInvite: (id: string) => Promise<void>;
  declineInvite: (id: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
  deleteHousehold: () => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
}

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  household: null,
  members: [],
  invites: [],
  role: null,
  pendingInvites: [],
  isLoading: false,

  fetchHousehold: async () => {
    set({ isLoading: true });
    try {
      const [hRes, invRes] = await Promise.all([
        api.get<{ household: Household | null; members: HouseholdMember[]; invites: HouseholdInvite[]; role?: string }>('/households'),
        api.get<{ data: (HouseholdInvite & { household?: { name: string } })[] }>('/households/invites'),
      ]);
      set({
        household: hRes.household,
        members: hRes.members,
        invites: hRes.invites,
        role: hRes.role as 'owner' | 'member' | null,
        pendingInvites: invRes.data ?? [],
      });
    } finally {
      set({ isLoading: false });
    }
  },

  createHousehold: async (name) => {
    await api.post('/households', { name });
    get().fetchHousehold();
  },

  inviteMember: async (email) => {
    await api.post('/households/invite', { email });
    get().fetchHousehold();
  },

  acceptInvite: async (id) => {
    await api.post(`/households/invites/${id}/accept`, {});
    get().fetchHousehold();
  },

  declineInvite: async (id) => {
    await api.post(`/households/invites/${id}/decline`, {});
    get().fetchHousehold();
  },

  leaveHousehold: async () => {
    await api.post('/households/leave', {});
    set({ household: null, members: [], invites: [], role: null });
  },

  deleteHousehold: async () => {
    await api.delete('/households');
    set({ household: null, members: [], invites: [], role: null });
  },

  removeMember: async (userId) => {
    await api.delete(`/households/members/${userId}`);
    set((s) => ({ members: s.members.filter((m) => m.user_id !== userId) }));
  },
}));

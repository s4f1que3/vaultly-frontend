import { create } from 'zustand';
import { Notification } from '@/types';
import api from '@/lib/api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<{ data: Notification[] }>('/notifications');
      const notifications = res.data;
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.is_read).length,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => n.id === id ? { ...n, is_read: true } : n),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
    await api.patch('/notifications/read-all');
  },

  deleteNotification: async (id) => {
    const prev = get().notifications;
    const target = prev.find((n) => n.id === id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: target && !target.is_read
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount,
    }));
    try {
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      set({ notifications: prev, unreadCount: prev.filter((n) => !n.is_read).length });
      throw err;
    }
  },
}));

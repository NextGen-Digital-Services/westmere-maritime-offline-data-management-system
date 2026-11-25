import { create } from 'zustand';
import { clientDb, type NotificationItem } from '../db/clientDb';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

interface NotificationState {
  notifications: NotificationItem[];
  toasts: Toast[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  showToast: (title: string, message: string, type?: 'info' | 'warning' | 'error' | 'success') => void;
  dismissToast: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  toasts: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    const notifs = await clientDb.notifications.toCollection().reverse().sortBy('createdAt');
    const unread = notifs.filter(n => !n.isRead).length;
    set({ notifications: notifs, unreadCount: unread });
  },

  markAsRead: async (id: string) => {
    await clientDb.notifications.update(id, { isRead: true });
    await get().fetchNotifications();
  },

  markAllAsRead: async () => {
    const unread = await clientDb.notifications.where('isRead').equals(0).toArray();
    for (const n of unread) {
      await clientDb.notifications.update(n.id, { isRead: true });
    }
    await get().fetchNotifications();
  },

  showToast: (title: string, message: string, type = 'info') => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, title, message, type };
    set(s => ({ toasts: [...s.toasts, newToast] }));
    setTimeout(() => {
      get().dismissToast(id);
    }, 4500);
  },

  dismissToast: (id: string) => {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
  }
}));

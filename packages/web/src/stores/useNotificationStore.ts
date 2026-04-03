/**
 * Notification Store
 *
 * Lightweight toast-style notification system to replace alert() calls.
 */

import { create } from 'zustand';

export interface Notification {
  id: number;
  message: string;
  type: 'error' | 'success';
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (message: string, type: 'error' | 'success') => void;
  removeNotification: (id: number) => void;
}

let nextId = 1;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (message, type) => {
    const id = nextId++;
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }));
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 5000);
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));

export const useNotifications = () => useNotificationStore((s) => s.notifications);

export const useAddNotification = () => useNotificationStore((s) => s.addNotification);

export const useRemoveNotification = () => useNotificationStore((s) => s.removeNotification);

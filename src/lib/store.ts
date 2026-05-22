'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppConfig } from './config-engine';

interface AuthState {
  token: string | null;
  user: { id: string; email: string; name: string; locale: string } | null;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface AppStore {
  auth: AuthState;
  locale: string;
  notifications: Notification[];
  currentAppId: string | null;
  currentConfig: AppConfig | null;

  setAuth: (auth: AuthState) => void;
  logout: () => void;
  setLocale: (locale: string) => void;
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setCurrentApp: (id: string | null, config: AppConfig | null) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      auth: { token: null, user: null },
      locale: 'en',
      notifications: [],
      currentAppId: null,
      currentConfig: null,

      setAuth: (auth) => set({ auth }),
      logout: () => set({ auth: { token: null, user: null }, currentAppId: null, currentConfig: null }),
      setLocale: (locale) => set({ locale }),
      addNotification: (n) => set((s) => ({
        notifications: [
          { ...n, id: crypto.randomUUID?.() || Date.now().toString(), read: false, createdAt: new Date().toISOString() },
          ...s.notifications,
        ].slice(0, 50),
      })),
      markNotificationRead: (id) => set((s) => ({
        notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
      })),
      clearNotifications: () => set({ notifications: [] }),
      setCurrentApp: (id, config) => set({ currentAppId: id, currentConfig: config }),
    }),
    {
      name: 'appforge-store',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage;
        return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
      }),
      partialize: (state) => ({ auth: state.auth, locale: state.locale }),
    }
  )
);

'use client';

import React, { createContext, useState, useCallback, useEffect } from 'react';

export type NotificationType = 'ping' | 'alert' | 'success' | 'error' | 'message';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = manual dismiss
  sender?: string;
  persistent?: boolean; // if true, stored in offline notifications
  timestamp?: number;
  metadata?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  offlineNotifications: Notification[];
  notify: (notification: Omit<Notification, 'id'>) => string;
  dismissNotification: (id: string) => void;
  dismissOfflineNotification: (id: string) => void;
  clearAll: () => void;
  addOfflineNotification: (notification: Omit<Notification, 'id'>) => string;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const OFFLINE_NOTIFICATIONS_STORAGE_KEY = 'love-os-offline-notifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [offlineNotifications, setOfflineNotifications] = useState<Notification[]>([]);

  // Load offline notifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(OFFLINE_NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        try {
          setOfflineNotifications(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse offline notifications', e);
        }
      }
    }
  }, []);

  // Persist offline notifications to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(OFFLINE_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(offlineNotifications));
    }
  }, [offlineNotifications]);

  const notify = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const fullNotification = { ...notification, id, timestamp: Date.now() };
    setNotifications(prev => [...prev, fullNotification]);

    if (notification.duration !== 0) {
      const timeout = notification.duration || 3000;
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, timeout);
    }

    return id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissOfflineNotification = useCallback((id: string) => {
    setOfflineNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addOfflineNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const fullNotification = { ...notification, id, timestamp: Date.now(), persistent: true };
    setOfflineNotifications(prev => [...prev, fullNotification]);
    return id;
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setOfflineNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, offlineNotifications, notify, dismissNotification, dismissOfflineNotification, clearAll, addOfflineNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

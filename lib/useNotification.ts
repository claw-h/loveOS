import { useContext } from 'react';
import { NotificationContext, NotificationType } from './notificationContext';

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }

  return {
    notify: (
      title: string,
      options?: {
        type?: NotificationType;
        message?: string;
        duration?: number;
        sender?: string;
      }
    ) => {
      return context.notify({
        type: options?.type || 'message',
        title,
        message: options?.message,
        duration: options?.duration,
        sender: options?.sender,
      });
    },
    addOfflineNotification: (
      title: string,
      options?: {
        type?: NotificationType;
        message?: string;
        sender?: string;
      }
    ) => {
      return context.addOfflineNotification({
        type: options?.type || 'message',
        title,
        message: options?.message,
        sender: options?.sender,
        persistent: true,
      });
    },
    dismissNotification: context.dismissNotification,
    dismissOfflineNotification: context.dismissOfflineNotification,
    clearAll: context.clearAll,
  };
}

'use client';

import { useContext } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NotificationContext } from '@/lib/notificationContext';

export function NotificationCenter() {
  const context = useContext(NotificationContext);
  if (!context) return null;

  return (
    <AnimatePresence mode="popLayout">
      <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        {context.notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 400, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 400, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`p-4 rounded-lg backdrop-blur-xl border flex gap-3 items-start min-w-[300px] max-w-[400px] pointer-events-auto transition-all duration-300 ${
              notification.type === 'ping' ? 'bg-[var(--accent)]/20 border-[var(--accent)]/50 hover:bg-[var(--accent)]/30 shadow-[0_0_20px_var(--accent)]' :
              notification.type === 'error' ? 'bg-red-500/20 border-red-500/50' :
              notification.type === 'success' ? 'bg-green-500/20 border-green-500/50' :
              'bg-white/10 border-white/20'
            }`}
          >
            <div className="flex-1">
              <div className={`font-mono font-bold text-sm ${
                notification.type === 'ping' ? 'text-[var(--accent)] drop-shadow-[0_0_8px_var(--accent)]' : 'text-white'
              }`}>{notification.title}</div>
              {notification.message && (
                <div className="text-white/70 text-xs mt-1">{notification.message}</div>
              )}
              {notification.sender && (
                <div className="text-white/50 text-[10px] mt-1">from: {notification.sender}</div>
              )}
            </div>
            <button
              onClick={() => context.dismissNotification(notification.id)}
              className="text-white/50 hover:text-white text-lg leading-none shrink-0"
            >
              ×
            </button>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}

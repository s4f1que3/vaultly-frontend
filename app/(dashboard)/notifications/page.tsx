'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Trash2, CheckCheck } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { NotificationType } from '@/types';

const TYPE_ICONS: Record<NotificationType, string> = {
  budget_alert: '⚠️',
  goal_achieved: '🎉',
  transaction: '💳',
  system: '🔔',
};

const TYPE_COLORS: Record<NotificationType, string> = {
  budget_alert: 'rgba(245,158,11,0.15)',
  goal_achieved: 'rgba(87,201,60,0.15)',
  transaction: 'rgba(59,130,246,0.15)',
  system: 'rgba(156,149,133,0.15)',
};

export default function NotificationsPage() {
  const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification, unreadCount } = useNotificationStore();

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        action={
          unreadCount > 0 ? (
            <button onClick={markAllAsRead} className="btn-ghost text-sm">
              <CheckCheck size={15} /> Mark all read
            </button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 flex gap-4">
              <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2"><div className="skeleton h-4 w-48" /><div className="skeleton h-3 w-full" /></div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-16 text-center">
          <BellOff size={36} className="mx-auto text-[var(--color-text-muted)] mb-3" />
          <p className="text-[var(--color-text-secondary)] font-medium">All caught up!</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">No notifications yet</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => !n.is_read && markAsRead(n.id)}
                className={`card p-4 flex items-start gap-4 cursor-pointer transition-colors hover:bg-[var(--color-surface-2)] ${!n.is_read ? 'border-[rgba(87,201,60,0.15)]' : ''}`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: TYPE_COLORS[n.type] }}
                >
                  {TYPE_ICONS[n.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{n.title}</p>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{n.body}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatRelativeTime(n.created_at)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                  className="p-1.5 rounded-lg hover:bg-[rgba(239,68,68,0.1)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

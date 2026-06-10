import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  NOTIFICATIONS,
  PHASE8_NOTIFICATIONS,
  REALTIME_EVENTS,
  ADMIN_ALERTS,
  type Notification,
  type RealtimeEvent,
  type AdminAlert,
} from '../data/dummy';

type RealtimeContextValue = {
  notifications: Notification[];
  events: RealtimeEvent[];
  adminAlerts: AdminAlert[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  pushDemoEvent: (preset?: 'bracket' | 'dispute' | 'stream' | 'discord') => void;
  resolveAdminAlert: (id: string) => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

const PRESET_EVENTS: Record<'bracket' | 'dispute' | 'stream' | 'discord', Omit<RealtimeEvent, 'id' | 'createdAt'>> = {
  bracket: {
    type: 'bracket',
    title: 'Bracket auto-updated',
    message: 'Winner moved to the next available Grand Final slot without refreshing the page.',
    tournamentId: 'trn1',
    matchId: 'm7',
    severity: 'success',
  },
  dispute: {
    type: 'admin',
    title: 'New dispute alert',
    message: 'A captain challenged the submitted result and attached new screenshot proof.',
    tournamentId: 'trn1',
    matchId: 'm6',
    severity: 'danger',
  },
  stream: {
    type: 'match',
    title: 'Featured stream went live',
    message: 'ArenaXOfficial is now broadcasting SEA Championship S4 semifinals.',
    tournamentId: 'trn1',
    severity: 'info',
  },
  discord: {
    type: 'integration',
    title: 'Discord webhook delivered',
    message: 'Match reminder posted to #match-reminders and participant roles were synced.',
    tournamentId: 'trn1',
    severity: 'success',
  },
};

const PRESET_NOTIFICATIONS: Record<'bracket' | 'dispute' | 'stream' | 'discord', Omit<Notification, 'id' | 'time' | 'read'>> = {
  bracket: {
    type: 'bracket_update',
    title: 'Bracket Updated',
    message: 'A winner was advanced to the next round in realtime.',
  },
  dispute: {
    type: 'dispute',
    title: 'Dispute Opened',
    message: 'Admin review is needed for a new disputed match result.',
  },
  stream: {
    type: 'stream_live',
    title: 'Stream Live',
    message: 'The featured Twitch broadcast is now live.',
  },
  discord: {
    type: 'discord_sync',
    title: 'Discord Synced',
    message: 'Webhook announcement and role sync completed.',
  },
};

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([
    ...PHASE8_NOTIFICATIONS,
    ...NOTIFICATIONS,
  ]);
  const [events, setEvents] = useState<RealtimeEvent[]>(REALTIME_EVENTS);
  const [adminAlerts, setAdminAlerts] = useState<AdminAlert[]>(ADMIN_ALERTS);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  function markNotificationRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  function markAllNotificationsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function deleteNotification(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  function resolveAdminAlert(id: string) {
    setAdminAlerts(prev => prev.map(alert => alert.id === id ? { ...alert, handled: true } : alert));
  }

  function pushDemoEvent(preset: 'bracket' | 'dispute' | 'stream' | 'discord' = 'bracket') {
    const eventBase = PRESET_EVENTS[preset];
    const notificationBase = PRESET_NOTIFICATIONS[preset];
    const stamp = Date.now();

    setEvents(prev => [
      {
        ...eventBase,
        id: `rt-demo-${stamp}`,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    setNotifications(prev => [
      {
        ...notificationBase,
        id: `n-demo-${stamp}`,
        time: 'Just now',
        read: false,
      },
      ...prev,
    ]);

    if (preset === 'dispute') {
      setAdminAlerts(prev => [
        {
          id: `aa-demo-${stamp}`,
          title: 'Realtime dispute generated',
          message: 'A demo dispute alert was pushed from the live center.',
          priority: 'critical',
          source: 'dispute',
          createdAt: new Date().toISOString(),
          handled: false,
        },
        ...prev,
      ]);
    }
  }

  return (
    <RealtimeContext.Provider value={{
      notifications,
      events,
      adminAlerts,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      pushDemoEvent,
      resolveAdminAlert,
    }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext) as RealtimeContextValue | null;
  if (!ctx) {
    throw new Error('useRealtime must be used inside RealtimeProvider');
  }
  return ctx;
}

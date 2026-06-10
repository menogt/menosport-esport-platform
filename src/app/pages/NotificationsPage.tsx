import { useState, type ComponentType } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import {
  Bell, Zap, CheckCircle, AlertTriangle, Users, DollarSign,
  Trophy, Clock, Check, Trash2, Filter, ArrowLeft, Radio,
  PlugZap, UserPlus, Film, GitBranch
} from 'lucide-react';
import { type Notification } from '../data/dummy';
import { useRealtime } from '../context/RealtimeContext';

const TYPE_CONFIG: Record<Notification['type'], { icon: ComponentType<{ size?: number; className?: string; style?: any }>, color: string, bg: string }> = {
  match_soon:       { icon: Zap,          color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
  checkin_open:     { icon: Clock,        color: '#00d4ff', bg: 'rgba(0,212,255,0.12)' },
  result_submitted: { icon: CheckCircle,  color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  dispute:          { icon: AlertTriangle,color: '#ff4655', bg: 'rgba(255,70,85,0.12)' },
  admin_decision:   { icon: Trophy,       color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  payout:           { icon: DollarSign,   color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  team_invite:      { icon: Users,        color: '#00d4ff', bg: 'rgba(0,212,255,0.12)' },
  stream_live:      { icon: Radio,        color: '#ff4655', bg: 'rgba(255,70,85,0.12)' },
  discord_sync:     { icon: PlugZap,      color: '#5865f2', bg: 'rgba(88,101,242,0.12)' },
  registration:     { icon: UserPlus,     color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
  media_featured:   { icon: Film,         color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  bracket_update:   { icon: GitBranch,    color: '#00d4ff', bg: 'rgba(0,212,255,0.12)' },
};

type FilterType = 'all' | 'unread' | Notification['type'];

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Matches', value: 'match_soon' },
  { label: 'Check-in', value: 'checkin_open' },
  { label: 'Results', value: 'result_submitted' },
  { label: 'Disputes', value: 'dispute' },
  { label: 'Bracket', value: 'bracket_update' },
  { label: 'Streams', value: 'stream_live' },
  { label: 'Discord', value: 'discord_sync' },
  { label: 'Payouts', value: 'payout' },
];

export function NotificationsPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    pushDemoEvent,
  } = useRealtime();

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  return (
    <div className="min-h-screen" style={{ background: '#08090f' }}>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/" className="p-2 rounded-lg transition-colors hover:bg-white/8">
            <ArrowLeft size={18} className="text-white/50" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.15)' }}>
              <Bell size={20} style={{ color: '#00d4ff' }} />
            </div>
            <div>
              <h1 className="font-bold text-white" style={{ fontFamily: 'Rajdhani', fontSize: '1.5rem' }}>Notifications</h1>
              <p className="text-white/40 text-sm">Phase 8 realtime-ready notification center · {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
              style={{ background: 'rgba(0,212,255,0.12)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}
            >
              <Check size={14} />
              Mark all read
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Bracket', action: () => pushDemoEvent('bracket') },
            { label: 'Dispute', action: () => pushDemoEvent('dispute') },
            { label: 'Stream', action: () => pushDemoEvent('stream') },
            { label: 'Discord', action: () => pushDemoEvent('discord') },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className="px-3 py-2 rounded-xl text-xs text-white/70 border hover:text-white hover:bg-white/5 transition-all"
              style={{ borderColor: 'rgba(255,255,255,0.09)' }}
            >
              Simulate {item.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap mt-6 mb-6">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: filter === opt.value ? '#00d4ff' : 'rgba(255,255,255,0.05)',
                color: filter === opt.value ? '#000' : 'rgba(255,255,255,0.55)',
                border: `1px solid ${filter === opt.value ? '#00d4ff' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <Filter size={40} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.1)' }} />
                <p className="text-white/30">No notifications in this category</p>
              </motion.div>
            ) : (
              filtered.map((notif) => {
                const cfg = TYPE_CONFIG[notif.type];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="group flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: notif.read ? 'rgba(255,255,255,0.03)' : 'rgba(0,212,255,0.04)',
                      border: `1px solid ${notif.read ? 'rgba(255,255,255,0.07)' : 'rgba(0,212,255,0.15)'}`,
                    }}
                    onClick={() => markNotificationRead(notif.id)}
                  >
                    <div className="mt-0.5 shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                      <Icon size={18} style={{ color: cfg.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm" style={{ color: notif.read ? 'rgba(255,255,255,0.8)' : '#fff' }}>
                          {notif.title}
                        </span>
                        <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{notif.time}</span>
                      </div>
                      <p className="text-sm mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{notif.message}</p>
                    </div>

                    <div className="flex flex-col items-center gap-2 shrink-0">
                      {!notif.read && <div className="w-2 h-2 rounded-full" style={{ background: '#00d4ff' }} />}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
                      >
                        <Trash2 size={13} className="text-white/30" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

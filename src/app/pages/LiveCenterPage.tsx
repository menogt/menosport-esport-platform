import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import {
  Activity, AlertTriangle, Bell, CheckCircle, Clock, GitBranch,
  Radio, Shield, Trophy, Users, Zap, PlugZap, PlayCircle
} from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext';
import { LIVE_MATCHES, TEAMS, TOURNAMENTS, TWITCH_STREAMS, DISCORD_WEBHOOKS, type RealtimeEvent } from '../data/dummy';

const SEVERITY_STYLE: Record<RealtimeEvent['severity'], { color: string; bg: string; icon: typeof Activity }> = {
  info: { color: '#00d4ff', bg: 'rgba(0,212,255,0.12)', icon: Activity },
  success: { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', icon: CheckCircle },
  warning: { color: '#ffd700', bg: 'rgba(255,215,0,0.12)', icon: Clock },
  danger: { color: '#ff4655', bg: 'rgba(255,70,85,0.12)', icon: AlertTriangle },
};

const EVENT_ICON: Record<RealtimeEvent['type'], typeof Activity> = {
  bracket: GitBranch,
  match: Zap,
  admin: Shield,
  payment: Trophy,
  checkin: Clock,
  media: PlayCircle,
  integration: PlugZap,
};

function teamName(id: string | null) {
  if (!id) return 'TBD';
  return TEAMS.find(team => team.id === id)?.name ?? id;
}

function tournamentName(id?: string) {
  if (!id) return 'Platform';
  return TOURNAMENTS.find(tournament => tournament.id === id)?.name ?? id;
}

export function LiveCenterPage() {
  const { events, adminAlerts, unreadCount, pushDemoEvent, resolveAdminAlert } = useRealtime();
  const unhandledAlerts = adminAlerts.filter(alert => !alert.handled);
  const liveStreams = TWITCH_STREAMS.filter(stream => stream.status === 'live');
  const enabledWebhooks = DISCORD_WEBHOOKS.filter(hook => hook.enabled);

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#08090f' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(124,58,237,0.12), rgba(8,9,15,0.95))', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="p-6 sm:p-8 lg:p-10 grid lg:grid-cols-[1.35fr_0.65fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-4" style={{ background: 'rgba(255,70,85,0.12)', color: '#ff4655', border: '1px solid rgba(255,70,85,0.25)' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ff4655' }} />
                Phase 8 Live Ops Center
              </div>
              <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(2.2rem, 6vw, 4.8rem)', fontWeight: 800, lineHeight: 0.92 }}>
                Realtime tournament command room.
              </h1>
              <p className="text-white/55 mt-5 max-w-2xl leading-relaxed">
                This page simulates the platform layer that will later connect to Supabase Realtime: bracket updates, match status changes, admin dispute alerts, check-in reminders, Discord webhook events, and Twitch stream status.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                {[
                  { label: 'Bracket update', action: () => pushDemoEvent('bracket'), icon: GitBranch },
                  { label: 'Dispute alert', action: () => pushDemoEvent('dispute'), icon: AlertTriangle },
                  { label: 'Stream live', action: () => pushDemoEvent('stream'), icon: Radio },
                  { label: 'Discord sync', action: () => pushDemoEvent('discord'), icon: PlugZap },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white transition-all hover:-translate-y-0.5"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <item.icon className="w-4 h-4" /> {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Unread', value: unreadCount, icon: Bell, color: '#00d4ff' },
                { label: 'Live streams', value: liveStreams.length, icon: Radio, color: '#ff4655' },
                { label: 'Admin alerts', value: unhandledAlerts.length, icon: Shield, color: '#ffd700' },
                { label: 'Webhooks', value: enabledWebhooks.length, icon: PlugZap, color: '#5865f2' },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl p-5 border" style={{ background: 'rgba(8,9,15,0.72)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <stat.icon className="w-5 h-5 mb-4" style={{ color: stat.color }} />
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</p>
                  <p className="text-xs text-white/40">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[1.35fr_0.65fr] gap-6">
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.82)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <div>
                <h2 className="text-white" style={{ fontWeight: 700 }}>Realtime Event Stream</h2>
                <p className="text-xs text-white/35">Newest platform events appear first.</p>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full" style={{ color: '#4ade80', background: 'rgba(74,222,128,0.12)' }}>Realtime mock</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <AnimatePresence initial={false}>
                {events.map(event => {
                  const style = SEVERITY_STYLE[event.severity];
                  const Icon = EVENT_ICON[event.type] ?? style.icon;
                  return (
                    <motion.div key={event.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="p-5 flex gap-4 hover:bg-white/[0.02] transition-colors">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: style.bg, border: `1px solid ${style.color}25` }}>
                        <Icon className="w-5 h-5" style={{ color: style.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm text-white" style={{ fontWeight: 700 }}>{event.title}</h3>
                            <p className="text-sm text-white/45 mt-1 leading-relaxed">{event.message}</p>
                          </div>
                          <span className="text-[10px] capitalize px-2 py-1 rounded-full flex-shrink-0" style={{ color: style.color, background: style.bg }}>{event.type}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-white/30">
                          <span>{new Date(event.createdAt).toLocaleString()}</span>
                          <span>{tournamentName(event.tournamentId)}</span>
                          {event.matchId && <Link to={`/matches/${event.matchId}`} className="hover:text-white">Match {event.matchId}</Link>}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.82)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <h2 className="text-white" style={{ fontWeight: 700 }}>Admin Alert Queue</h2>
                <p className="text-xs text-white/35">Disputes, payment issues, and integration warnings.</p>
              </div>
              <div>
                {adminAlerts.slice(0, 5).map(alert => {
                  const color = alert.priority === 'critical' ? '#ff4655' : alert.priority === 'high' ? '#ffd700' : alert.priority === 'medium' ? '#00d4ff' : '#4ade80';
                  return (
                    <div key={alert.id} className="p-4 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-white" style={{ fontWeight: 700 }}>{alert.title}</p>
                          <p className="text-xs text-white/45 mt-1">{alert.message}</p>
                        </div>
                        <span className="text-[10px] capitalize px-2 py-0.5 rounded-full" style={{ color, background: `${color}15` }}>{alert.priority}</span>
                      </div>
                      <button onClick={() => resolveAdminAlert(alert.id)} disabled={alert.handled}
                        className="mt-3 text-xs px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
                        style={{ color: alert.handled ? 'rgba(255,255,255,0.35)' : '#00d4ff', borderColor: 'rgba(255,255,255,0.08)' }}>
                        {alert.handled ? 'Handled' : 'Mark handled'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.82)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <h2 className="text-white" style={{ fontWeight: 700 }}>Live Match Snapshot</h2>
              </div>
              {LIVE_MATCHES.map(match => (
                <div key={match.id} className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ff4655' }} />
                    <span className="text-xs text-white/40 uppercase tracking-wider">Live now</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-center flex-1">
                      <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-white text-sm" style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)' }}>{teamName(match.team1Id).slice(0, 2)}</div>
                      <p className="text-xs text-white/65 mt-2 truncate">{teamName(match.team1Id)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 800 }}>{match.score1 ?? 0} - {match.score2 ?? 0}</p>
                      <p className="text-[10px] text-white/30">{match.roundName}</p>
                    </div>
                    <div className="text-center flex-1">
                      <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-white text-sm" style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)' }}>{teamName(match.team2Id).slice(0, 2)}</div>
                      <p className="text-xs text-white/65 mt-2 truncate">{teamName(match.team2Id)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.82)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <h2 className="text-white" style={{ fontWeight: 700 }}>Broadcast Status</h2>
              </div>
              {TWITCH_STREAMS.slice(0, 3).map(stream => {
                const color = stream.status === 'live' ? '#ff4655' : stream.status === 'scheduled' ? '#ffd700' : '#6b7280';
                return (
                  <div key={stream.id} className="p-4 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-white" style={{ fontWeight: 700 }}>{stream.channelName}</p>
                        <p className="text-xs text-white/40">{stream.title}</p>
                      </div>
                      <span className="text-[10px] capitalize px-2 py-0.5 rounded-full" style={{ color, background: `${color}15` }}>{stream.status}</span>
                    </div>
                    <p className="text-[10px] text-white/30 mt-2">{stream.viewers.toLocaleString()} viewers · {tournamentName(stream.tournamentId)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

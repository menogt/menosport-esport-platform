import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle, BellRing, Bot, CheckCircle, Copy, ExternalLink,
  MessageSquare, PlugZap, Radio, RefreshCw, Settings, Shield,
  ToggleLeft, ToggleRight, Twitch, Webhook, Zap
} from 'lucide-react';
import { DISCORD_WEBHOOKS, INTEGRATION_LOGS, TOURNAMENTS, TWITCH_STREAMS, type IntegrationLog } from '../data/dummy';
import { useRealtime } from '../context/RealtimeContext';

type ProviderFilter = 'all' | 'discord' | 'twitch';

const LOG_STYLE: Record<IntegrationLog['status'], { color: string; icon: typeof CheckCircle }> = {
  success: { color: '#4ade80', icon: CheckCircle },
  warning: { color: '#ffd700', icon: AlertTriangle },
  failed: { color: '#ff4655', icon: AlertTriangle },
};

function tournamentName(id: string) {
  return TOURNAMENTS.find(tournament => tournament.id === id)?.name ?? id;
}

export function IntegrationsPage() {
  const { pushDemoEvent } = useRealtime();
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>('all');
  const [webhooks, setWebhooks] = useState(DISCORD_WEBHOOKS);
  const [logs, setLogs] = useState(INTEGRATION_LOGS);
  const [copied, setCopied] = useState(false);

  const filteredLogs = useMemo(() => logs.filter(log => providerFilter === 'all' || log.provider === providerFilter), [providerFilter, logs]);
  const liveStream = TWITCH_STREAMS.find(stream => stream.status === 'live');
  const enabledCount = webhooks.filter(hook => hook.enabled).length;

  function toggleWebhook(id: string) {
    setWebhooks(prev => prev.map(hook => hook.id === id ? { ...hook, enabled: !hook.enabled } : hook));
  }

  function sendTestWebhook() {
    const stamp = new Date().toISOString();
    setLogs(prev => [
      {
        id: `il-demo-${Date.now()}`,
        provider: 'discord',
        action: 'Test webhook',
        status: 'success',
        message: 'Demo announcement delivered to #tournament-updates.',
        createdAt: stamp,
      },
      ...prev,
    ]);
    pushDemoEvent('discord');
  }

  function syncTwitch() {
    const stamp = new Date().toISOString();
    setLogs(prev => [
      {
        id: `il-twitch-${Date.now()}`,
        provider: 'twitch',
        action: 'Manual stream sync',
        status: 'success',
        message: 'Fetched latest channel status and updated live stream cards.',
        createdAt: stamp,
      },
      ...prev,
    ]);
    pushDemoEvent('stream');
  }

  function copyWebhookTemplate() {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#08090f' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border overflow-hidden"
          style={{ background: 'radial-gradient(circle at top left, rgba(88,101,242,0.24), transparent 34%), radial-gradient(circle at top right, rgba(145,70,255,0.18), transparent 30%), rgba(13,14,26,0.86)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="p-6 sm:p-8 lg:p-10 grid lg:grid-cols-[1.25fr_0.75fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-4" style={{ background: 'rgba(88,101,242,0.14)', color: '#8ea1ff', border: '1px solid rgba(88,101,242,0.28)' }}>
                <PlugZap className="w-3.5 h-3.5" /> Phase 10 Discord & Twitch Integrations
              </div>
              <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(2.2rem, 6vw, 4.6rem)', fontWeight: 800, lineHeight: 0.92 }}>
                Connect the platform to the community.
              </h1>
              <p className="text-white/55 mt-5 max-w-2xl leading-relaxed">
                This integration console prepares the exact admin workflow needed for Discord webhooks, role automation, tournament announcements, match reminders, winner posts, and Twitch stream embeds.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <button onClick={sendTestWebhook} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white" style={{ background: '#5865f2', fontWeight: 700 }}>
                  <Webhook className="w-4 h-4" /> Send test webhook
                </button>
                <button onClick={syncTwitch} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white border hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                  <RefreshCw className="w-4 h-4" /> Sync Twitch
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Enabled webhooks', value: enabledCount, icon: Webhook, color: '#5865f2' },
                { label: 'Streams configured', value: TWITCH_STREAMS.length, icon: Twitch, color: '#9146ff' },
                { label: 'Live channels', value: TWITCH_STREAMS.filter(stream => stream.status === 'live').length, icon: Radio, color: '#ff4655' },
                { label: 'Logs', value: logs.length, icon: Settings, color: '#00d4ff' },
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

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="space-y-6">
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.82)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div>
                  <h2 className="text-white" style={{ fontWeight: 700 }}>Discord Webhook Automations</h2>
                  <p className="text-xs text-white/35">Announcements, match reminders, dispute alerts, and winner posts.</p>
                </div>
                <Bot className="w-5 h-5" style={{ color: '#5865f2' }} />
              </div>
              {webhooks.map(hook => (
                <div key={hook.id} className="p-5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm text-white" style={{ fontWeight: 700 }}>{hook.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: '#8ea1ff', background: 'rgba(88,101,242,0.15)' }}>{hook.channel}</span>
                      </div>
                      <p className="text-xs text-white/40 mt-1 capitalize">Trigger: {hook.event.replaceAll('_', ' ')}</p>
                      <p className="text-[10px] text-white/25 mt-1">Last sent: {hook.lastSent}</p>
                    </div>
                    <button onClick={() => toggleWebhook(hook.id)} className="p-2 rounded-xl hover:bg-white/5 transition-colors" title="Toggle webhook">
                      {hook.enabled ? <ToggleRight className="w-8 h-8" style={{ color: '#4ade80' }} /> : <ToggleLeft className="w-8 h-8 text-white/30" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border p-5" style={{ background: 'rgba(13,14,26,0.82)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-white" style={{ fontWeight: 700 }}>Webhook Payload Template</h2>
                  <p className="text-xs text-white/35">Frontend placeholder for the backend webhook body.</p>
                </div>
                <button onClick={copyWebhookTemplate} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border hover:bg-white/5" style={{ color: '#00d4ff', borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-xl p-4 text-xs leading-relaxed" style={{ background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.06)' }}>{`{
  "event": "match_starting",
  "channel": "#match-reminders",
  "title": "Match starts in 30 minutes",
  "body": "Phantom Ascent vs Neon Wolves",
  "ctaUrl": "/matches/m6",
  "roles": ["participant", "captain"]
}`}</pre>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.82)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div>
                  <h2 className="text-white" style={{ fontWeight: 700 }}>Twitch Stream Embeds</h2>
                  <p className="text-xs text-white/35">Match pages can show these streams later.</p>
                </div>
                <Twitch className="w-5 h-5" style={{ color: '#9146ff' }} />
              </div>
              {TWITCH_STREAMS.map(stream => {
                const color = stream.status === 'live' ? '#ff4655' : stream.status === 'scheduled' ? '#ffd700' : '#6b7280';
                return (
                  <div key={stream.id} className="p-5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm text-white" style={{ fontWeight: 700 }}>{stream.channelName}</h3>
                        <p className="text-xs text-white/45 mt-1">{stream.title}</p>
                        <p className="text-[10px] text-white/25 mt-1">{tournamentName(stream.tournamentId)}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ color, background: `${color}15` }}>{stream.status}</span>
                    </div>
                    <div className="mt-4 rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'linear-gradient(135deg, rgba(145,70,255,0.18), rgba(0,0,0,0.28))' }}>
                      <div className="aspect-video flex items-center justify-center text-center p-6">
                        <div>
                          <Radio className="w-10 h-10 mx-auto mb-3" style={{ color }} />
                          <p className="text-sm text-white" style={{ fontWeight: 700 }}>{stream.status === 'live' ? `${stream.viewers.toLocaleString()} watching now` : 'Embed preview placeholder'}</p>
                          <p className="text-xs text-white/35 mt-1">Real Twitch iframe goes here after backend/domain setup.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {liveStream && (
              <div className="rounded-2xl border p-5" style={{ background: 'linear-gradient(135deg, rgba(255,70,85,0.14), rgba(13,14,26,0.9))', borderColor: 'rgba(255,70,85,0.22)' }}>
                <BellRing className="w-6 h-6 mb-4" style={{ color: '#ff4655' }} />
                <h2 className="text-white" style={{ fontWeight: 800 }}>Live broadcast detected</h2>
                <p className="text-sm text-white/48 mt-2">{liveStream.channelName} is live. Use this status on the tournament page, match page, and homepage live module.</p>
                <button onClick={syncTwitch} className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white border hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh stream card
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.82)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <div>
              <h2 className="text-white" style={{ fontWeight: 700 }}>Integration Logs</h2>
              <p className="text-xs text-white/35">Delivery history for Discord and Twitch actions.</p>
            </div>
            <div className="flex gap-2">
              {(['all', 'discord', 'twitch'] as ProviderFilter[]).map(item => (
                <button key={item} onClick={() => setProviderFilter(item)} className="px-3 py-1.5 rounded-lg text-xs capitalize"
                  style={{ background: providerFilter === item ? '#00d4ff' : 'rgba(255,255,255,0.05)', color: providerFilter === item ? '#000' : 'rgba(255,255,255,0.55)' }}>{item}</button>
              ))}
            </div>
          </div>
          <div>
            {filteredLogs.map(log => {
              const style = LOG_STYLE[log.status];
              const Icon = style.icon;
              return (
                <div key={log.id} className="px-5 py-4 border-b last:border-0 flex gap-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${style.color}15`, border: `1px solid ${style.color}25` }}>
                    <Icon className="w-4 h-4" style={{ color: style.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-white" style={{ fontWeight: 700 }}>{log.action}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ color: log.provider === 'discord' ? '#8ea1ff' : '#c084fc', background: log.provider === 'discord' ? 'rgba(88,101,242,0.15)' : 'rgba(145,70,255,0.15)' }}>{log.provider}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ color: style.color, background: `${style.color}15` }}>{log.status}</span>
                    </div>
                    <p className="text-xs text-white/45 mt-1">{log.message}</p>
                    <p className="text-[10px] text-white/25 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/20" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 mt-0.5" style={{ color: '#ffd700' }} />
            <div>
              <h3 className="text-sm text-white" style={{ fontWeight: 700 }}>Security note</h3>
              <p className="text-xs text-white/40 mt-1">Webhook URLs and OAuth secrets should live only in server environment variables. This frontend intentionally stores no real secrets.</p>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm text-white/70 border hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <Zap className="w-4 h-4" /> Ready for backend
          </button>
        </div>
      </div>
    </div>
  );
}

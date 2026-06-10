import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Trophy, Users, Zap, Settings, LogOut, ChevronRight, Shield,
  AlertTriangle, BarChart2, CheckCircle, XCircle, Eye, Bell,
  DollarSign, Calendar, MoreHorizontal, Search, Filter, TrendingUp, Radio, PlugZap, Film, ShoppingBag
} from 'lucide-react';
import { TOURNAMENTS, TEAMS, DISPUTE_TICKETS, PLAYERS, SPONSORS, GAMES, NOTIFICATIONS, PLATFORM_STATS, PAYMENT_RECORDS, PAYOUT_RECORDS, PRIZE_SOURCES, ADMIN_ALERTS, REALTIME_EVENTS, DISCORD_WEBHOOKS, TWITCH_STREAMS, INTEGRATION_LOGS, MEDIA_POSTS, PRODUCTS, STORE_ORDERS, SPONSOR_CAMPAIGNS, SPONSOR_PLACEMENTS, ANALYTICS_METRICS, REVENUE_SNAPSHOTS, ADMIN_HEALTH_CHECKS } from '../data/dummy';

type Tab = 'overview' | 'tournaments' | 'users' | 'disputes' | 'sponsors' | 'payments' | 'liveops' | 'media' | 'store' | 'integrations' | 'analytics';

const NAV_ITEMS = [
  { key: 'overview' as Tab, label: 'Overview', icon: BarChart2 },
  { key: 'tournaments' as Tab, label: 'Tournaments', icon: Trophy },
  { key: 'users' as Tab, label: 'Users', icon: Users },
  { key: 'disputes' as Tab, label: 'Disputes', icon: AlertTriangle },
  { key: 'sponsors' as Tab, label: 'Sponsors', icon: DollarSign },
  { key: 'payments' as Tab, label: 'Payments', icon: DollarSign },
  { key: 'liveops' as Tab, label: 'Live Ops', icon: Radio },
  { key: 'media' as Tab, label: 'Media', icon: Film },
  { key: 'store' as Tab, label: 'Store', icon: ShoppingBag },
  { key: 'integrations' as Tab, label: 'Integrations', icon: PlugZap },
  { key: 'analytics' as Tab, label: 'Analytics', icon: TrendingUp },
];

const DISPUTE_STATUS_STYLE = {
  open: { label: 'Open', color: '#ff4655', bg: 'rgba(255,70,85,0.12)' },
  under_review: { label: 'Under Review', color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
  resolved: { label: 'Resolved', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
};

const TOURNAMENT_STATUS_STYLE = {
  upcoming: { label: 'Upcoming', color: '#a855f7' },
  registration: { label: 'Open', color: '#00d4ff' },
  ongoing: { label: 'Live', color: '#4ade80' },
  completed: { label: 'Ended', color: '#6b7280' },
};

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [disputeFilter, setDisputeFilter] = useState<'all' | 'open' | 'under_review' | 'resolved'>('all');
  const [disputes, setDisputes] = useState(DISPUTE_TICKETS);
  const [adminDecision, setAdminDecision] = useState<Record<string, string>>({});
  const [adminAlerts, setAdminAlerts] = useState(ADMIN_ALERTS);
  const [webhooks, setWebhooks] = useState(DISCORD_WEBHOOKS);
  const openDisputes = disputes.filter(d => d.status === 'open').length;
  const pendingPayments = PAYMENT_RECORDS.filter(p => p.status === 'pending').length;
  const totalPaidRevenue = PAYMENT_RECORDS.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const activeAdminAlerts = adminAlerts.filter(alert => !alert.handled).length;
  const liveEventCount = REALTIME_EVENTS.length;
  const enabledWebhookCount = webhooks.filter(hook => hook.enabled).length;
  const storeRevenue = STORE_ORDERS.reduce((sum, order) => sum + order.total, 0);
  const sponsorRevenue = SPONSOR_CAMPAIGNS.reduce((sum, campaign) => sum + campaign.budget, 0);
  const lowStockProducts = PRODUCTS.filter(product => product.stock < 20).length;

  const filteredDisputes = disputes.filter(d =>
    disputeFilter === 'all' || d.status === disputeFilter
  );

  const resolveDispute = (id: string, winner: string) => {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: 'resolved' as const, evidence: `${d.evidence} Admin decision: ${winner}. ${adminDecision[id] ?? ''}` } : d));
  };

  const resolveAlert = (id: string) => {
    setAdminAlerts(prev => prev.map(alert => alert.id === id ? { ...alert, handled: true } : alert));
  };

  const toggleWebhook = (id: string) => {
    setWebhooks(prev => prev.map(hook => hook.id === id ? { ...hook, enabled: !hook.enabled } : hook));
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#08090f' }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(13,14,26,0.9)', paddingTop: '4rem' }}>
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ff4655, #a855f7)', boxShadow: '0 0 16px rgba(255,70,85,0.25)' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-white" style={{ fontWeight: 600 }}>Admin Panel</p>
              <p className="text-xs text-white/40">System Administrator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeTab === item.key ? 'text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
              style={activeTab === item.key ? { background: 'rgba(255,70,85,0.1)', border: '1px solid rgba(255,70,85,0.2)', color: '#ff4655' } : {}}>
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.key === 'disputes' && openDisputes > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full text-[10px] flex items-center justify-center text-white"
                  style={{ background: '#ff4655', boxShadow: '0 0 8px rgba(255,70,85,0.4)' }}>
                  {openDisputes}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t space-y-1" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <Link to="/login" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto pt-20 lg:pt-6 px-4 sm:px-6 pb-12">
        {/* Mobile tabs */}
        <div className="lg:hidden flex gap-1 mb-6 overflow-x-auto pb-1">
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
              style={activeTab === item.key
                ? { background: 'rgba(255,70,85,0.15)', color: '#ff4655', border: '1px solid rgba(255,70,85,0.3)' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <item.icon className="w-3 h-3" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div>
              <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>Admin Overview</h1>
              <p className="text-white/40 text-sm">Platform health and key metrics</p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Tournaments', value: PLATFORM_STATS.totalTournaments, icon: Trophy, color: '#00d4ff', change: '+12%' },
                { label: 'Active Players', value: PLATFORM_STATS.activePlayers, icon: Users, color: '#a855f7', change: '+8%' },
                { label: 'Open Disputes', value: openDisputes, icon: AlertTriangle, color: '#ff4655', change: '-2' },
                { label: 'Revenue', value: `$${totalPaidRevenue.toFixed(0)} test`, icon: DollarSign, color: '#ffd700', change: `+${pendingPayments} pending` },
              ].map((kpi, i) => (
                <div key={i} className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: `${kpi.color}15`, border: `1px solid ${kpi.color}25` }}>
                      <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>{kpi.change}</span>
                  </div>
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: kpi.color }}>{kpi.value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Recent activity + recent tournaments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Active tournaments */}
              <div className="rounded-xl border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <span className="text-sm text-white" style={{ fontWeight: 600 }}>Active Tournaments</span>
                  <button onClick={() => setActiveTab('tournaments')} className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1">
                    View All <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                {TOURNAMENTS.filter(t => t.status === 'ongoing' || t.status === 'registration').slice(0, 4).map(t => {
                  const game = GAMES.find(g => g.id === t.game)!;
                  const ts = TOURNAMENT_STATUS_STYLE[t.status];
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-5 py-3 border-b last:border-0 hover:bg-white/[0.02] transition-colors"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className={`w-1 h-8 rounded-full flex-shrink-0 bg-gradient-to-b ${t.coverGradient}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate" style={{ fontWeight: 600 }}>{t.name}</p>
                        <p className="text-[10px] text-white/40">{game.shortName} · {t.registeredTeams}/{t.maxTeams} teams</p>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ color: ts.color, background: `${ts.color}12` }}>{ts.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Open disputes */}
              <div className="rounded-xl border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <span className="text-sm text-white flex items-center gap-2" style={{ fontWeight: 600 }}>
                    Open Disputes
                    {openDisputes > 0 && <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center text-white" style={{ background: '#ff4655' }}>{openDisputes}</span>}
                  </span>
                  <button onClick={() => setActiveTab('disputes')} className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1">
                    Review <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                {disputes.map(d => {
                  const ds = DISPUTE_STATUS_STYLE[d.status];
                  return (
                    <div key={d.id} className="px-5 py-3 border-b last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-white" style={{ fontWeight: 600 }}>{d.team1} vs {d.team2}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ color: ds.color, background: ds.bg }}>{ds.label}</span>
                      </div>
                      <p className="text-[10px] text-white/40">{d.tournamentName}</p>
                      <p className="text-[10px] text-white/30 mt-0.5 truncate">{d.evidence}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform announcements */}
            <div className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <h3 className="text-sm text-white mb-4" style={{ fontWeight: 600 }}>Post Announcement</h3>
              <textarea placeholder="Write a platform-wide announcement..."
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none resize-none"
                rows={3}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <div className="flex justify-end mt-3">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
                  <Bell className="w-3.5 h-3.5" /> Publish
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tournaments */}
        {activeTab === 'tournaments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
            <div className="flex items-center justify-between">
              <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>Tournament Management</h1>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
                <Trophy className="w-3.5 h-3.5" /> New Tournament
              </button>
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b text-[10px] text-white/30"
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <span className="col-span-5">Tournament</span>
                <span className="col-span-2 text-center">Game</span>
                <span className="col-span-2 text-center">Teams</span>
                <span className="col-span-1 text-center">Prize</span>
                <span className="col-span-1 text-center">Status</span>
                <span className="col-span-1 text-right">Actions</span>
              </div>
              {TOURNAMENTS.map(t => {
                const game = GAMES.find(g => g.id === t.game)!;
                const ts = TOURNAMENT_STATUS_STYLE[t.status];
                return (
                  <div key={t.id} className="grid grid-cols-12 gap-2 items-center px-5 py-3.5 border-b hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <div className="col-span-5 min-w-0">
                      <p className="text-xs text-white truncate" style={{ fontWeight: 600 }}>{t.name}</p>
                      <p className="text-[10px] text-white/40">{t.region} · {t.organizer}</p>
                    </div>
                    <span className="col-span-2 text-center text-xs" style={{ color: game.color }}>{game.shortName}</span>
                    <span className="col-span-2 text-center text-xs text-white/60">{t.registeredTeams}/{t.maxTeams}</span>
                    <span className="col-span-1 text-center text-xs" style={{ color: '#ffd700', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
                      ${(t.prizePool / 1000).toFixed(0)}K
                    </span>
                    <div className="col-span-1 flex justify-center">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ color: ts.color, background: `${ts.color}12` }}>{ts.label}</span>
                    </div>
                    <div className="col-span-1 flex justify-end gap-1">
                      <Link to={`/tournaments/${t.id}`}>
                        <button className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors">
                          <Eye className="w-3 h-3" />
                        </button>
                      </Link>
                      <button className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors">
                        <MoreHorizontal className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
            <div className="flex items-center justify-between">
              <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>User Management</h1>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input placeholder="Search users..." className="pl-9 pr-4 py-2 rounded-xl text-sm text-white outline-none w-48"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b text-[10px] text-white/30" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <span className="col-span-4">Player</span>
                <span className="col-span-2">Team</span>
                <span className="col-span-2 text-center">Role</span>
                <span className="col-span-2 text-center">W/L</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>
              {PLAYERS.map(player => {
                const team = TEAMS.find(t => t.id === player.teamId);
                return (
                  <div key={player.id} className="grid grid-cols-12 gap-2 items-center px-5 py-3.5 border-b hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <div className="col-span-4 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] text-white flex-shrink-0"
                        style={{ background: 'rgba(0,212,255,0.12)', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
                        {player.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-white truncate" style={{ fontWeight: 600 }}>{player.username}</p>
                        <p className="text-[10px] text-white/40 truncate">{player.region}</p>
                      </div>
                    </div>
                    <span className="col-span-2 text-xs text-white/60 truncate">{team?.tag ?? '—'}</span>
                    <span className="col-span-2 text-center text-xs text-white/50 truncate">{player.role}</span>
                    <span className="col-span-2 text-center text-xs text-white/50">{player.wins}W {player.losses}L</span>
                    <div className="col-span-2 flex justify-end gap-1">
                      <button className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors">
                        <Eye className="w-3 h-3" />
                      </button>
                      <button className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <XCircle className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Disputes */}
        {activeTab === 'disputes' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
            <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>Dispute Resolution</h1>

            <div className="flex gap-2">
              {(['all', 'open', 'under_review', 'resolved'] as const).map(f => (
                <button key={f} onClick={() => setDisputeFilter(f)}
                  className="px-3 py-1.5 rounded-full text-xs capitalize transition-all"
                  style={disputeFilter === f
                    ? { background: 'rgba(255,70,85,0.15)', color: '#ff4655', border: '1px solid rgba(255,70,85,0.3)' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredDisputes.map(d => {
                const ds = DISPUTE_STATUS_STYLE[d.status];
                return (
                  <div key={d.id} className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: d.status === 'open' ? 'rgba(255,70,85,0.2)' : 'rgba(255,255,255,0.07)' }}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4" style={{ color: ds.color }} />
                          <span className="text-sm text-white" style={{ fontWeight: 600 }}>Match #{d.matchId.toUpperCase()}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: ds.color, background: ds.bg }}>{ds.label}</span>
                        </div>
                        <p className="text-xs text-white/40">{d.tournamentName}</p>
                      </div>
                      <span className="text-[10px] text-white/30">{new Date(d.openedAt).toLocaleDateString()}</span>
                    </div>

                    {/* Both teams' submissions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {[
                        { team: d.team1, score: d.submittedScore1, side: 'Team A' },
                        { team: d.team2, score: d.submittedScore2, side: 'Team B' },
                      ].map((s, i) => (
                        <div key={i} className="rounded-lg p-3 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                          <p className="text-[10px] text-white/40 mb-1">{s.side}</p>
                          <p className="text-sm text-white" style={{ fontWeight: 600 }}>{s.team}</p>
                          <p className="text-xs mt-1" style={{ color: '#00d4ff' }}>Reports: {s.score}</p>
                        </div>
                      ))}
                    </div>

                    {/* Evidence */}
                    <div className="rounded-lg p-3 border mb-4" style={{ background: 'rgba(255,215,0,0.04)', borderColor: 'rgba(255,215,0,0.1)' }}>
                      <p className="text-[10px] text-white/40 mb-1">Evidence Submitted</p>
                      <p className="text-sm text-white/70">{d.evidence}</p>
                    </div>

                    {/* Admin actions */}
                    {d.status !== 'resolved' && (
                      <div className="space-y-3">
                        <textarea
                          value={adminDecision[d.id] ?? ''}
                          onChange={e => setAdminDecision(prev => ({ ...prev, [d.id]: e.target.value }))}
                          placeholder="Admin decision notes..."
                          className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-white/30 outline-none resize-none"
                          rows={2}
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => resolveDispute(d.id, d.team1)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs text-white"
                            style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80', fontWeight: 600 }}>
                            <CheckCircle className="w-3.5 h-3.5" /> Award {d.team1}
                          </button>
                          <button onClick={() => resolveDispute(d.id, d.team2)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs"
                            style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.22)', color: '#00d4ff', fontWeight: 600 }}>
                            <CheckCircle className="w-3.5 h-3.5" /> Award {d.team2}
                          </button>
                          <button onClick={() => resolveDispute(d.id, 'Replay scheduled')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs text-white/50 border"
                            style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                            Replay Match
                          </button>
                        </div>
                      </div>
                    )}
                    {d.status === 'resolved' && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#4ade80' }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Dispute resolved
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Sponsors */}
        {activeTab === 'sponsors' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
            <div className="flex items-center justify-between">
              <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>Sponsor Management</h1>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
                Add Sponsor
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {SPONSORS.map(s => (
                <div key={s.id} className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: `${s.color}20` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm"
                      style={{ background: `${s.color}15`, border: `1px solid ${s.color}25`, color: s.color, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
                      {s.logo}
                    </div>
                    <div>
                      <p className="text-sm text-white" style={{ fontWeight: 600 }}>{s.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize" style={{ background: `${s.color}12`, color: s.color }}>{s.tier}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-lg text-xs text-white/60 border hover:bg-white/5 transition-colors"
                      style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Edit</button>
                    <button className="flex-1 py-2 rounded-lg text-xs border transition-colors hover:bg-red-500/10"
                      style={{ borderColor: 'rgba(255,70,85,0.2)', color: '#ff4655' }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Sponsor Campaigns</h3>
                  <p className="text-xs text-white/35">Phase 11 campaign performance and placement status.</p>
                </div>
                {SPONSOR_CAMPAIGNS.map(campaign => {
                  const sponsor = SPONSORS.find(s => s.id === campaign.sponsorId);
                  const tournament = TOURNAMENTS.find(t => t.id === campaign.tournamentId);
                  const color = campaign.status === 'active' ? '#4ade80' : campaign.status === 'scheduled' ? '#ffd700' : campaign.status === 'completed' ? '#00d4ff' : '#6b7280';
                  return (
                    <div key={campaign.id} className="px-5 py-4 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate" style={{ fontWeight: 600 }}>{campaign.title}</p>
                          <p className="text-xs text-white/40">{sponsor?.name} · {tournament?.name}</p>
                          <p className="text-[10px] text-white/30 mt-1">{campaign.impressions.toLocaleString()} impressions · {campaign.clicks.toLocaleString()} clicks · {campaign.ctr}% CTR</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ color, background: `${color}15` }}>{campaign.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Placement Inventory</h3>
                  <p className="text-xs text-white/35">Where sponsor cards appear across the platform.</p>
                </div>
                {SPONSOR_PLACEMENTS.map(placement => {
                  const sponsor = SPONSORS.find(s => s.id === placement.sponsorId);
                  return (
                    <div key={placement.id} className="px-5 py-4 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-white" style={{ fontWeight: 600 }}>{placement.name}</p>
                          <p className="text-xs text-white/40">{placement.page} · {sponsor?.name}</p>
                          <p className="text-[10px] text-white/30 mt-1">{placement.description}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: placement.live ? '#4ade80' : '#ffd700', background: placement.live ? 'rgba(74,222,128,0.12)' : 'rgba(255,215,0,0.12)' }}>{placement.live ? 'Live' : 'Draft'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Payments */}
        {activeTab === 'payments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
            <div>
              <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>Payments & Prize Tracking</h1>
              <p className="text-white/40 text-sm">Phase 7 sandbox payment ledger, ticketing status, prize sources, and payout tracking.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Paid Test Revenue', value: `$${totalPaidRevenue}`, color: '#4ade80' },
                { label: 'Pending Payments', value: pendingPayments, color: '#ffd700' },
                { label: 'Prize Sources', value: PRIZE_SOURCES.length, color: '#00d4ff' },
                { label: 'Payout Records', value: PAYOUT_RECORDS.length, color: '#a855f7' },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                  <p className="text-xs text-white/40 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Registration Payment Ledger</h3>
                  <p className="text-xs text-white/35">Sandbox references only. No real money movement.</p>
                </div>
                {PAYMENT_RECORDS.map(payment => {
                  const tournament = TOURNAMENTS.find(t => t.id === payment.tournamentId);
                  const statusColor = payment.status === 'paid' ? '#4ade80' : payment.status === 'pending' ? '#ffd700' : payment.status === 'failed' ? '#ff4655' : '#6b7280';
                  return (
                    <div key={payment.id} className="px-5 py-4 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-white" style={{ fontWeight: 600 }}>{payment.payer}</p>
                          <p className="text-xs text-white/40">{tournament?.name ?? payment.tournamentId}</p>
                          <p className="text-[10px] text-white/25 mt-1">{payment.reference}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm" style={{ color: '#ffd700', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>${payment.amount}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ color: statusColor, background: `${statusColor}15` }}>{payment.status}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Prize Pool Sources</h3>
                  <p className="text-xs text-white/35">Entry fee + sponsor + organizer contribution breakdown.</p>
                </div>
                {PRIZE_SOURCES.slice(0, 5).map(source => {
                  const tournament = TOURNAMENTS.find(t => t.id === source.tournamentId);
                  const total = source.sponsorContribution + source.entryFeeContribution + source.organizerContribution;
                  return (
                    <div key={source.tournamentId} className="px-5 py-4 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-white truncate" style={{ fontWeight: 600 }}>{tournament?.name ?? source.tournamentId}</p>
                        <p className="text-xs" style={{ color: '#ffd700', fontWeight: 700 }}>${total.toLocaleString()}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-white/45">
                        <span>Sponsor ${source.sponsorContribution.toLocaleString()}</span>
                        <span>Entry ${source.entryFeeContribution.toLocaleString()}</span>
                        <span>Org ${source.organizerContribution.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Payout Tracking</h3>
              </div>
              {PAYOUT_RECORDS.map(payout => {
                const statusColor = payout.status === 'paid' ? '#4ade80' : payout.status === 'processing' ? '#00d4ff' : '#ffd700';
                return (
                  <div key={payout.id} className="grid grid-cols-12 gap-2 items-center px-5 py-3 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <span className="col-span-4 text-sm text-white">{payout.recipient}</span>
                    <span className="col-span-2 text-xs text-white/45">{payout.place}</span>
                    <span className="col-span-3 text-xs" style={{ color: '#ffd700' }}>${payout.amount.toLocaleString()}</span>
                    <span className="col-span-3 text-right"><span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ color: statusColor, background: `${statusColor}15` }}>{payout.status}</span></span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}


        {/* Live Ops */}
        {activeTab === 'liveops' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
            <div>
              <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>Live Ops & Realtime Alerts</h1>
              <p className="text-white/40 text-sm">Phase 8 admin queue for realtime match reports, check-ins, bracket changes, and critical disputes.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Realtime Events', value: liveEventCount, color: '#00d4ff' },
                { label: 'Unhandled Alerts', value: activeAdminAlerts, color: '#ff4655' },
                { label: 'Unread Notices', value: NOTIFICATIONS.filter(n => !n.read).length, color: '#ffd700' },
                { label: 'Live Streams', value: TWITCH_STREAMS.filter(s => s.status === 'live').length, color: '#a855f7' },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                  <p className="text-xs text-white/40 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Admin Alert Queue</h3>
                  <p className="text-xs text-white/35">Mark alerts handled after reviewing the relevant match, payment, or webhook.</p>
                </div>
                {adminAlerts.map(alert => {
                  const color = alert.priority === 'critical' ? '#ff4655' : alert.priority === 'high' ? '#ffd700' : alert.priority === 'medium' ? '#00d4ff' : '#4ade80';
                  return (
                    <div key={alert.id} className="px-5 py-4 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-white" style={{ fontWeight: 600 }}>{alert.title}</p>
                          <p className="text-xs text-white/45 mt-1">{alert.message}</p>
                          <p className="text-[10px] text-white/25 mt-1 capitalize">{alert.source.replace('_', ' ')} · {new Date(alert.createdAt).toLocaleString()}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ color, background: `${color}15` }}>{alert.priority}</span>
                      </div>
                      <button onClick={() => resolveAlert(alert.id)} disabled={alert.handled}
                        className="mt-3 px-3 py-1.5 rounded-lg text-xs border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
                        style={{ color: alert.handled ? 'rgba(255,255,255,0.35)' : '#00d4ff', borderColor: 'rgba(255,255,255,0.1)' }}>
                        {alert.handled ? 'Handled' : 'Mark handled'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Realtime Event Feed</h3>
                  <p className="text-xs text-white/35">These records mirror what Supabase Realtime channels will emit later.</p>
                </div>
                {REALTIME_EVENTS.map(event => {
                  const color = event.severity === 'success' ? '#4ade80' : event.severity === 'warning' ? '#ffd700' : event.severity === 'danger' ? '#ff4655' : '#00d4ff';
                  const tournament = TOURNAMENTS.find(t => t.id === event.tournamentId);
                  return (
                    <div key={event.id} className="px-5 py-4 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-white" style={{ fontWeight: 600 }}>{event.title}</p>
                          <p className="text-xs text-white/45 mt-1">{event.message}</p>
                          <p className="text-[10px] text-white/25 mt-1">{tournament?.name ?? 'Platform'} {event.matchId ? `· Match ${event.matchId}` : ''}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ color, background: `${color}15` }}>{event.type}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Media Management */}
        {activeTab === 'media' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
            <div>
              <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>Media & Community Moderation</h1>
              <p className="text-white/40 text-sm">Phase 9 admin tools for featured clips, game hub content, and community moderation.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Media Posts', value: MEDIA_POSTS.length, color: '#a855f7' },
                { label: 'Featured Clips', value: MEDIA_POSTS.filter(post => post.featured).length, color: '#00d4ff' },
                { label: 'MLBB Clips', value: MEDIA_POSTS.filter(post => post.game === 'mlbb').length, color: '#4ade80' },
                { label: 'Pending Review', value: 3, color: '#ffd700' },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                  <p className="text-xs text-white/40 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div>
                  <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Featured Content Queue</h3>
                  <p className="text-xs text-white/35">Promote clips to game hubs, homepage, or tournament pages.</p>
                </div>
                <Link to="/media" className="text-xs hover:opacity-80" style={{ color: '#00d4ff' }}>Open gallery</Link>
              </div>
              {MEDIA_POSTS.slice(0, 8).map(post => {
                const game = GAMES.find(g => g.id === post.game);
                return (
                  <div key={post.id} className="grid grid-cols-12 gap-3 items-center px-5 py-4 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className={`col-span-2 sm:col-span-1 h-12 rounded-lg bg-gradient-to-br ${post.gradient}`} />
                    <div className="col-span-7 sm:col-span-8 min-w-0">
                      <p className="text-sm text-white truncate" style={{ fontWeight: 600 }}>{post.title}</p>
                      <p className="text-xs text-white/35">{game?.shortName} · {post.views} views · {post.tag}</p>
                    </div>
                    <div className="col-span-3 sm:col-span-3 text-right">
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: post.featured ? '#4ade80' : '#ffd700', background: post.featured ? 'rgba(74,222,128,0.12)' : 'rgba(255,215,0,0.12)' }}>{post.featured ? 'Featured' : 'Review'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Store */}
        {activeTab === 'store' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>Storefront Control</h1>
                <p className="text-white/40 text-sm">Phase 12 product catalog, order status, cart-ready products, and stock visibility.</p>
              </div>
              <Link to="/store" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white" style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
                Open Store
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Products', value: PRODUCTS.length, color: '#00d4ff' },
                { label: 'Store Revenue', value: `$${storeRevenue}`, color: '#ffd700' },
                { label: 'Low Stock', value: lowStockProducts, color: '#ff4655' },
                { label: 'Orders', value: STORE_ORDERS.length, color: '#4ade80' },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                  <p className="text-xs text-white/40 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Product Catalog</h3>
                </div>
                {PRODUCTS.map(product => (
                  <div key={product.id} className="grid grid-cols-12 gap-3 items-center px-5 py-3 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className={`col-span-2 sm:col-span-1 h-10 rounded-lg bg-gradient-to-br ${product.imageGradient}`} />
                    <div className="col-span-6 sm:col-span-7 min-w-0">
                      <p className="text-sm text-white truncate" style={{ fontWeight: 600 }}>{product.name}</p>
                      <p className="text-xs text-white/35 capitalize">{product.category.replace('_', ' ')} · {product.badge}</p>
                    </div>
                    <span className="col-span-2 text-xs" style={{ color: '#ffd700' }}>${product.price}</span>
                    <span className="col-span-2 text-right text-[10px] px-2 py-0.5 rounded-full" style={{ color: product.stock < 20 ? '#ff4655' : '#4ade80', background: product.stock < 20 ? 'rgba(255,70,85,0.12)' : 'rgba(74,222,128,0.12)' }}>{product.stock} left</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Recent Orders</h3>
                </div>
                {STORE_ORDERS.map(order => {
                  const color = order.status === 'completed' ? '#4ade80' : order.status === 'pending' ? '#ffd700' : order.status === 'paid' ? '#00d4ff' : '#a855f7';
                  return (
                    <div key={order.id} className="px-5 py-4 border-b last:border-0 flex items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div>
                        <p className="text-sm text-white" style={{ fontWeight: 600 }}>{order.customer}</p>
                        <p className="text-xs text-white/40">{order.items} item(s) · ${order.total}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ color, background: `${color}15` }}>{order.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Integrations */}
        {activeTab === 'integrations' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
            <div>
              <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>Discord & Twitch Integrations</h1>
              <p className="text-white/40 text-sm">Phase 10 configuration panel for webhooks, match announcements, role sync, and stream embeds.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Enabled Webhooks', value: enabledWebhookCount, color: '#5865f2' },
                { label: 'Twitch Channels', value: TWITCH_STREAMS.length, color: '#a855f7' },
                { label: 'Live Channels', value: TWITCH_STREAMS.filter(stream => stream.status === 'live').length, color: '#ff4655' },
                { label: 'Integration Logs', value: INTEGRATION_LOGS.length, color: '#00d4ff' },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                  <p className="text-xs text-white/40 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Discord Webhooks</h3>
                </div>
                {webhooks.map(hook => (
                  <div key={hook.id} className="px-5 py-4 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-white" style={{ fontWeight: 600 }}>{hook.name}</p>
                        <p className="text-xs text-white/40">{hook.channel} · {hook.event.replaceAll('_', ' ')}</p>
                      </div>
                      <button onClick={() => toggleWebhook(hook.id)} className="text-[10px] px-3 py-1 rounded-full" style={{ color: hook.enabled ? '#4ade80' : '#6b7280', background: hook.enabled ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.06)' }}>
                        {hook.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Twitch Streams</h3>
                </div>
                {TWITCH_STREAMS.map(stream => {
                  const tournament = TOURNAMENTS.find(t => t.id === stream.tournamentId);
                  const color = stream.status === 'live' ? '#ff4655' : stream.status === 'scheduled' ? '#ffd700' : '#6b7280';
                  return (
                    <div key={stream.id} className="px-5 py-4 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-white" style={{ fontWeight: 600 }}>{stream.channelName}</p>
                          <p className="text-xs text-white/40">{tournament?.name ?? stream.tournamentId}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ color, background: `${color}15` }}>{stream.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Integration Logs</h3>
              </div>
              {INTEGRATION_LOGS.map(log => {
                const color = log.status === 'success' ? '#4ade80' : log.status === 'warning' ? '#ffd700' : '#ff4655';
                return (
                  <div key={log.id} className="px-5 py-3 border-b last:border-0 flex items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div>
                      <p className="text-sm text-white" style={{ fontWeight: 600 }}>{log.action}</p>
                      <p className="text-xs text-white/40">{log.message}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ color, background: `${color}15` }}>{log.provider}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
            <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>Platform Analytics</h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Total Tournaments', value: PLATFORM_STATS.totalTournaments, color: '#00d4ff' },
                { label: 'Active Players', value: PLATFORM_STATS.activePlayers, color: '#a855f7' },
                { label: 'Prize Money', value: PLATFORM_STATS.totalPrizeMoney, color: '#ffd700' },
                { label: 'Teams', value: PLATFORM_STATS.teamsRegistered, color: '#4ade80' },
                { label: 'Matches', value: PLATFORM_STATS.matchesPlayed, color: '#f97316' },
                { label: 'Countries', value: PLATFORM_STATS.countriesRepresented, color: '#ff4655' },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl p-5 border text-center" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                  <p className="text-xs text-white/40 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2 rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Advanced Metrics</h3>
                  <p className="text-xs text-white/35">Phase 13 analytics for tournaments, store, sponsors, and operations.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5">
                  {ANALYTICS_METRICS.map(metric => (
                    <div key={metric.id} className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: `${metric.color}20` }}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-white/45">{metric.label}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: metric.trend === 'down' && metric.label.includes('Dispute') ? '#4ade80' : metric.color, background: `${metric.color}12` }}>{metric.change}</span>
                      </div>
                      <p className="mt-2" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.45rem', fontWeight: 700, color: metric.color }}>{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Revenue Mix</h3>
                </div>
                <div className="p-5 space-y-4">
                  {REVENUE_SNAPSHOTS.map(row => (
                    <div key={row.source}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white/60">{row.label}</span>
                        <span style={{ color: row.color }}>${row.amount.toLocaleString()}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${row.percentage}%`, background: row.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Phase 14 Readiness Checks</h3>
                <p className="text-xs text-white/35">Pre-deployment sanity list for local build, security, integrations, and payments.</p>
              </div>
              {ADMIN_HEALTH_CHECKS.map(check => {
                const color = check.status === 'healthy' ? '#4ade80' : check.status === 'warning' ? '#ffd700' : '#ff4655';
                return (
                  <div key={check.id} className="px-5 py-3 border-b last:border-0 flex items-start justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div>
                      <p className="text-sm text-white" style={{ fontWeight: 600 }}>{check.area}</p>
                      <p className="text-xs text-white/40">{check.message}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ color, background: `${color}15` }}>{check.status}</span>
                  </div>
                );
              })}
            </div>

            {/* Games breakdown */}
            <div className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <h3 className="text-sm text-white mb-5" style={{ fontWeight: 600 }}>Tournaments by Game</h3>
              <div className="space-y-3">
                {GAMES.map(game => {
                  const count = TOURNAMENTS.filter(t => t.game === game.id).length;
                  const pct = Math.round((count / TOURNAMENTS.length) * 100);
                  return (
                    <div key={game.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: game.color }}>{game.name}</span>
                        <span className="text-white/40">{count} tournaments</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${game.color}, ${game.secondaryColor})` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

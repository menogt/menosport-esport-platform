import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Trophy, Users, Calendar, Bell, CheckCircle, Clock, TrendingUp,
  Shield, Zap, Settings, LogOut, ChevronRight, Star, Target, Award
} from 'lucide-react';
import { TOURNAMENTS, TEAMS, MATCHES, PLAYERS, NOTIFICATIONS, GAMES } from '../data/dummy';

const PLAYER = PLAYERS[0];
const PLAYER_TEAM = TEAMS.find(t => t.id === PLAYER.teamId)!;
const PLAYER_GAME = GAMES.find(g => g.id === PLAYER_TEAM?.game)!;

const MATCH_STATUS_STYLE = {
  upcoming: { label: 'Scheduled', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  live: { label: 'LIVE', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  waiting_result: { label: 'Awaiting Result', color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
  disputed: { label: 'Disputed', color: '#ff4655', bg: 'rgba(255,70,85,0.12)' },
  completed: { label: 'Completed', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

type Tab = 'overview' | 'matches' | 'tournaments' | 'notifications';

const NAV_ITEMS = [
  { key: 'overview' as Tab, label: 'Overview', icon: Target },
  { key: 'matches' as Tab, label: 'My Matches', icon: Zap },
  { key: 'tournaments' as Tab, label: 'Tournaments', icon: Trophy },
  { key: 'notifications' as Tab, label: 'Notifications', icon: Bell },
];

export function PlayerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const unread = NOTIFICATIONS.filter(n => !n.read).length;
  const winRate = Math.round((PLAYER.wins / (PLAYER.wins + PLAYER.losses)) * 100);
  const playerMatches = MATCHES.filter(m => m.team1Id === PLAYER_TEAM?.id || m.team2Id === PLAYER_TEAM?.id);
  const joinedTournaments = TOURNAMENTS.filter(t => t.status !== 'upcoming').slice(0, 4);

  return (
    <div className="min-h-screen flex" style={{ background: '#08090f' }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(13,14,26,0.9)', paddingTop: '4rem' }}>
        {/* Profile */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 700 }}>
              {PLAYER.avatar}
            </div>
            <div>
              <p className="text-sm text-white" style={{ fontWeight: 600 }}>{PLAYER.username}</p>
              <p className="text-xs text-white/40">{PLAYER.realName}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full mt-0.5 inline-block" style={{ background: 'rgba(0,212,255,0.12)', color: '#00d4ff' }}>
                Player
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeTab === item.key ? 'text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
              style={activeTab === item.key ? { background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' } : {}}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.key === 'notifications' && unread > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full text-[10px] flex items-center justify-center text-white"
                  style={{ background: '#00d4ff', boxShadow: '0 0 8px rgba(0,212,255,0.4)' }}>
                  {unread}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom links */}
        <div className="p-4 border-t space-y-1" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
            <Settings className="w-4 h-4" /> Settings
          </button>
          <Link to="/login" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-20 lg:pt-6 px-4 sm:px-6 pb-12">
        {/* Mobile tab bar */}
        <div className="lg:hidden flex gap-1 mb-6 overflow-x-auto pb-1">
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all"
              style={activeTab === item.key
                ? { background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div>
              <h1 className="text-white mb-1" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>
                Welcome back, {PLAYER.username}
              </h1>
              <p className="text-white/40 text-sm">Season 4 is live. Check your upcoming matches.</p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 60 ? '#4ade80' : '#ffd700', icon: TrendingUp },
                { label: 'Total Wins', value: PLAYER.wins.toString(), color: '#00d4ff', icon: Trophy },
                { label: 'KDA Ratio', value: PLAYER.kda, color: '#a855f7', icon: Target },
                { label: 'Rank', value: PLAYER.rank, color: '#ffd700', icon: Star },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl p-4 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                    <span className="text-[10px] text-white/40">{stat.label}</span>
                  </div>
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Win/Loss bar */}
            <div className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-white" style={{ fontWeight: 600 }}>Season Record</span>
                <span className="text-sm" style={{ color: '#00d4ff', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
                  {PLAYER.wins}W – {PLAYER.losses}L
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden flex">
                <div className="h-full" style={{ width: `${winRate}%`, background: 'linear-gradient(90deg, #4ade80, #00d4ff)' }} />
                <div className="h-full flex-1 bg-white/10" />
              </div>
              <div className="flex justify-between text-xs text-white/30 mt-2">
                <span>{winRate}% Win Rate</span>
                <span>{PLAYER.wins + PLAYER.losses} games played</span>
              </div>
            </div>

            {/* Team card */}
            {PLAYER_TEAM && (
              <div className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-white" style={{ fontWeight: 600 }}>My Team</span>
                  <Link to="/dashboard/team" className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1">
                    Manage <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
                    style={{ background: `${PLAYER_GAME.color}20`, border: `1px solid ${PLAYER_GAME.color}30`, fontFamily: "'Rajdhani', sans-serif", fontSize: '1.1rem', fontWeight: 700 }}>
                    {PLAYER_TEAM.logo}
                  </div>
                  <div className="flex-1">
                    <p className="text-white" style={{ fontWeight: 600 }}>{PLAYER_TEAM.name}</p>
                    <p className="text-sm text-white/40">[{PLAYER_TEAM.tag}] · {PLAYER_TEAM.region} · {PLAYER_GAME.shortName}</p>
                    <p className="text-sm mt-1" style={{ color: PLAYER_GAME.color, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
                      Rank #{PLAYER_TEAM.rank} · {PLAYER_TEAM.points.toLocaleString()} pts
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40">Role</p>
                    <p className="text-sm text-white">{PLAYER.role}</p>
                    {PLAYER_TEAM.captain === PLAYER.id && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full mt-0.5 inline-block" style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700' }}>Captain</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming matches */}
            <div>
              <h2 className="text-white mb-3 flex items-center gap-2" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                <Clock className="w-4 h-4 text-white/40" /> Upcoming Matches
              </h2>
              <div className="space-y-2">
                {playerMatches.filter(m => m.status !== 'completed').slice(0, 3).map(m => {
                  const opp = TEAMS.find(t => t.id === (m.team1Id === PLAYER_TEAM?.id ? m.team2Id : m.team1Id));
                  const ms = MATCH_STATUS_STYLE[m.status];
                  return (
                    <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl border"
                      style={{ background: 'rgba(13,14,26,0.8)', borderColor: m.status === 'live' ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)' }}>
                      <div className="text-xs text-white/40 w-16 flex-shrink-0">
                        {new Date(m.scheduledTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        <br />{new Date(m.scheduledTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{PLAYER_TEAM?.name} vs {opp?.name ?? 'TBD'}</p>
                        <p className="text-xs text-white/40">{m.roundName}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: ms.color, background: ms.bg }}>{ms.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Matches tab */}
        {activeTab === 'matches' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
            <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.5rem', fontWeight: 700 }}>My Matches</h1>
            {playerMatches.map(m => {
              const opp = TEAMS.find(t => t.id === (m.team1Id === PLAYER_TEAM?.id ? m.team2Id : m.team1Id));
              const isHome = m.team1Id === PLAYER_TEAM?.id;
              const myScore = isHome ? m.score1 : m.score2;
              const oppScore = isHome ? m.score2 : m.score1;
              const won = m.winnerId === PLAYER_TEAM?.id;
              const ms = MATCH_STATUS_STYLE[m.status];
              return (
                <div key={m.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-xl border"
                  style={{ background: 'rgba(13,14,26,0.8)', borderColor: m.status === 'live' ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)' }}>
                  {m.status === 'completed' && (
                    <div className={`w-1 self-stretch rounded-full flex-shrink-0 hidden sm:block`} style={{ background: won ? '#4ade80' : '#ff4655' }} />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: ms.color, background: ms.bg }}>{ms.label}</span>
                      <span className="text-xs text-white/30">{m.roundName}</span>
                    </div>
                    <p className="text-sm text-white">{PLAYER_TEAM?.name} <span className="text-white/30">vs</span> {opp?.name ?? 'TBD'}</p>
                    <p className="text-xs text-white/40 mt-0.5">{new Date(m.scheduledTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {m.status === 'completed' && myScore !== null && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: won ? '#4ade80' : '#ff4655' }}>
                        {myScore} – {oppScore}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: won ? 'rgba(74,222,128,0.15)' : 'rgba(255,70,85,0.15)', color: won ? '#4ade80' : '#ff4655' }}>
                        {won ? 'WIN' : 'LOSS'}
                      </span>
                    </div>
                  )}
                  {m.status === 'waiting_result' && (
                    <button className="text-sm px-4 py-2 rounded-lg" style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}>
                      Submit Result
                    </button>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Tournaments tab */}
        {activeTab === 'tournaments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
            <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.5rem', fontWeight: 700 }}>My Tournaments</h1>
            {joinedTournaments.map(t => {
              const game = GAMES.find(g => g.id === t.game)!;
              return (
                <div key={t.id} className="flex items-center gap-4 p-5 rounded-xl border"
                  style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <div className={`h-12 w-1 rounded-full flex-shrink-0 bg-gradient-to-b ${t.coverGradient}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate" style={{ fontWeight: 600 }}>{t.name}</p>
                    <p className="text-xs text-white/40">{game.shortName} · {t.region}</p>
                    <p className="text-xs text-white/30 mt-0.5">{new Date(t.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40">Prize</p>
                    <p className="text-sm" style={{ color: '#ffd700', fontWeight: 600 }}>${t.prizePool.toLocaleString()}</p>
                  </div>
                  <Link to={`/tournaments/${t.id}`} className="flex-shrink-0">
                    <ChevronRight className="w-4 h-4 text-white/30 hover:text-white/60 transition-colors" />
                  </Link>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Notifications tab */}
        {activeTab === 'notifications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-2">
            <h1 className="text-white mb-4" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.5rem', fontWeight: 700 }}>Notifications</h1>
            {NOTIFICATIONS.map(n => (
              <div key={n.id} className={`p-4 rounded-xl border flex items-start gap-3 transition-colors cursor-pointer hover:bg-white/[0.02] ${n.read ? 'opacity-60' : ''}`}
                style={{ background: 'rgba(13,14,26,0.8)', borderColor: n.read ? 'rgba(255,255,255,0.07)' : 'rgba(0,212,255,0.15)' }}>
                {!n.read && <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00d4ff' }} />}
                {n.read && <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-transparent" />}
                <div className="flex-1">
                  <p className="text-sm text-white" style={{ fontWeight: 600 }}>{n.title}</p>
                  <p className="text-sm text-white/50 mt-0.5">{n.message}</p>
                  <p className="text-xs text-white/25 mt-1">{n.time}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}

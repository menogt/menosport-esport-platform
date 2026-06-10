import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Users, Trophy, Zap, Settings, LogOut, ChevronRight, Plus, Shield,
  Globe, Twitter, MessageSquare, Crown, UserPlus, Lock, Unlock, Star
} from 'lucide-react';
import { TEAMS, PLAYERS, GAMES, TOURNAMENTS, MATCHES } from '../data/dummy';

const TEAM = TEAMS[0];
const GAME = GAMES.find(g => g.id === TEAM.game)!;
const ROSTER = PLAYERS.filter(p => p.teamId === TEAM.id);
const TEAM_MATCHES = MATCHES.filter(m => m.team1Id === TEAM.id || m.team2Id === TEAM.id);
const TEAM_TOURNAMENTS = TOURNAMENTS.filter(t => t.status !== 'upcoming').slice(0, 3);

type Tab = 'roster' | 'tournaments' | 'stats' | 'settings';

const NAV_ITEMS = [
  { key: 'roster' as Tab, label: 'Roster', icon: Users },
  { key: 'tournaments' as Tab, label: 'Tournaments', icon: Trophy },
  { key: 'stats' as Tab, label: 'Statistics', icon: Zap },
  { key: 'settings' as Tab, label: 'Team Settings', icon: Settings },
];

export function TeamDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('roster');
  const [lineupLocked, setLineupLocked] = useState(false);
  const winRate = Math.round((TEAM.wins / (TEAM.wins + TEAM.losses)) * 100);

  return (
    <div className="min-h-screen flex" style={{ background: '#08090f' }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(13,14,26,0.9)', paddingTop: '4rem' }}>
        {/* Team identity */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-3"
            style={{ background: `linear-gradient(135deg, ${GAME.color}30, ${GAME.secondaryColor}20)`, border: `1px solid ${GAME.color}30`, fontFamily: "'Rajdhani', sans-serif", fontSize: '1.3rem', fontWeight: 700 }}>
            {TEAM.logo}
          </div>
          <p className="text-center text-sm text-white" style={{ fontWeight: 700 }}>{TEAM.name}</p>
          <p className="text-center text-xs text-white/40 mt-0.5">[{TEAM.tag}] · {TEAM.region}</p>
          <div className="flex justify-center gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${GAME.color}15`, color: GAME.color }}>{GAME.shortName}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,215,0,0.12)', color: '#ffd700' }}>Rank #{TEAM.rank}</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeTab === item.key ? 'text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
              style={activeTab === item.key ? { background: `${GAME.color}15`, border: `1px solid ${GAME.color}25`, color: GAME.color } : {}}>
              <item.icon className="w-4 h-4" />
              {item.label}
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
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all"
              style={activeTab === item.key
                ? { background: `${GAME.color}20`, color: GAME.color, border: `1px solid ${GAME.color}35` }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Roster */}
        {activeTab === 'roster' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>Team Roster</h1>
                <p className="text-white/40 text-sm">{ROSTER.length} players · {TEAM.region}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLineupLocked(!lineupLocked)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all border"
                  style={lineupLocked
                    ? { background: 'rgba(255,215,0,0.1)', borderColor: 'rgba(255,215,0,0.25)', color: '#ffd700' }
                    : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                  {lineupLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  {lineupLocked ? 'Lineup Locked' : 'Lock Lineup'}
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
                  <UserPlus className="w-3.5 h-3.5" /> Invite
                </button>
              </div>
            </div>

            {/* Roster cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {ROSTER.map(player => {
                const isCaptain = TEAM.captain === player.id;
                return (
                  <div key={player.id} className="rounded-2xl p-5 border relative overflow-hidden"
                    style={{ background: 'rgba(13,14,26,0.8)', borderColor: isCaptain ? `${GAME.color}30` : 'rgba(255,255,255,0.07)' }}>
                    {isCaptain && (
                      <div className="absolute top-3 right-3">
                        <Crown className="w-4 h-4" style={{ color: '#ffd700' }} />
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                        style={{ background: `${GAME.color}20`, border: `1px solid ${GAME.color}30`, fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 700 }}>
                        {player.avatar}
                      </div>
                      <div>
                        <p className="text-sm text-white" style={{ fontWeight: 600 }}>{player.username}</p>
                        <p className="text-xs text-white/40">{player.realName}</p>
                        {isCaptain && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,215,0,0.12)', color: '#ffd700' }}>Captain</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Role', value: player.role },
                        { label: 'KDA', value: player.kda },
                        { label: 'Rank', value: player.rank.split(' ')[0] },
                      ].map(stat => (
                        <div key={stat.label} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <p className="text-[9px] text-white/30">{stat.label}</p>
                          <p className="text-xs text-white/70 mt-0.5 truncate">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-white/40 mt-3">
                      <span>{player.wins}W {player.losses}L</span>
                      <span>{Math.round((player.wins / (player.wins + player.losses)) * 100)}% WR</span>
                    </div>
                  </div>
                );
              })}
              {/* Empty slot */}
              <div className="rounded-2xl p-5 border border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors min-h-44"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="w-10 h-10 rounded-xl border border-dashed flex items-center justify-center"
                  style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                  <Plus className="w-5 h-5 text-white/30" />
                </div>
                <span className="text-sm text-white/30">Add Player</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tournaments */}
        {activeTab === 'tournaments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
            <div className="flex items-center justify-between">
              <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>Tournaments</h1>
              <Link to="/tournaments" className="text-sm text-white/40 hover:text-white/70 flex items-center gap-1">
                Browse All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {TEAM_TOURNAMENTS.map(t => {
              const game = GAMES.find(g => g.id === t.game)!;
              const won = Math.random() > 0.5; // placeholder result
              return (
                <div key={t.id} className="flex items-center gap-4 p-5 rounded-xl border"
                  style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <div className={`h-12 w-1.5 rounded-full flex-shrink-0 bg-gradient-to-b ${t.coverGradient}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate" style={{ fontWeight: 600 }}>{t.name}</p>
                    <p className="text-xs text-white/40">{game.shortName} · {t.region} · {t.format.replace('_', ' ')}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-white/30">{new Date(t.startDate).toLocaleDateString()}</span>
                      <span className="text-xs text-white/30">→</span>
                      <span className="text-xs text-white/30">{new Date(t.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {t.status === 'completed' && (
                    <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ background: won ? 'rgba(74,222,128,0.12)' : 'rgba(107,114,128,0.1)', color: won ? '#4ade80' : '#6b7280' }}>
                      {won ? '1st Place' : 'Top 4'}
                    </span>
                  )}
                  {t.status === 'ongoing' && (
                    <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0 animate-pulse"
                      style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>
                      Active
                    </span>
                  )}
                  <Link to={`/tournaments/${t.id}`}>
                    <ChevronRight className="w-4 h-4 text-white/30 hover:text-white/60 transition-colors" />
                  </Link>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Stats */}
        {activeTab === 'stats' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
            <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>Team Statistics</h1>
            {/* Big stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Total Wins', value: TEAM.wins.toString(), color: '#4ade80' },
                { label: 'Total Losses', value: TEAM.losses.toString(), color: '#ff4655' },
                { label: 'Win Rate', value: `${winRate}%`, color: GAME.color },
                { label: 'World Rank', value: `#${TEAM.rank}`, color: '#ffd700' },
                { label: 'Points', value: TEAM.points.toLocaleString(), color: '#a855f7' },
                { label: 'Tournaments', value: TEAM_TOURNAMENTS.length.toString(), color: '#f97316' },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl p-5 border text-center"
                  style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '2rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                  <p className="text-xs text-white/40 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Win/loss bar */}
            <div className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-white" style={{ fontWeight: 600 }}>Overall Record</span>
                <span className="text-sm" style={{ color: GAME.color, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
                  {TEAM.wins}W – {TEAM.losses}L
                </span>
              </div>
              <div className="h-4 rounded-full overflow-hidden flex">
                <div className="h-full flex items-center justify-center text-[10px] text-white"
                  style={{ width: `${winRate}%`, background: 'linear-gradient(90deg, #4ade80, #00d4ff)' }}>
                  {winRate}%
                </div>
                <div className="h-full flex-1 flex items-center justify-center text-[10px] text-white/40"
                  style={{ background: 'rgba(255,70,85,0.15)' }}>
                  {100 - winRate}%
                </div>
              </div>
            </div>

            {/* Match history */}
            <div>
              <h2 className="text-sm text-white mb-3" style={{ fontWeight: 600 }}>Recent Matches</h2>
              <div className="space-y-2">
                {TEAM_MATCHES.map(m => {
                  const opp = TEAMS.find(t => t.id === (m.team1Id === TEAM.id ? m.team2Id : m.team1Id));
                  const isHome = m.team1Id === TEAM.id;
                  const myScore = isHome ? m.score1 : m.score2;
                  const oppScore = isHome ? m.score2 : m.score1;
                  const won = m.winnerId === TEAM.id;
                  return (
                    <div key={m.id} className="flex items-center gap-4 p-3 rounded-xl border"
                      style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="w-1 h-8 rounded-full flex-shrink-0"
                        style={{ background: m.status === 'completed' ? (won ? '#4ade80' : '#ff4655') : '#6b7280' }} />
                      <div className="flex-1">
                        <p className="text-xs text-white">{TEAM.name} vs {opp?.name ?? 'TBD'}</p>
                        <p className="text-[10px] text-white/30">{m.roundName}</p>
                      </div>
                      {m.status === 'completed' && myScore !== null && (
                        <span className="text-sm" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: won ? '#4ade80' : '#ff4655' }}>
                          {myScore}–{oppScore}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6 max-w-lg">
            <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>Team Settings</h1>

            {/* Team banner */}
            <div className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <h3 className="text-sm text-white mb-4" style={{ fontWeight: 600 }}>Team Identity</h3>
              <div className="space-y-4">
                {[
                  { label: 'Team Name', value: TEAM.name, type: 'text' },
                  { label: 'Team Tag', value: TEAM.tag, type: 'text' },
                  { label: 'Region', value: TEAM.region, type: 'text' },
                ].map(field => (
                  <div key={field.label}>
                    <label className="block text-xs text-white/40 mb-1">{field.label}</label>
                    <input defaultValue={field.value}
                      className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Social links */}
            <div className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <h3 className="text-sm text-white mb-4" style={{ fontWeight: 600 }}>Social Links</h3>
              <div className="space-y-3">
                {[
                  { label: 'Twitter / X', placeholder: '@yourteam', icon: Twitter },
                  { label: 'Discord', placeholder: 'discord.gg/yourserver', icon: MessageSquare },
                  { label: 'Website', placeholder: 'https://yourteam.com', icon: Globe },
                ].map(field => (
                  <div key={field.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <field.icon className="w-4 h-4 text-white/40" />
                    </div>
                    <input placeholder={field.placeholder}
                      className="flex-1 px-4 py-2 rounded-xl text-sm text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full py-3 rounded-xl text-sm text-white" style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
              Save Changes
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}

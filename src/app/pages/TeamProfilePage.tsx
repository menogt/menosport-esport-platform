import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Crown, Twitter, MessageSquare, Globe, Trophy, TrendingUp, Shield, UserPlus, ChevronRight } from 'lucide-react';
import { TEAMS, PLAYERS, GAMES, TOURNAMENTS, MATCHES } from '../data/dummy';
import { useAuth } from '../context/AuthContext';

type Tab = 'overview' | 'roster' | 'history';

export function TeamProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const team = TEAMS.find(t => t.id === id);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [requested, setRequested] = useState(false);

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40">Team not found.</p>
          <Link to="/teams" className="text-sm mt-3 inline-block" style={{ color: '#00d4ff' }}>← Back to Teams</Link>
        </div>
      </div>
    );
  }

  const game = GAMES.find(g => g.id === team.game)!;
  const roster = PLAYERS.filter(p => team.members.includes(p.id));
  const teamMatches = MATCHES.filter(m => m.team1Id === team.id || m.team2Id === team.id);
  const winRate = Math.round((team.wins / (team.wins + team.losses)) * 100);
  const isMember = user?.teamId === team.id;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'roster', label: `Roster (${roster.length})` },
    { key: 'history', label: 'Match History' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-20">
      {/* Banner */}
      <div className="h-48 sm:h-60 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${game.color}20, ${game.secondaryColor}10, rgba(8,9,15,0.8))` }}>
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090f] via-transparent to-transparent" />
        <Link to="/teams" className="absolute top-6 left-4 flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Teams
        </Link>
        {/* Big team logo in banner */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10"
          style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '8rem', fontWeight: 700, color: game.color, letterSpacing: '-0.05em' }}>
          {team.logo}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Team header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-8 mb-8">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${game.color}30, ${game.secondaryColor}20)`, border: `2px solid ${game.color}40`, fontFamily: "'Rajdhani', sans-serif", fontSize: '1.6rem', fontWeight: 700, boxShadow: `0 0 24px ${game.color}20` }}>
              {team.logo}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${game.color}15`, color: game.color }}>{game.shortName}</span>
                <span className="text-xs px-2 py-0.5 rounded-full text-white/50" style={{ background: 'rgba(255,255,255,0.06)' }}>{team.region}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,215,0,0.12)', color: '#ffd700' }}>Rank #{team.rank}</span>
              </div>
              <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 700 }}>
                {team.name}
              </h1>
              <p className="text-white/40 text-sm">[{team.tag}]</p>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Social links */}
            {team.social.twitter && (
              <a href={team.social.twitter} className="w-9 h-9 rounded-lg flex items-center justify-center border text-white/50 hover:text-white hover:bg-white/5 transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <Twitter className="w-4 h-4" />
              </a>
            )}
            {team.social.discord && (
              <a href={team.social.discord} className="w-9 h-9 rounded-lg flex items-center justify-center border text-white/50 hover:text-white hover:bg-white/5 transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <MessageSquare className="w-4 h-4" />
              </a>
            )}
            {!isMember && isAuthenticated && (
              <button onClick={() => setRequested(true)} disabled={requested}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-60"
                style={requested
                  ? { background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }
                  : { background: 'linear-gradient(135deg, #00d4ff, #0066ff)', color: 'white', fontWeight: 600, boxShadow: '0 0 16px rgba(0,212,255,0.2)' }}>
                <UserPlus className="w-3.5 h-3.5" />
                {requested ? 'Request Sent' : 'Request to Join'}
              </button>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 60 ? '#4ade80' : '#ffd700', icon: TrendingUp },
            { label: 'Wins', value: team.wins.toString(), color: '#4ade80', icon: Trophy },
            { label: 'Losses', value: team.losses.toString(), color: '#ff4655', icon: Shield },
            { label: 'Points', value: team.points.toLocaleString(), color: game.color, icon: Trophy },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl p-4 border text-center" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b overflow-x-auto" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-4 py-3 text-sm whitespace-nowrap transition-all relative"
              style={{ color: activeTab === tab.key ? game.color : 'rgba(255,255,255,0.4)' }}>
              {tab.label}
              {activeTab === tab.key && (
                <motion.div layoutId="team-tab" className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: game.color }} />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Win/loss bar */}
            <div className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-white" style={{ fontWeight: 600 }}>Season Record</span>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: game.color }}>{team.wins}W – {team.losses}L</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden flex">
                <div style={{ width: `${winRate}%`, background: `linear-gradient(90deg, ${game.color}, ${game.secondaryColor})` }} />
                <div className="flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>
              <div className="flex justify-between text-xs text-white/30 mt-2">
                <span style={{ color: game.color }}>{winRate}% Win Rate</span>
                <span>{team.wins + team.losses} matches played</span>
              </div>
            </div>

            {/* Top players preview */}
            <div className="rounded-xl border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <span className="text-sm text-white" style={{ fontWeight: 600 }}>Roster</span>
                <button onClick={() => setActiveTab('roster')} className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1">
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {roster.slice(0, 3).map(p => {
                const isCaptain = team.captain === p.id;
                return (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white flex-shrink-0"
                      style={{ background: `${game.color}20`, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
                      {p.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-white" style={{ fontWeight: 600 }}>{p.username}</span>
                        {isCaptain && <Crown className="w-3 h-3" style={{ color: '#ffd700' }} />}
                      </div>
                      <span className="text-xs text-white/40">{p.role}</span>
                    </div>
                    <span className="text-xs text-white/40">{p.rank}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'roster' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roster.map(p => {
              const isCaptain = team.captain === p.id;
              const wr = Math.round((p.wins / (p.wins + p.losses)) * 100);
              return (
                <div key={p.id} className="rounded-2xl p-5 border relative" style={{ background: 'rgba(13,14,26,0.8)', borderColor: isCaptain ? `${game.color}25` : 'rgba(255,255,255,0.07)' }}>
                  {isCaptain && <Crown className="absolute top-3.5 right-3.5 w-4 h-4" style={{ color: '#ffd700' }} />}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                      style={{ background: `${game.color}20`, border: `1px solid ${game.color}30`, fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 700 }}>
                      {p.avatar}
                    </div>
                    <div>
                      <p className="text-sm text-white" style={{ fontWeight: 600 }}>{p.username}</p>
                      <p className="text-xs text-white/40">{p.realName}</p>
                      {isCaptain && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,215,0,0.12)', color: '#ffd700' }}>Captain</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <p className="text-[9px] text-white/30">Role</p>
                      <p className="text-white/70 mt-0.5 truncate">{p.role}</p>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <p className="text-[9px] text-white/30">KDA</p>
                      <p className="text-white/70 mt-0.5">{p.kda}</p>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <p className="text-[9px] text-white/30">WR%</p>
                      <p style={{ color: wr >= 60 ? '#4ade80' : '#ffd700' }}>{wr}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {roster.length === 0 && (
              <div className="col-span-2 text-center py-12 text-white/30">No roster data available.</div>
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {teamMatches.map(m => {
              const opp = TEAMS.find(t => t.id === (m.team1Id === team.id ? m.team2Id : m.team1Id));
              const isHome = m.team1Id === team.id;
              const myScore = isHome ? m.score1 : m.score2;
              const oppScore = isHome ? m.score2 : m.score1;
              const won = m.winnerId === team.id;
              return (
                <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: m.status === 'completed' ? (won ? '#4ade80' : '#ff4655') : '#6b7280' }} />
                  <div className="flex-1">
                    <p className="text-sm text-white">{team.name} vs {opp?.name ?? 'TBD'}</p>
                    <p className="text-xs text-white/40">{m.roundName} · {new Date(m.scheduledTime).toLocaleDateString()}</p>
                  </div>
                  {m.status === 'completed' && myScore !== null && (
                    <span className="text-sm" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: won ? '#4ade80' : '#ff4655' }}>
                      {myScore}–{oppScore} {won ? 'W' : 'L'}
                    </span>
                  )}
                  {m.status === 'live' && (
                    <span className="text-xs px-2 py-0.5 rounded-full animate-pulse" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>LIVE</span>
                  )}
                </div>
              );
            })}
            {teamMatches.length === 0 && (
              <p className="text-center py-12 text-white/30">No match history.</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

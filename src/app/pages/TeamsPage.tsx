import { useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Trophy, TrendingUp, ChevronRight, Plus, Crown, Globe } from 'lucide-react';
import { TEAMS, GAMES } from '../data/dummy';
import { useAuth } from '../context/AuthContext';
import type { GameId } from '../data/dummy';

const REGION_FILTERS = ['All', 'SEA', 'EU', 'NA', 'LATAM', 'APAC', 'SA'];

export function TeamsPage() {
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState<'all' | GameId>('all');
  const [regionFilter, setRegionFilter] = useState('All');

  const filtered = TEAMS.filter(t => {
    if (gameFilter !== 'all' && t.game !== gameFilter) return false;
    if (regionFilter !== 'All' && t.region !== regionFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.tag.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-10">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-white mb-2" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, letterSpacing: '0.02em' }}>
              TEAMS
            </h1>
            <p className="text-white/40">Elite squads competing across all titles.</p>
          </div>
          {isAuthenticated && (
            <Link to="/teams/create"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600, boxShadow: '0 0 16px rgba(0,212,255,0.2)' }}>
              <Plus className="w-4 h-4" /> Create Team
            </Link>
          )}
        </div>
      </motion.div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or tag..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
      </div>

      {/* Game filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={() => setGameFilter('all')}
          className="px-4 py-1.5 rounded-full text-sm transition-all"
          style={gameFilter === 'all'
            ? { background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }
            : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
          All Games
        </button>
        {GAMES.map(g => (
          <button key={g.id} onClick={() => setGameFilter(g.id as GameId)}
            className="px-4 py-1.5 rounded-full text-sm transition-all"
            style={gameFilter === g.id
              ? { background: `${g.color}20`, color: g.color, border: `1px solid ${g.color}40` }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {g.shortName}
          </button>
        ))}
      </div>

      {/* Region filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {REGION_FILTERS.map(r => (
          <button key={r} onClick={() => setRegionFilter(r)}
            className="px-3 py-1 rounded-full text-xs transition-all"
            style={regionFilter === r
              ? { background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }
              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {r}
          </button>
        ))}
      </div>

      <p className="text-xs text-white/30 mb-5">{filtered.length} team{filtered.length !== 1 ? 's' : ''}</p>

      {/* Global leaderboard table */}
      <div className="rounded-2xl border overflow-hidden mb-8" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b text-[10px] text-white/30" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <span className="col-span-1">#</span>
          <span className="col-span-5">Team</span>
          <span className="col-span-2 text-center hidden sm:block">Game</span>
          <span className="col-span-1 text-center hidden sm:block">W</span>
          <span className="col-span-1 text-center hidden sm:block">L</span>
          <span className="col-span-1 text-center hidden sm:block">WR%</span>
          <span className="col-span-2 text-right">Points</span>
        </div>
        <AnimatePresence mode="popLayout">
          {filtered.map((team, i) => {
            const game = GAMES.find(g => g.id === team.game)!;
            const wr = Math.round((team.wins / (team.wins + team.losses)) * 100);
            return (
              <motion.div key={team.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}>
                <Link to={`/teams/${team.id}`}
                  className="grid grid-cols-12 gap-2 items-center px-5 py-3.5 border-b hover:bg-white/[0.025] transition-colors group"
                  style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <span className="col-span-1 text-sm" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.25)' }}>
                    {team.rank}
                  </span>
                  <div className="col-span-5 sm:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs text-white flex-shrink-0"
                      style={{ background: `${game.color}20`, border: `1px solid ${game.color}30`, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
                      {team.logo}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate" style={{ fontWeight: 600 }}>{team.name}</p>
                      <p className="text-xs text-white/40">[{team.tag}] · {team.region}</p>
                    </div>
                  </div>
                  <span className="col-span-2 text-center text-xs hidden sm:block" style={{ color: game.color }}>{game.shortName}</span>
                  <span className="col-span-1 text-center text-xs hidden sm:block" style={{ color: '#4ade80', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{team.wins}</span>
                  <span className="col-span-1 text-center text-xs hidden sm:block" style={{ color: '#ff4655', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{team.losses}</span>
                  <div className="col-span-1 hidden sm:flex items-center justify-center gap-1">
                    <div className="w-10 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${wr}%`, background: wr >= 60 ? '#4ade80' : wr >= 45 ? '#ffd700' : '#ff4655' }} />
                    </div>
                  </div>
                  <div className="col-span-6 sm:col-span-2 flex items-center justify-end gap-2">
                    <span className="text-sm" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: game.color }}>{team.points.toLocaleString()}</span>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No teams match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

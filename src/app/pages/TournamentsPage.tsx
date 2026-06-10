import { useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Search, Filter, ChevronRight, Users, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import { TOURNAMENTS, GAMES } from '../data/dummy';
import type { GameId, TournamentStatus, TournamentFormat } from '../data/dummy';

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  registration: { label: 'Open', color: '#00d4ff', bg: 'rgba(0,212,255,0.15)' },
  ongoing: { label: 'Live', color: '#4ade80', bg: 'rgba(74,222,128,0.15)' },
  completed: { label: 'Ended', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
};

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elimination: 'Single Elim.',
  double_elimination: 'Double Elim.',
  round_robin: 'Round Robin',
  swiss: 'Swiss',
};

const STATUS_FILTERS: { key: 'all' | TournamentStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'ongoing', label: 'Live' },
  { key: 'registration', label: 'Open' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Ended' },
];

const GAME_FILTERS: { key: 'all' | GameId; label: string }[] = [
  { key: 'all', label: 'All Games' },
  ...GAMES.map(g => ({ key: g.id as GameId, label: g.shortName })),
];

export function TournamentsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | TournamentStatus>('all');
  const [gameFilter, setGameFilter] = useState<'all' | GameId>('all');
  const [search, setSearch] = useState('');

  const filtered = TOURNAMENTS.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (gameFilter !== 'all' && t.game !== gameFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-10">
        <h1 className="text-white mb-2" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, letterSpacing: '0.02em' }}>
          TOURNAMENTS
        </h1>
        <p className="text-white/40">Find your next competition across all game titles and regions.</p>
      </motion.div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tournaments..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
        <Link to="/tournaments/create"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 16px rgba(0,212,255,0.2)', fontWeight: 600 }}>
          <Trophy className="w-4 h-4" /> Host Tournament
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className="px-4 py-1.5 rounded-full text-sm transition-all duration-200"
            style={statusFilter === f.key
              ? { background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {f.label}
          </button>
        ))}
        <div className="w-px bg-white/10 mx-1" />
        {GAME_FILTERS.map(f => {
          const game = GAMES.find(g => g.id === f.key);
          return (
            <button
              key={f.key}
              onClick={() => setGameFilter(f.key)}
              className="px-4 py-1.5 rounded-full text-sm transition-all duration-200"
              style={gameFilter === f.key
                ? { background: `${game?.color ?? '#00d4ff'}20`, color: game?.color ?? '#00d4ff', border: `1px solid ${game?.color ?? '#00d4ff'}40` }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-xs text-white/30 mb-6">{filtered.length} tournament{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-24"
          >
            <Trophy className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30">No tournaments match your filters.</p>
          </motion.div>
        ) : (
          <motion.div key="grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t, i) => {
              const game = GAMES.find(g => g.id === t.game)!;
              const status = STATUS_CONFIG[t.status];
              const fill = Math.round((t.registeredTeams / t.maxTeams) * 100);
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  whileHover={{ y: -4 }}
                  className="group rounded-2xl overflow-hidden border"
                  style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}
                >
                  {/* Gradient stripe */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${t.coverGradient}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ color: status.color, background: status.bg }}>
                        {t.status === 'ongoing' && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: status.color }} />}
                        {status.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-md text-white/50" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          {game.shortName}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md text-white/40" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          {FORMAT_LABELS[t.format]}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-white mb-1 leading-snug" style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t.name}</h3>
                    <p className="text-xs text-white/40 mb-4">{t.region} · Hosted by {t.organizer}</p>

                    <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                      <div className="flex items-center gap-1.5 text-white/50">
                        <DollarSign className="w-3 h-3 flex-shrink-0" />
                        <span style={{ color: '#ffd700', fontWeight: 600 }}>${t.prizePool.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/50">
                        <Users className="w-3 h-3 flex-shrink-0" />
                        <span>{t.registeredTeams}/{t.maxTeams}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/50">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span>{new Date(t.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Fill bar */}
                    <div className="mb-4">
                      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${fill}%`, background: `linear-gradient(90deg, ${game.color}, ${game.secondaryColor})` }} />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/tournaments/${t.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm text-white transition-all duration-200 group-hover:gap-2"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        View <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      {(t.status === 'registration') && (
                        <Link to={`/tournaments/${t.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm text-white"
                          style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
                          Register
                        </Link>
                      )}
                      {t.status === 'ongoing' && (
                        <Link to={`/brackets/${t.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm"
                          style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)', fontWeight: 600 }}>
                          Bracket
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

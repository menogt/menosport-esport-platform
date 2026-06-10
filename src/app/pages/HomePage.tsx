import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Trophy, Users, Zap, ArrowRight, Circle, Globe, Gamepad2,
  ChevronRight, Star, TrendingUp, Shield, Play, ExternalLink
} from 'lucide-react';
import { TOURNAMENTS, TEAMS, GAMES, SPONSORS, PLATFORM_STATS, LIVE_MATCHES, MATCHES } from '../data/dummy';

const GAME_COLORS: Record<string, string> = {
  mlbb: '#00d4ff',
  valorant: '#ff4655',
  freefire: '#ffd700',
  codm: '#4ade80',
};

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  registration: { label: 'Registration Open', color: '#00d4ff', bg: 'rgba(0,212,255,0.15)' },
  ongoing: { label: 'Live', color: '#4ade80', bg: 'rgba(74,222,128,0.15)' },
  completed: { label: 'Completed', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
};

function TournamentCard({ tournament }: { tournament: typeof TOURNAMENTS[0] }) {
  const game = GAMES.find(g => g.id === tournament.game)!;
  const status = STATUS_CONFIG[tournament.status];
  const fill = Math.round((tournament.registeredTeams / tournament.maxTeams) * 100);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-2xl overflow-hidden border"
      style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      {/* Gradient header */}
      <div className={`h-2 w-full bg-gradient-to-r ${tournament.coverGradient}`} />

      <div className="p-5">
        {/* Status + Game */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ color: status.color, background: status.bg }}>
            {tournament.status === 'ongoing' && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: status.color }} />}
            {status.label}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md text-white/50" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {game.shortName}
          </span>
        </div>

        <h3 className="text-white mb-1 leading-tight" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
          {tournament.name}
        </h3>
        <p className="text-xs text-white/40 mb-4">{tournament.region} · {tournament.organizer}</p>

        {/* Prize + Fee */}
        <div className="flex gap-4 mb-4">
          <div>
            <p className="text-[10px] text-white/40 mb-0.5">Prize Pool</p>
            <p className="text-sm text-white" style={{ color: '#ffd700', fontWeight: 600 }}>
              ${tournament.prizePool.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 mb-0.5">Entry Fee</p>
            <p className="text-sm text-white/80">
              {tournament.entryFee === 0 ? 'Free' : `$${tournament.entryFee}`}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 mb-0.5">Format</p>
            <p className="text-xs text-white/60 capitalize">{tournament.format.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Registration fill */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/40">Teams Registered</span>
            <span className="text-[10px] text-white/60">{tournament.registeredTeams}/{tournament.maxTeams}</span>
          </div>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${fill}%`, background: `linear-gradient(90deg, ${game.color}, ${game.secondaryColor})` }} />
          </div>
        </div>

        <Link to={`/tournaments/${tournament.id}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm text-white transition-all duration-200 group-hover:gap-3"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          View Tournament <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}

function MatchLiveCard({ match }: { match: typeof LIVE_MATCHES[0] }) {
  const team1 = TEAMS.find(t => t.id === match.team1Id);
  const team2 = TEAMS.find(t => t.id === match.team2Id);
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="flex-shrink-0 w-72 rounded-2xl p-4 border"
      style={{ background: 'rgba(13,14,26,0.9)', borderColor: 'rgba(74,222,128,0.2)', boxShadow: '0 0 20px rgba(74,222,128,0.05)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4ade80' }} />
        <span className="text-xs" style={{ color: '#4ade80' }}>LIVE</span>
        <span className="text-xs text-white/40 ml-auto">{match.tournamentName}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm mb-1"
            style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
            {team1?.logo}
          </div>
          <p className="text-xs text-white/70 truncate w-14">{team1?.tag}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
              {match.score1 ?? '—'}
            </span>
            <span className="text-white/20">:</span>
            <span className="text-2xl text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
              {match.score2 ?? '—'}
            </span>
          </div>
          <span className="text-[10px] text-white/30">{match.roundName}</span>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm mb-1"
            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
            {team2?.logo}
          </div>
          <p className="text-xs text-white/70 truncate w-14">{team2?.tag}</p>
        </div>
      </div>
    </motion.div>
  );
}

function GameCard({ game }: { game: typeof GAMES[0] }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: 'rgba(13,14,26,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${game.color}, ${game.secondaryColor})` }} />
      <div className="p-5">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4"
          style={{
            background: `linear-gradient(135deg, ${game.color}22, ${game.secondaryColor}22)`,
            border: `1px solid ${game.color}33`,
          }}>
          <Gamepad2 className="w-7 h-7" style={{ color: game.color }} />
        </div>
        <h3 className="text-white mb-1" style={{ fontSize: '0.95rem', fontWeight: 600 }}>{game.name}</h3>
        <p className="text-xs text-white/40 mb-4">{game.genre}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-white/40">Active Players</p>
            <p className="text-sm text-white/80">{game.activePlayers}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/40">Tournaments</p>
            <p className="text-sm" style={{ color: game.color }}>{game.tournaments}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t flex items-center justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="text-xs text-white/40">View Hub</span>
          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}

const STAT_ITEMS = [
  { label: 'Total Tournaments', value: PLATFORM_STATS.totalTournaments.toString(), icon: Trophy, color: '#00d4ff' },
  { label: 'Active Players', value: PLATFORM_STATS.activePlayers, icon: Users, color: '#a855f7' },
  { label: 'Prize Money Awarded', value: PLATFORM_STATS.totalPrizeMoney, icon: TrendingUp, color: '#ffd700' },
  { label: 'Teams Registered', value: PLATFORM_STATS.teamsRegistered, icon: Shield, color: '#4ade80' },
  { label: 'Matches Played', value: PLATFORM_STATS.matchesPlayed, icon: Zap, color: '#f97316' },
  { label: 'Countries', value: PLATFORM_STATS.countriesRepresented.toString(), icon: Globe, color: '#ff4655' },
];

export function HomePage() {
  const activeTournaments = TOURNAMENTS.filter(t => t.status !== 'completed').slice(0, 6);
  const topTeams = TEAMS.slice(0, 5);

  return (
    <div>
      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
        {/* Radial glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8"
            style={{ borderColor: 'rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.08)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00d4ff' }} />
            <span className="text-xs" style={{ color: '#00d4ff', letterSpacing: '0.08em' }}>
              SEASON 4 NOW LIVE · {PLATFORM_STATS.totalTournaments} TOURNAMENTS HOSTED
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white leading-none mb-6"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 'clamp(2.8rem, 8vw, 6rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            THE FUTURE OF
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              ESPORTS COMPETITION
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/50 mb-10 max-w-2xl mx-auto"
            style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', lineHeight: 1.7 }}
          >
            Compete in world-class tournaments, build elite teams, track live brackets, and claim your glory. ArenaX is where champions are made.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link to="/tournaments"
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-white transition-all duration-200 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 30px rgba(0,212,255,0.3)', fontSize: '0.95rem', fontWeight: 600 }}>
              <Trophy className="w-4 h-4" />
              Join Tournament
            </Link>
            <Link to="/dashboard/team"
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-white/80 hover:text-white transition-all duration-200 hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.95rem' }}>
              <Users className="w-4 h-4" />
              Create Team
            </Link>
            <Link to="/brackets/trn1"
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-white/80 hover:text-white transition-all duration-200 hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.95rem' }}>
              <Zap className="w-4 h-4" />
              View Brackets
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-8 mt-20"
          >
            {[
              { v: PLATFORM_STATS.activePlayers, l: 'Active Players' },
              { v: PLATFORM_STATS.totalPrizeMoney, l: 'Prize Money' },
              { v: PLATFORM_STATS.teamsRegistered, l: 'Teams' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: '#00d4ff' }}>{s.v}</p>
                <p className="text-xs text-white/40 mt-0.5">{s.l}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1"
            style={{ borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </motion.div>
        </div>
      </section>

      {/* ─── LIVE MATCHES ───────────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#4ade80' }} />
          <h2 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.04em' }}>
            LIVE RIGHT NOW
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>
            {LIVE_MATCHES.length} Match Live
          </span>
          <Link to="/tournaments" className="ml-auto text-sm text-white/40 hover:text-white/70 flex items-center gap-1">
            All Matches <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {LIVE_MATCHES.map(m => (
            <MatchLiveCard key={m.id} match={m} />
          ))}
          {/* Upcoming match preview */}
          {MATCHES.filter(m => m.status === 'upcoming').slice(0, 2).map(m => {
            const t1 = TEAMS.find(t => t.id === m.team1Id);
            const t2 = TEAMS.find(t => t.id === m.team2Id);
            return (
              <motion.div key={m.id} whileHover={{ scale: 1.02 }}
                className="flex-shrink-0 w-72 rounded-2xl p-4 border"
                style={{ background: 'rgba(13,14,26,0.9)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Circle className="w-3 h-3 text-white/30" />
                  <span className="text-xs text-white/30">Upcoming</span>
                  <span className="text-xs text-white/30 ml-auto">{m.roundName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm mb-1"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
                      {t1?.logo ?? '?'}
                    </div>
                    <p className="text-xs text-white/50">{t1?.tag ?? 'TBD'}</p>
                  </div>
                  <span className="text-white/20 text-sm">vs</span>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm mb-1"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
                      {t2?.logo ?? '?'}
                    </div>
                    <p className="text-xs text-white/50">{t2?.tag ?? 'TBD'}</p>
                  </div>
                </div>
                <p className="text-center text-[10px] text-white/30 mt-2">
                  {new Date(m.scheduledTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── UPCOMING TOURNAMENTS ───────────────────────────────────────────── */}
      <section className="py-8 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-white mb-1" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700, letterSpacing: '0.03em' }}>
              TOURNAMENTS
            </h2>
            <p className="text-sm text-white/40">Compete for real prize pools across all major titles</p>
          </div>
          <Link to="/tournaments"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white transition-colors border"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTournaments.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <TournamentCard tournament={t} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── PLATFORM STATS ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="rounded-2xl p-8 relative overflow-hidden"
          style={{ background: 'rgba(13,14,26,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `linear-gradient(rgba(0,212,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.02) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />
          <div className="relative z-10">
            <div className="text-center mb-10">
              <h2 className="text-white mb-2" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>
                THE NUMBERS SPEAK
              </h2>
              <p className="text-white/40 text-sm">Platform stats across all games and regions</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {STAT_ITEMS.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="text-center"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <p className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED GAMES ─────────────────────────────────────────────────── */}
      <section className="py-8 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-white mb-1" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700, letterSpacing: '0.03em' }}>
              GAME HUBS
            </h2>
            <p className="text-sm text-white/40">Deep-dive into your favorite title</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <GameCard game={game} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── TOP TEAMS ──────────────────────────────────────────────────────── */}
      <section className="py-8 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-white mb-1" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>
              TOP TEAMS
            </h2>
            <p className="text-sm text-white/40">Ranked by tournament performance</p>
          </div>
          <Link to="/teams" className="flex items-center gap-1 text-sm text-white/40 hover:text-white/70">
            All Teams <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="rounded-2xl border overflow-hidden"
          style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
          {topTeams.map((team, i) => {
            const game = GAMES.find(g => g.id === team.game)!;
            const winRate = Math.round((team.wins / (team.wins + team.losses)) * 100);
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="flex items-center gap-4 px-5 py-4 border-b hover:bg-white/[0.02] transition-colors cursor-pointer"
                style={{ borderColor: i < topTeams.length - 1 ? 'rgba(255,255,255,0.05)' : 'transparent' }}
              >
                <span className="w-6 text-center text-sm" style={{ color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.3)', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
                  #{team.rank}
                </span>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0"
                  style={{ background: `${game.color}20`, border: `1px solid ${game.color}30`, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
                  {team.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm" style={{ fontWeight: 600 }}>{team.name}</p>
                  <p className="text-xs text-white/40">{team.region} · {game.shortName}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-white/30 text-[10px]">W/L</p>
                    <p className="text-white/70 text-xs">{team.wins}W {team.losses}L</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/30 text-[10px]">Win Rate</p>
                    <p className="text-xs" style={{ color: winRate >= 60 ? '#4ade80' : winRate >= 45 ? '#ffd700' : '#ff4655' }}>{winRate}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/30 text-[10px]">Points</p>
                    <p className="text-xs" style={{ color: game.color }}>{team.points.toLocaleString()}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20" />
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── SPONSORS ───────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <p className="text-center text-xs text-white/30 mb-8" style={{ letterSpacing: '0.15em' }}>
          TRUSTED BY LEADING BRANDS
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {SPONSORS.map((sponsor, i) => (
            <motion.div
              key={sponsor.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border"
              style={{ borderColor: `${sponsor.color}20`, background: `${sponsor.color}08` }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
                style={{ background: `${sponsor.color}20`, color: sponsor.color, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
                {sponsor.logo}
              </div>
              <span className="text-sm text-white/60">{sponsor.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded text-white/30" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {sponsor.tier}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CTA BANNER ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center rounded-2xl p-12 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(124,58,237,0.1))', border: '1px solid rgba(0,212,255,0.2)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }} />
          <div className="relative z-10">
            <h2 className="text-white mb-4" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 700 }}>
              READY TO COMPETE?
            </h2>
            <p className="text-white/50 mb-8 max-w-lg mx-auto">
              Join thousands of players competing in tournaments across Mobile Legends, Valorant, Free Fire, and more.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register"
                className="flex items-center gap-2 px-8 py-4 rounded-xl text-white transition-all duration-200 hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 24px rgba(0,212,255,0.3)', fontWeight: 600 }}>
                <Zap className="w-4 h-4" />
                Create Account — It's Free
              </Link>
              <Link to="/tournaments"
                className="flex items-center gap-2 px-8 py-4 rounded-xl text-white/70 hover:text-white border transition-all duration-200"
                style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                Browse Tournaments <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

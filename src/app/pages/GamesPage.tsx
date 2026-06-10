import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Users, Trophy, ChevronRight, Gamepad2, Zap } from 'lucide-react';
import { GAMES, TOURNAMENTS, TEAMS } from '../data/dummy';

const GAME_SLUGS: Record<string, string> = {
  mlbb: 'mobile-legends',
  valorant: 'valorant',
  freefire: 'free-fire',
  codm: 'cod-mobile',
};

const GAME_ICONS: Record<string, string> = {
  mlbb: '⚔️',
  valorant: '🎯',
  freefire: '🔫',
  codm: '💥',
};

const FEATURED_GAME_GRADIENTS: Record<string, string> = {
  mlbb: 'from-cyan-600 via-blue-700 to-indigo-900',
  valorant: 'from-red-600 via-rose-700 to-pink-900',
  freefire: 'from-yellow-500 via-orange-600 to-red-800',
  codm: 'from-green-600 via-emerald-700 to-teal-900',
};

export function GamesPage() {
  return (
    <div className="min-h-screen" style={{ background: '#08090f' }}>
      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,255,0.4), transparent)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <Gamepad2 size={14} style={{ color: '#00d4ff' }} />
              <span className="text-sm font-medium" style={{ color: '#00d4ff' }}>Game Hubs</span>
            </div>
            <h1 className="font-black text-white mb-4" style={{ fontFamily: 'Rajdhani', fontSize: 'clamp(2.5rem,6vw,4rem)' }}>
              CHOOSE YOUR <span style={{ color: '#00d4ff' }}>ARENA</span>
            </h1>
            <p className="text-white/50 max-w-xl mx-auto">
              Compete across the biggest mobile and PC titles. Each game hub has its own tournaments, leaderboards, and community.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Game cards grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GAMES.map((game, i) => {
            const slug = GAME_SLUGS[game.id];
            const gameTournaments = TOURNAMENTS.filter(t => t.game === game.id);
            const gameTeams = TEAMS.filter(t => t.game === game.id);
            const activeTournaments = gameTournaments.filter(t => t.status === 'ongoing' || t.status === 'registration');
            const gradient = FEATURED_GAME_GRADIENTS[game.id];

            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link to={`/games/${slug}`} className="block group">
                  <div className="relative overflow-hidden rounded-2xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl"
                    style={{ border: `1px solid rgba(255,255,255,0.08)`, background: '#0d0e1a' }}>
                    {/* Banner */}
                    <div className={`relative h-48 bg-gradient-to-br ${gradient} overflow-hidden`}>
                      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e1a] via-transparent to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="text-4xl">{GAME_ICONS[game.id]}</span>
                      </div>
                      {activeTournaments.length > 0 && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                          style={{ background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          {activeTournaments.length} LIVE
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4">
                        <div className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.4)', color: game.color }}>
                          {game.genre}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h2 className="font-bold text-white text-xl" style={{ fontFamily: 'Rajdhani' }}>{game.name}</h2>
                          <p className="text-white/40 text-sm">{game.shortName}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                          style={{ background: `${game.color}22`, border: `1px solid ${game.color}33` }}>
                          <ChevronRight size={18} style={{ color: game.color }} />
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { label: 'Players', value: game.activePlayers, icon: Users },
                          { label: 'Tournaments', value: game.tournaments, icon: Trophy },
                          { label: 'Teams', value: gameTeams.length, icon: Zap },
                        ].map(({ label, value, icon: Icon }) => (
                          <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <Icon size={14} className="mx-auto mb-1" style={{ color: game.color }} />
                            <div className="font-bold text-white text-sm">{value}</div>
                            <div className="text-white/35 text-xs">{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Active tournaments preview */}
                      {gameTournaments.slice(0, 2).map(trn => (
                        <div key={trn.id} className="flex items-center justify-between py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: trn.status === 'ongoing' ? '#4ade80' : trn.status === 'registration' ? '#00d4ff' : '#6b7280' }} />
                            <span className="text-white/60 text-xs truncate max-w-[180px]">{trn.name}</span>
                          </div>
                          <span className="text-white/30 text-xs shrink-0 ml-2">${trn.prizePool.toLocaleString()}</span>
                        </div>
                      ))}

                      <div className="mt-4 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all group-hover:opacity-90"
                        style={{ background: `${game.color}18`, color: game.color, border: `1px solid ${game.color}30` }}>
                        Enter Hub
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Global stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Tournaments', value: '41+', color: '#00d4ff' },
            { label: 'Active Players', value: '260M+', color: '#a855f7' },
            { label: 'Prize Distributed', value: '$2.4M', color: '#ffd700' },
            { label: 'Games Supported', value: '4', color: '#4ade80' },
          ].map(stat => (
            <div key={stat.label} className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-2xl font-black mb-1" style={{ fontFamily: 'Rajdhani', color: stat.color }}>{stat.value}</div>
              <div className="text-white/40 text-xs">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}

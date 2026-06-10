import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Users, Zap, TrendingUp, Play, Star, Shield, Swords, Target } from 'lucide-react';
import { GAMES, TOURNAMENTS, TEAMS, MLBB_HEROES, GAME_HUB_DATA } from '../data/dummy';

const SLUG_TO_ID: Record<string, string> = {
  'mobile-legends': 'mlbb',
  'valorant': 'valorant',
  'free-fire': 'freefire',
  'cod-mobile': 'codm',
};

const TIER_COLORS: Record<string, string> = {
  S: '#ff4655',
  A: '#ffd700',
  B: '#4ade80',
  C: '#6b7280',
};

type Tab = 'overview' | 'tournaments' | 'teams' | 'heroes' | 'leaderboard';

export function GameHubPage() {
  const { slug } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const gameId = SLUG_TO_ID[slug ?? ''];
  const game = GAMES.find(g => g.id === gameId);
  const hubData = GAME_HUB_DATA[gameId];

  if (!game || !hubData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08090f' }}>
        <div className="text-center">
          <p className="text-white/40 mb-4">Game hub not found.</p>
          <Link to="/games" className="text-cyan-400 hover:underline">← Back to Games</Link>
        </div>
      </div>
    );
  }

  const gameTournaments = TOURNAMENTS.filter(t => t.game === gameId);
  const gameTeams = TEAMS.filter(t => t.game === gameId);
  const isMLBB = gameId === 'mlbb';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'tournaments', label: 'Tournaments' },
    { id: 'teams', label: 'Teams' },
    ...(isMLBB ? [{ id: 'heroes' as Tab, label: 'Hero Stats' }] : []),
    { id: 'leaderboard', label: 'Leaderboard' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#08090f' }}>
      {/* Hero Banner */}
      <div className={`relative bg-gradient-to-br ${hubData.banner} overflow-hidden`} style={{ minHeight: 320 }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '30px 30px' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090f] via-transparent to-transparent" style={{ top: '30%' }} />

        <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-20">
          <Link to="/games" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 text-sm">
            <ArrowLeft size={16} />
            All Games
          </Link>
          <div className="flex items-end gap-6">
            <div>
              <div className="text-xs font-semibold px-2 py-0.5 rounded inline-block mb-3" style={{ background: 'rgba(0,0,0,0.4)', color: game.color }}>
                {game.genre}
              </div>
              <h1 className="font-black text-white mb-2" style={{ fontFamily: 'Rajdhani', fontSize: 'clamp(2rem,5vw,3.5rem)' }}>
                {game.name.toUpperCase()}
              </h1>
              <p className="text-white/60 max-w-xl text-sm leading-relaxed">{hubData.description}</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              { label: 'Active Players', value: game.activePlayers, icon: Users },
              { label: 'Tournaments', value: gameTournaments.length, icon: Trophy },
              { label: 'Teams', value: gameTeams.length, icon: Shield },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <Icon size={14} style={{ color: game.color }} />
                <span className="font-bold text-white">{value}</span>
                <span className="text-white/50 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(13,14,26,0.8)', backdropFilter: 'blur(8px)', position: 'sticky', top: 64, zIndex: 10 }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-all relative"
                style={{ color: activeTab === tab.id ? game.color : 'rgba(255,255,255,0.45)' }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="game-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: game.color }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: top players */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="font-bold text-white text-lg mb-4" style={{ fontFamily: 'Rajdhani' }}>TOP PLAYERS</h2>
                <div className="space-y-3">
                  {hubData.topPlayers.map((player, i) => (
                    <motion.div key={player.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="text-white/30 font-bold w-6 text-center text-sm">#{i + 1}</div>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: `${game.color}22`, color: game.color }}>
                        {player.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white text-sm">{player.name}</div>
                        <div className="text-white/40 text-xs">{player.team}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm" style={{ color: game.color }}>{player.stat}</div>
                        <div className="text-white/40 text-xs">{player.statLabel}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recent highlights */}
              <div>
                <h2 className="font-bold text-white text-lg mb-4" style={{ fontFamily: 'Rajdhani' }}>RECENT HIGHLIGHTS</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {hubData.recentHighlights.map((clip, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      className={`relative overflow-hidden rounded-xl aspect-[9/16] bg-gradient-to-br ${clip.gradient} cursor-pointer group`}>
                      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform"
                          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)' }}>
                          <Play size={20} className="text-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                        <p className="text-white text-xs font-medium leading-tight">{clip.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white/50 text-xs">{clip.views} views</span>
                          <span className="text-white/30 text-xs">·</span>
                          <span className="text-white/50 text-xs">{clip.duration}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: active tournaments */}
            <div>
              <h2 className="font-bold text-white text-lg mb-4" style={{ fontFamily: 'Rajdhani' }}>ACTIVE TOURNAMENTS</h2>
              <div className="space-y-3">
                {gameTournaments.map(trn => (
                  <Link key={trn.id} to={`/tournaments/${trn.id}`}>
                    <div className="p-4 rounded-xl transition-all hover:border-opacity-50 cursor-pointer" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: trn.status === 'ongoing' ? '#4ade80' : trn.status === 'registration' ? game.color : '#6b7280' }} />
                        <span className="text-xs font-semibold uppercase" style={{ color: trn.status === 'ongoing' ? '#4ade80' : trn.status === 'registration' ? game.color : '#6b7280' }}>
                          {trn.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-white font-medium text-sm mb-2 leading-tight">{trn.name}</p>
                      <div className="flex items-center justify-between text-xs text-white/40">
                        <span>${trn.prizePool.toLocaleString()} prize</span>
                        <span>{trn.registeredTeams}/{trn.maxTeams} teams</span>
                      </div>
                    </div>
                  </Link>
                ))}
                {gameTournaments.length === 0 && (
                  <div className="text-white/30 text-sm text-center py-8">No tournaments currently</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TOURNAMENTS */}
        {activeTab === 'tournaments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-white text-xl" style={{ fontFamily: 'Rajdhani' }}>ALL {game.shortName} TOURNAMENTS</h2>
              <Link to="/tournaments" className="text-sm px-4 py-2 rounded-lg" style={{ background: `${game.color}18`, color: game.color, border: `1px solid ${game.color}30` }}>
                View All
              </Link>
            </div>
            {gameTournaments.map(trn => (
              <Link key={trn.id} to={`/tournaments/${trn.id}`}>
                <div className="flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${trn.coverGradient} flex items-center justify-center shrink-0`}>
                    <Trophy size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm">{trn.name}</div>
                    <div className="text-white/40 text-xs mt-0.5">{trn.format.replace('_', ' ')} · {trn.region}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm" style={{ color: '#ffd700' }}>${trn.prizePool.toLocaleString()}</div>
                    <div className="text-white/40 text-xs">{trn.registeredTeams}/{trn.maxTeams} teams</div>
                  </div>
                  <div className="px-2 py-0.5 rounded text-xs font-semibold shrink-0" style={{ background: trn.status === 'ongoing' ? 'rgba(74,222,128,0.15)' : trn.status === 'registration' ? `${game.color}18` : 'rgba(107,114,128,0.15)', color: trn.status === 'ongoing' ? '#4ade80' : trn.status === 'registration' ? game.color : '#9ca3af' }}>
                    {trn.status.replace('_', ' ')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* TEAMS */}
        {activeTab === 'teams' && (
          <div>
            <h2 className="font-bold text-white text-xl mb-6" style={{ fontFamily: 'Rajdhani' }}>{game.shortName} TEAMS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gameTeams.map((team, i) => (
                <Link key={team.id} to={`/teams/${team.id}`}>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-xl transition-all cursor-pointer hover:border-white/20 group" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm" style={{ background: `${game.color}22`, color: game.color, border: `1px solid ${game.color}33` }}>
                        {team.logo}
                      </div>
                      <div>
                        <div className="font-bold text-white">{team.name}</div>
                        <div className="text-white/40 text-xs">[{team.tag}] · {team.region}</div>
                      </div>
                      <div className="ml-auto text-white/25 text-xs">#{team.rank}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[['W', team.wins, '#4ade80'], ['L', team.losses, '#ff4655'], ['PTS', team.points, game.color]].map(([l, v, c]) => (
                        <div key={String(l)} className="rounded-lg py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="font-bold text-sm" style={{ color: String(c) }}>{v}</div>
                          <div className="text-white/30 text-xs">{l}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </Link>
              ))}
              {gameTeams.length === 0 && (
                <div className="col-span-3 text-white/30 text-center py-20">No teams registered for {game.name} yet.</div>
              )}
            </div>
          </div>
        )}

        {/* HERO STATS (MLBB only) */}
        {activeTab === 'heroes' && isMLBB && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-white text-xl" style={{ fontFamily: 'Rajdhani' }}>HERO META STATS</h2>
              <span className="text-xs text-white/30 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Updated: Season 32 Patch
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MLBB_HEROES.map((hero, i) => (
                <motion.div key={hero.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                  className="p-5 rounded-xl relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${hero.color}22` }}>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: hero.color, filter: 'blur(40px)', transform: 'translate(30%, -30%)' }} />
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-black text-white text-lg" style={{ fontFamily: 'Rajdhani' }}>{hero.name.toUpperCase()}</div>
                      <div className="text-xs flex items-center gap-1.5 mt-0.5">
                        {hero.role.includes('Jungler') && <Swords size={11} style={{ color: hero.color }} />}
                        {hero.role.includes('Tank') && <Shield size={11} style={{ color: hero.color }} />}
                        {hero.role.includes('Gold') && <Target size={11} style={{ color: hero.color }} />}
                        {hero.role.includes('Fighter') && <Zap size={11} style={{ color: hero.color }} />}
                        <span style={{ color: 'rgba(255,255,255,0.45)' }}>{hero.role}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: `${TIER_COLORS[hero.tier]}22`, color: TIER_COLORS[hero.tier], border: `1px solid ${TIER_COLORS[hero.tier]}44` }}>
                      {hero.tier}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Win Rate', value: hero.winRate, suffix: '%', color: hero.winRate > 52 ? '#4ade80' : hero.winRate < 49 ? '#ff4655' : '#ffd700' },
                      { label: 'Pick Rate', value: hero.pickRate, suffix: '%', color: '#00d4ff' },
                      { label: 'Ban Rate', value: hero.banRate, suffix: '%', color: '#a855f7' },
                    ].map(stat => (
                      <div key={stat.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: 'rgba(255,255,255,0.45)' }}>{stat.label}</span>
                          <span className="font-bold" style={{ color: stat.color }}>{stat.value}{stat.suffix}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: stat.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(stat.value, 100)}%` }}
                            transition={{ duration: 1, delay: i * 0.1 + 0.3 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div>
            <h2 className="font-bold text-white text-xl mb-6" style={{ fontFamily: 'Rajdhani' }}>GLOBAL LEADERBOARD</h2>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Rank', 'Team', 'W', 'L', 'Win%', 'Points'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gameTeams.sort((a, b) => a.rank - b.rank).map((team, i) => (
                    <tr key={team.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-4 py-3">
                        <span className="font-bold text-sm" style={{ color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.4)' }}>
                          #{team.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/teams/${team.id}`} className="flex items-center gap-2 group">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: `${game.color}22`, color: game.color }}>
                            {team.logo}
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium group-hover:underline">{team.name}</div>
                            <div className="text-white/35 text-xs">{team.region}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-green-400 font-semibold text-sm">{team.wins}</td>
                      <td className="px-4 py-3 text-red-400 font-semibold text-sm">{team.losses}</td>
                      <td className="px-4 py-3 text-white/70 text-sm">
                        {Math.round((team.wins / (team.wins + team.losses)) * 100)}%
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-sm" style={{ color: game.color }}>{team.points.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                  {gameTeams.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-white/30">No teams yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

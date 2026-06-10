import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import {
  Calendar, Crown, Gamepad2, Heart, MessageCircle, Radio,
  Search, Shield, Sparkles, Trophy, Users, Zap
} from 'lucide-react';
import {
  COMMUNITY_EVENTS,
  COMMUNITY_POSTS,
  GAMES,
  LEADERBOARD_ROWS,
  MEDIA_POSTS,
  TEAMS,
  type GameId,
} from '../data/dummy';

type Filter = 'all' | GameId;

const POST_TAG_STYLE: Record<string, { color: string; label: string }> = {
  announcement: { color: '#00d4ff', label: 'Announcement' },
  recruitment: { color: '#ffd700', label: 'Recruitment' },
  highlight: { color: '#a855f7', label: 'Highlight' },
  discussion: { color: '#4ade80', label: 'Discussion' },
  scrim: { color: '#ff4655', label: 'Scrim' },
};

function gameName(gameId: GameId) {
  return GAMES.find(game => game.id === gameId)?.shortName ?? gameId.toUpperCase();
}

function gameColor(gameId: GameId) {
  return GAMES.find(game => game.id === gameId)?.color ?? '#00d4ff';
}

export function CommunityPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const posts = useMemo(() => COMMUNITY_POSTS.filter(post => {
    const matchesGame = filter === 'all' || post.game === filter;
    const matchesSearch = `${post.title} ${post.body} ${post.author}`.toLowerCase().includes(search.toLowerCase());
    return matchesGame && matchesSearch;
  }), [filter, search]);

  const leaderboard = filter === 'all'
    ? LEADERBOARD_ROWS
    : LEADERBOARD_ROWS.filter(row => row.game === filter);

  const events = filter === 'all'
    ? COMMUNITY_EVENTS
    : COMMUNITY_EVENTS.filter(event => event.game === filter);

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#08090f' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border overflow-hidden"
          style={{ background: 'radial-gradient(circle at top left, rgba(168,85,247,0.22), transparent 32%), radial-gradient(circle at top right, rgba(0,212,255,0.15), transparent 30%), rgba(13,14,26,0.82)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="p-6 sm:p-8 lg:p-10 grid lg:grid-cols-[1fr_0.75fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-4" style={{ background: 'rgba(168,85,247,0.14)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.28)' }}>
                <Users className="w-3.5 h-3.5" /> Phase 9 Community Hub
              </div>
              <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(2.2rem, 6vw, 4.6rem)', fontWeight: 800, lineHeight: 0.92 }}>
                More than brackets. Build the scene.
              </h1>
              <p className="text-white/55 mt-5 max-w-2xl leading-relaxed">
                Phase 9 turns the platform into an esports community layer with leaderboards, recruitment posts, creator highlights, game-specific events, top teams, and content discovery.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link to="/media" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-black" style={{ background: '#00d4ff', fontWeight: 700 }}>
                  <Radio className="w-4 h-4" /> Browse clips
                </Link>
                <Link to="/games" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white border hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                  <Gamepad2 className="w-4 h-4" /> Game hubs
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Community posts', value: COMMUNITY_POSTS.length, icon: MessageCircle, color: '#00d4ff' },
                { label: 'Ranked players', value: LEADERBOARD_ROWS.length, icon: Trophy, color: '#ffd700' },
                { label: 'Upcoming events', value: COMMUNITY_EVENTS.length, icon: Calendar, color: '#4ade80' },
                { label: 'Featured clips', value: MEDIA_POSTS.filter(post => post.featured).length, icon: Sparkles, color: '#a855f7' },
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

        <div className="rounded-2xl border p-4" style={{ background: 'rgba(13,14,26,0.72)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              <button onClick={() => setFilter('all')} className="px-4 py-2 rounded-xl text-sm whitespace-nowrap"
                style={{ background: filter === 'all' ? '#00d4ff' : 'rgba(255,255,255,0.05)', color: filter === 'all' ? '#000' : 'rgba(255,255,255,0.6)' }}>All games</button>
              {GAMES.map(game => (
                <button key={game.id} onClick={() => setFilter(game.id)} className="px-4 py-2 rounded-xl text-sm whitespace-nowrap"
                  style={{ background: filter === game.id ? `${game.color}` : 'rgba(255,255,255,0.05)', color: filter === game.id ? '#000' : 'rgba(255,255,255,0.6)' }}>{game.shortName}</button>
              ))}
            </div>
            <div className="relative lg:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search community..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none border"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }} />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
          <div className="space-y-6">
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.82)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <h2 className="text-white" style={{ fontWeight: 700 }}>Community Feed</h2>
                <p className="text-xs text-white/35">Announcements, recruiting, highlight posts, and scrim updates.</p>
              </div>
              <div>
                {posts.length === 0 ? (
                  <div className="p-10 text-center text-white/35">No posts match this filter.</div>
                ) : posts.map(post => {
                  const tag = POST_TAG_STYLE[post.tag];
                  const color = gameColor(post.game);
                  return (
                    <motion.article key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 border-b last:border-0 hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30`, fontWeight: 800 }}>{post.avatar}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-sm text-white" style={{ fontWeight: 700 }}>{post.author}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color, background: `${color}15` }}>{gameName(post.game)}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: tag.color, background: `${tag.color}15` }}>{tag.label}</span>
                            <span className="text-xs text-white/28">{post.createdAt}</span>
                          </div>
                          <h3 className="text-white" style={{ fontWeight: 700 }}>{post.title}</h3>
                          <p className="text-sm text-white/48 mt-1 leading-relaxed">{post.body}</p>
                          <div className="flex items-center gap-5 mt-4 text-xs text-white/35">
                            <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {post.likes}</span>
                            <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> {post.replies}</span>
                            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> {post.role}</span>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.82)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <h2 className="text-white" style={{ fontWeight: 700 }}>Upcoming Community Events</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 p-5">
                {events.map(event => {
                  const color = gameColor(event.game);
                  return (
                    <div key={event.id} className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color, background: `${color}15` }}>{gameName(event.game)}</span>
                        <span className="text-[10px] text-white/30 capitalize">{event.type.replace('_', ' ')}</span>
                      </div>
                      <h3 className="text-sm text-white" style={{ fontWeight: 700 }}>{event.title}</h3>
                      <p className="text-xs text-white/40 mt-2">{new Date(event.startsAt).toLocaleString()}</p>
                      <div className="flex items-center justify-between mt-4 text-xs">
                        <span className="text-white/45 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {event.attendees}</span>
                        <span style={{ color: '#ffd700' }}>{event.reward}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.82)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <h2 className="text-white" style={{ fontWeight: 700 }}>Player Leaderboard</h2>
                <Crown className="w-5 h-5" style={{ color: '#ffd700' }} />
              </div>
              {leaderboard.map(row => {
                const color = gameColor(row.game);
                return (
                  <div key={row.id} className="px-5 py-4 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-center" style={{ color: row.rank <= 3 ? '#ffd700' : 'rgba(255,255,255,0.35)', fontWeight: 800 }}>#{row.rank}</span>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs" style={{ background: `${color}18`, border: `1px solid ${color}30`, fontWeight: 800 }}>{row.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate" style={{ fontWeight: 700 }}>{row.name}</p>
                        <p className="text-xs text-white/35 truncate">{row.team} · {gameName(row.game)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm" style={{ color, fontWeight: 800 }}>{row.rating}</p>
                        <p className="text-[10px] text-white/30">{row.winRate}% · {row.streak}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.82)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <h2 className="text-white" style={{ fontWeight: 700 }}>Top Teams</h2>
              </div>
              {TEAMS.slice(0, 5).map(team => {
                const color = gameColor(team.game);
                return (
                  <Link key={team.id} to={`/teams/${team.id}`} className="block px-5 py-4 border-b last:border-0 hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs" style={{ background: `${color}18`, border: `1px solid ${color}30`, fontWeight: 800 }}>{team.logo}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate" style={{ fontWeight: 700 }}>{team.name}</p>
                        <p className="text-xs text-white/35">{team.wins}W / {team.losses}L · {gameName(team.game)}</p>
                      </div>
                      <span className="text-xs" style={{ color }}>{team.points}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="rounded-2xl border p-5" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(8,9,15,0.9))', borderColor: 'rgba(0,212,255,0.18)' }}>
              <Zap className="w-6 h-6 mb-4" style={{ color: '#00d4ff' }} />
              <h2 className="text-white" style={{ fontWeight: 800 }}>Community-ready next step</h2>
              <p className="text-sm text-white/45 mt-2 leading-relaxed">
                When backend is added, these posts become database records, likes/replies become realtime counters, and leaderboards update from match results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

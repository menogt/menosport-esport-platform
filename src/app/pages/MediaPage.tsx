import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Heart, Share2, Eye, Film, Flame, BookOpen, Zap, Star, Filter } from 'lucide-react';
import { MEDIA_POSTS, GAMES, type MediaTag, type GameId } from '../data/dummy';

const TAG_CONFIG: Record<MediaTag, { label: string; color: string; icon: React.ComponentType<{ size?: number }> }> = {
  highlights: { label: 'Highlights', color: '#ffd700', icon: Star },
  meme:       { label: 'Memes',      color: '#a855f7', icon: Flame },
  reaction:   { label: 'Reactions',  color: '#00d4ff', icon: Zap },
  promo:      { label: 'Promos',     color: '#ff4655', icon: Film },
  tutorial:   { label: 'Tutorials',  color: '#4ade80', icon: BookOpen },
  clutch:     { label: 'Clutch',     color: '#f97316', icon: Flame },
};

const GAME_COLORS: Record<GameId, string> = {
  mlbb: '#00d4ff',
  valorant: '#ff4655',
  freefire: '#ffd700',
  codm: '#4ade80',
};

type GameFilter = GameId | 'all';
type TagFilter = MediaTag | 'all';

export function MediaPage() {
  const [gameFilter, setGameFilter] = useState<GameFilter>('all');
  const [tagFilter, setTagFilter] = useState<TagFilter>('all');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = MEDIA_POSTS.filter(p => {
    if (gameFilter !== 'all' && p.game !== gameFilter) return false;
    if (tagFilter !== 'all' && p.tag !== tagFilter) return false;
    return true;
  });

  const featured = MEDIA_POSTS.filter(p => p.featured);

  function toggleLike(id: string) {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen" style={{ background: '#08090f' }}>
      {/* Hero */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(168,85,247,0.5), transparent)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}>
              <Film size={14} style={{ color: '#a855f7' }} />
              <span className="text-sm font-medium" style={{ color: '#a855f7' }}>Media Gallery</span>
            </div>
            <h1 className="font-black text-white mb-3" style={{ fontFamily: 'Rajdhani', fontSize: 'clamp(2.5rem,6vw,4rem)' }}>
              CLIPS & <span style={{ color: '#a855f7' }}>HIGHLIGHTS</span>
            </h1>
            <p className="text-white/50 max-w-xl mx-auto">The best moments from every tournament, match, and player on ArenaX.</p>
          </motion.div>
        </div>
      </section>

      {/* Featured strip */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={16} style={{ color: '#ff4655' }} />
            <span className="font-semibold text-white text-sm" style={{ fontFamily: 'Rajdhani' }}>FEATURED</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featured.map(post => {
              const tagCfg = TAG_CONFIG[post.tag];
              const isLiked = likedPosts.has(post.id);
              return (
                <motion.div
                  key={post.id}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${post.gradient} cursor-pointer group`}
                  style={{ aspectRatio: '9/16', maxHeight: 420 }}
                  whileHover={{ scale: 1.02 }}
                  onHoverStart={() => setHoveredId(post.id)}
                  onHoverEnd={() => setHoveredId(null)}
                >
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
                      animate={{ scale: hoveredId === post.id ? 1.1 : 1 }}
                    >
                      <Play size={24} className="text-white ml-1.5" />
                    </motion.div>
                  </div>
                  {/* Tag badge */}
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: `${tagCfg.color}30`, border: `1px solid ${tagCfg.color}50`, color: tagCfg.color }}>
                    {tagCfg.label}
                  </div>
                  {/* Featured badge */}
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(255,215,0,0.2)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)' }}>
                    ★ FEATURED
                  </div>
                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-semibold text-sm leading-tight mb-2">{post.title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: GAME_COLORS[post.game] + '33', color: GAME_COLORS[post.game] }}>
                          {post.creatorAvatar}
                        </div>
                        <span className="text-white/70 text-xs">{post.creator}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-white/50 text-xs"><Eye size={11} />{post.views}</span>
                        <button
                          onClick={e => { e.stopPropagation(); toggleLike(post.id); }}
                          className="flex items-center gap-1 text-xs transition-colors"
                          style={{ color: isLiked ? '#ff4655' : 'rgba(255,255,255,0.5)' }}
                        >
                          <Heart size={11} fill={isLiked ? '#ff4655' : 'none'} />{post.likes}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Game filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={13} className="text-white/30 mr-1" />
            {(['all', ...GAMES.map(g => g.id)] as (GameFilter)[]).map(id => {
              const game = GAMES.find(g => g.id === id);
              return (
                <button
                  key={id}
                  onClick={() => setGameFilter(id)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: gameFilter === id ? (game ? game.color : '#fff') : 'rgba(255,255,255,0.05)',
                    color: gameFilter === id ? (game ? '#000' : '#000') : 'rgba(255,255,255,0.55)',
                    border: `1px solid ${gameFilter === id ? (game ? game.color : '#fff') : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {id === 'all' ? 'All Games' : game?.shortName}
                </button>
              );
            })}
          </div>
          {/* Tag filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', ...Object.keys(TAG_CONFIG)] as (TagFilter)[]).map(tag => {
              const cfg = tag !== 'all' ? TAG_CONFIG[tag as MediaTag] : null;
              return (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: tagFilter === tag ? (cfg ? cfg.color : '#fff') : 'rgba(255,255,255,0.05)',
                    color: tagFilter === tag ? '#000' : 'rgba(255,255,255,0.55)',
                    border: `1px solid ${tagFilter === tag ? (cfg ? cfg.color : '#fff') : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {tag === 'all' ? 'All Types' : cfg?.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main grid */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/40 text-sm">{filtered.length} clips</span>
          <span className="text-white/30 text-xs">Hover to preview · Click to watch</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${gameFilter}-${tagFilter}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
          >
            {filtered.map((post, i) => {
              const tagCfg = TAG_CONFIG[post.tag];
              const isLiked = likedPosts.has(post.id);
              return (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }}
                  className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${post.gradient} cursor-pointer group`}
                  style={{ aspectRatio: '9/16' }}
                  whileHover={{ scale: 1.04, zIndex: 2 }}
                  onHoverStart={() => setHoveredId(post.id)}
                  onHoverEnd={() => setHoveredId(null)}
                >
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />

                  {/* Play overlay on hover */}
                  <AnimatePresence>
                    {hoveredId === post.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.2)' }}
                      >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                          <Play size={18} className="text-white ml-1" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Duration badge */}
                  <div className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.8)' }}>
                    {post.duration}
                  </div>

                  {/* Tag */}
                  <div className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${tagCfg.color}25`, color: tagCfg.color, border: `1px solid ${tagCfg.color}35` }}>
                    {tagCfg.label}
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-white text-[11px] font-medium leading-tight mb-2 line-clamp-2">{post.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-[10px] flex items-center gap-1"><Eye size={9} />{post.views}</span>
                      <button
                        onClick={e => { e.stopPropagation(); toggleLike(post.id); }}
                        className="flex items-center gap-1 text-[10px] transition-colors"
                        style={{ color: isLiked ? '#ff4655' : 'rgba(255,255,255,0.45)' }}
                      >
                        <Heart size={10} fill={isLiked ? '#ff4655' : 'none'} />
                        {post.likes}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <Film size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-white/30">No clips match your filters</p>
          </div>
        )}
      </section>
    </div>
  );
}

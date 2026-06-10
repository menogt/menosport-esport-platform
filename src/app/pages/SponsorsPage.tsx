import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, BarChart3, Crown, Megaphone, MousePointerClick, Sparkles, Trophy, Zap } from 'lucide-react';
import { SPONSORS, SPONSOR_CAMPAIGNS, SPONSOR_PACKAGES, SPONSOR_PLACEMENTS, TOURNAMENTS } from '../data/dummy';

const statusColor = {
  draft: '#6b7280',
  scheduled: '#ffd700',
  active: '#4ade80',
  completed: '#00d4ff',
};

const placementLabel: Record<string, string> = {
  homepage_hero: 'Homepage Hero',
  tournament_presented_by: 'Presented By',
  bracket_takeover: 'Bracket Takeover',
  match_card: 'Match Card',
  game_hub: 'Game Hub',
  media_feature: 'Media Feature',
};

export function SponsorsPage() {
  const totalImpressions = SPONSOR_CAMPAIGNS.reduce((sum, campaign) => sum + campaign.impressions, 0);
  const totalClicks = SPONSOR_CAMPAIGNS.reduce((sum, campaign) => sum + campaign.clicks, 0);
  const averageCtr = totalImpressions ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen pt-24" style={{ background: '#08090f' }}>
      <section className="relative overflow-hidden border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 25% 15%, rgba(0,212,255,0.22), transparent 30%), radial-gradient(circle at 75% 20%, rgba(168,85,247,0.18), transparent 28%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-5" style={{ color: '#00d4ff', background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.22)' }}>
                <Megaphone className="w-3.5 h-3.5" /> Phase 11 sponsor activation
              </span>
              <h1 className="text-white leading-none" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(2.4rem, 7vw, 5rem)', fontWeight: 800 }}>
                Sponsor tournaments without making the platform feel spammy.
              </h1>
              <p className="text-white/55 mt-5 max-w-2xl leading-relaxed">
                Meno Arena now has sponsor packages, campaign cards, placement tracking, and analytics-ready UI blocks for tournament partners, game hubs, brackets, and media highlights.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link to="/dashboard/admin" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm text-white" style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 700 }}>
                  Manage Sponsors <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/tournaments" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm text-white/70 border hover:text-white hover:bg-white/5 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  View Sponsored Events
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, delay: 0.1 }} className="rounded-3xl p-6 border" style={{ background: 'rgba(13,14,26,0.84)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Active sponsors', value: SPONSORS.length, icon: Crown, color: '#ffd700' },
                  { label: 'Live placements', value: SPONSOR_PLACEMENTS.filter(p => p.live).length, icon: Zap, color: '#4ade80' },
                  { label: 'Impressions', value: totalImpressions.toLocaleString(), icon: BarChart3, color: '#00d4ff' },
                  { label: 'Avg CTR', value: `${averageCtr}%`, icon: MousePointerClick, color: '#a855f7' },
                ].map((stat, index) => (
                  <div key={index} className="rounded-2xl p-4 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: `${stat.color}22` }}>
                    <stat.icon className="w-5 h-5 mb-3" style={{ color: stat.color }} />
                    <p style={{ color: stat.color, fontFamily: "'Rajdhani', sans-serif", fontSize: '1.6rem', fontWeight: 800 }}>{stat.value}</p>
                    <p className="text-xs text-white/40">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '2rem', fontWeight: 800 }}>Sponsor Packages</h2>
            <p className="text-white/40 text-sm">Ready-made monetization offers for organizers and brands.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SPONSOR_PACKAGES.map((pkg, index) => (
            <motion.div key={pkg.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="rounded-2xl p-6 border" style={{ background: 'rgba(13,14,26,0.82)', borderColor: `${pkg.accent}24` }}>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${pkg.accent}14`, border: `1px solid ${pkg.accent}26` }}>
                  <Sparkles className="w-5 h-5" style={{ color: pkg.accent }} />
                </div>
                <span className="text-xs px-2 py-1 rounded-full" style={{ color: pkg.accent, background: `${pkg.accent}12` }}>{pkg.price}</span>
              </div>
              <h3 className="text-white mb-1" style={{ fontWeight: 700 }}>{pkg.name}</h3>
              <p className="text-xs text-white/40 mb-5">{pkg.bestFor}</p>
              <div className="space-y-2">
                {pkg.benefits.map(benefit => (
                  <div key={benefit} className="flex gap-2 text-xs text-white/60">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: pkg.accent }} />
                    {benefit}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.9fr] gap-6">
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.82)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <h2 className="text-white" style={{ fontWeight: 700 }}>Active Campaigns</h2>
              <p className="text-xs text-white/35">Campaign analytics preview for sponsor reporting.</p>
            </div>
            {SPONSOR_CAMPAIGNS.map(campaign => {
              const sponsor = SPONSORS.find(s => s.id === campaign.sponsorId);
              const tournament = TOURNAMENTS.find(t => t.id === campaign.tournamentId);
              return (
                <div key={campaign.id} className="px-5 py-4 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate" style={{ fontWeight: 700 }}>{campaign.title}</p>
                      <p className="text-xs text-white/40">{sponsor?.name} · {tournament?.name}</p>
                      <p className="text-[10px] text-white/30 mt-1">{placementLabel[campaign.placement]}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ color: statusColor[campaign.status], background: `${statusColor[campaign.status]}15` }}>{campaign.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                    <div><p className="text-white/35">Impressions</p><p className="text-white">{campaign.impressions.toLocaleString()}</p></div>
                    <div><p className="text-white/35">Clicks</p><p className="text-white">{campaign.clicks.toLocaleString()}</p></div>
                    <div><p className="text-white/35">CTR</p><p style={{ color: '#4ade80' }}>{campaign.ctr}%</p></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.82)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <h2 className="text-white" style={{ fontWeight: 700 }}>Placement Map</h2>
              <p className="text-xs text-white/35">Where sponsor inventory appears across the platform.</p>
            </div>
            {SPONSOR_PLACEMENTS.map(placement => {
              const sponsor = SPONSORS.find(s => s.id === placement.sponsorId);
              return (
                <div key={placement.id} className="px-5 py-4 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs" style={{ background: `${sponsor?.color ?? '#00d4ff'}15`, color: sponsor?.color ?? '#00d4ff', border: `1px solid ${sponsor?.color ?? '#00d4ff'}25`, fontWeight: 800 }}>
                      {sponsor?.logo}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-white" style={{ fontWeight: 700 }}>{placement.name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: placement.live ? '#4ade80' : '#ffd700', background: placement.live ? 'rgba(74,222,128,0.12)' : 'rgba(255,215,0,0.12)' }}>{placement.live ? 'Live' : 'Draft'}</span>
                      </div>
                      <p className="text-xs text-white/40">{placement.page}</p>
                      <p className="text-xs text-white/30 mt-1">{placement.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="rounded-3xl p-8 lg:p-10 border overflow-hidden relative" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(168,85,247,0.12))', borderColor: 'rgba(255,255,255,0.09)' }}>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <h2 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '2rem', fontWeight: 800 }}>Built for clean brand activation.</h2>
              <p className="text-white/50 mt-2 max-w-2xl">The goal is not random ads everywhere. Sponsors should appear where they add legitimacy: tournaments, brackets, streams, media, MVP awards, and community events.</p>
            </div>
            <Link to="/dashboard/admin" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm text-white" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', fontWeight: 700 }}>
              Open Control Center <Trophy className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

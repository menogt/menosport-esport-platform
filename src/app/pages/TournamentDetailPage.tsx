import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Trophy, Users, Calendar, DollarSign, Shield, ExternalLink, CheckCircle,
  Clock, ChevronRight, ArrowLeft, Twitch, AlertCircle, Info, Star
} from 'lucide-react';
import { TOURNAMENTS, TEAMS, MATCHES, GAMES, SPONSORS, PRIZE_SOURCES, PAYOUT_RECORDS } from '../data/dummy';
import { PaymentModal } from '../components/PaymentModal';
import { generateSingleEliminationBracket } from '../lib/bracketEngine';

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  registration: { label: 'Registration Open', color: '#00d4ff', bg: 'rgba(0,212,255,0.15)' },
  ongoing: { label: 'Live', color: '#4ade80', bg: 'rgba(74,222,128,0.15)' },
  completed: { label: 'Completed', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
};

const MATCH_STATUS_CONFIG = {
  upcoming: { label: 'Scheduled', color: '#6b7280' },
  live: { label: 'LIVE', color: '#4ade80' },
  waiting_result: { label: 'Awaiting Result', color: '#ffd700' },
  disputed: { label: 'Disputed', color: '#ff4655' },
  completed: { label: 'Completed', color: '#6b7280' },
};

type Tab = 'overview' | 'bracket' | 'teams' | 'schedule' | 'prize';

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const tournament = TOURNAMENTS.find(t => t.id === id);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [registered, setRegistered] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/40">Tournament not found.</p>
          <Link to="/tournaments" className="text-sm mt-4 inline-block" style={{ color: '#00d4ff' }}>
            ← Back to Tournaments
          </Link>
        </div>
      </div>
    );
  }

  const game = GAMES.find(g => g.id === tournament.game)!;
  const status = STATUS_CONFIG[tournament.status];
  const gameTeams = TEAMS.filter(t => t.game === tournament.game);
  const fallbackTeams = TEAMS.filter(t => !gameTeams.some(gt => gt.id === t.id));
  const registeredTeams = [...gameTeams, ...fallbackTeams].slice(0, tournament.registeredTeams);
  const storedMatches = MATCHES.filter(m => m.tournamentId === tournament.id);
  const tournamentMatches = storedMatches.length > 0
    ? storedMatches
    : tournament.format === 'single_elimination'
      ? generateSingleEliminationBracket({ tournamentId: tournament.id, teams: registeredTeams, startDate: tournament.startDate })
      : [];
  const prizeSource = PRIZE_SOURCES.find(source => source.tournamentId === tournament.id);
  const payoutRecords = PAYOUT_RECORDS.filter(payout => payout.tournamentId === tournament.id);
  const fill = Math.round((tournament.registeredTeams / tournament.maxTeams) * 100);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'bracket', label: 'Bracket' },
    { key: 'teams', label: `Teams (${tournament.registeredTeams})` },
    { key: 'schedule', label: 'Schedule' },
    { key: 'prize', label: 'Prize Pool' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-20">
      {/* Hero banner */}
      <div className={`relative bg-gradient-to-r ${tournament.coverGradient} h-52 sm:h-64 overflow-hidden`}>
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090f] via-transparent to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-end px-4 pb-0 max-w-7xl mx-auto">
          <Link to="/tournaments" className="absolute top-6 left-4 flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Tournaments
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Tournament header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 -mt-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                style={{ color: status.color, background: status.bg, border: `1px solid ${status.color}40` }}>
                {tournament.status === 'ongoing' && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: status.color }} />}
                {status.label}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full text-white/50"
                style={{ background: `${game.color}15`, border: `1px solid ${game.color}30`, color: game.color }}>
                {game.name}
              </span>
            </div>
            <h1 className="text-white leading-tight mb-1" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700 }}>
              {tournament.name}
            </h1>
            <p className="text-white/40 text-sm">{tournament.region} · Organized by {tournament.organizer}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {tournament.streamLink && (
              <a href={tournament.streamLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(145,70,255,0.4)', color: '#9146ff' }}>
                <Twitch className="w-4 h-4" /> Watch Live
              </a>
            )}
            {tournament.status === 'registration' && !registered && (
              <button
                onClick={() => tournament.entryFee > 0 ? setPaymentOpen(true) : setRegistered(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 20px rgba(0,212,255,0.25)', fontWeight: 600 }}>
                <Trophy className="w-4 h-4" />
                Register Team — {tournament.entryFee === 0 ? 'Free' : `$${tournament.entryFee}`}
              </button>
            )}
            {registered && (
              <button
                onClick={() => setCheckedIn(true)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm transition-all ${checkedIn ? 'opacity-60 cursor-default' : 'hover:scale-105'}`}
                style={{
                  background: checkedIn ? 'rgba(74,222,128,0.1)' : 'rgba(74,222,128,0.15)',
                  border: '1px solid rgba(74,222,128,0.3)',
                  color: '#4ade80',
                  fontWeight: 600,
                }}
                disabled={checkedIn}
              >
                <CheckCircle className="w-4 h-4" />
                {checkedIn ? 'Checked In ✓' : 'Check In'}
              </button>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Prize Pool', value: `$${tournament.prizePool.toLocaleString()}`, color: '#ffd700', icon: DollarSign },
            { label: 'Entry Fee', value: tournament.entryFee === 0 ? 'Free' : `$${tournament.entryFee}`, color: '#00d4ff', icon: Trophy },
            { label: 'Teams', value: `${tournament.registeredTeams}/${tournament.maxTeams}`, color: '#a855f7', icon: Users },
            { label: 'Start Date', value: new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), color: '#4ade80', icon: Calendar },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl p-4 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                <span className="text-[10px] text-white/40">{stat.label}</span>
              </div>
              <p className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b overflow-x-auto" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-3 text-sm whitespace-nowrap transition-all relative"
              style={{ color: activeTab === tab.key ? '#00d4ff' : 'rgba(255,255,255,0.4)' }}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#00d4ff' }} />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
                {/* Announcements */}
                <div className="rounded-xl p-5 border" style={{ background: 'rgba(0,212,255,0.05)', borderColor: 'rgba(0,212,255,0.15)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4" style={{ color: '#00d4ff' }} />
                    <h3 className="text-sm text-white">Admin Announcements</h3>
                  </div>
                  <p className="text-sm text-white/60">
                    Welcome to {tournament.name}! Check-in opens 1 hour before each match. All disputes must be submitted within 15 minutes of match completion. Good luck to all participants!
                  </p>
                  <p className="text-xs text-white/30 mt-2">Posted 2 days ago by {tournament.organizer}</p>
                </div>

                {/* Rules */}
                {tournament.rules.length > 0 && (
                  <div className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-4 h-4 text-white/40" />
                      <h3 className="text-sm text-white">Tournament Rules</h3>
                    </div>
                    <ul className="space-y-3">
                      {tournament.rules.map((rule, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-white/60">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                            style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', fontWeight: 700 }}>{i + 1}</span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Stream embed placeholder */}
                {tournament.streamLink && (
                  <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(145,70,255,0.2)' }}>
                    <div className="h-48 flex flex-col items-center justify-center gap-3"
                      style={{ background: 'rgba(145,70,255,0.05)' }}>
                      <Twitch className="w-8 h-8" style={{ color: '#9146ff' }} />
                      <p className="text-sm text-white/50">Live Stream</p>
                      <a href={tournament.streamLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                        style={{ background: '#9146ff', color: 'white' }}>
                        Watch on Twitch <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'bracket' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-sm">Single Elimination Bracket</h3>
                  <Link to={`/brackets/${tournament.id}`}
                    className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity"
                    style={{ color: '#00d4ff' }}>
                    Full View <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {/* Compact bracket preview */}
                {tournamentMatches.length === 0 ? (
                  <div className="rounded-xl p-5 border text-center" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                    <Trophy className="w-8 h-8 text-white/15 mx-auto mb-3" />
                    <p className="text-sm text-white/70 mb-1">Bracket structure placeholder</p>
                    <p className="text-xs text-white/35">This format is UI-ready. Single elimination generation is implemented first, and the same match model supports future double elimination, round-robin, and Swiss logic.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...new Set(tournamentMatches.map(match => match.round))].map(round => {
                      const roundMatches = tournamentMatches.filter(m => m.round === round);
                      if (roundMatches.length === 0) return null;
                      return (
                        <div key={round}>
                          <p className="text-xs text-white/30 mb-2">{roundMatches[0].roundName}</p>
                          <div className="space-y-2">
                            {roundMatches.map(m => {
                              const t1 = TEAMS.find(t => t.id === m.team1Id);
                              const t2 = TEAMS.find(t => t.id === m.team2Id);
                              const ms = MATCH_STATUS_CONFIG[m.status];
                              return (
                                <div key={m.id} className="rounded-xl p-4 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px]" style={{ color: ms.color }}>{ms.label}</span>
                                    <span className="text-[10px] text-white/30">{new Date(m.scheduledTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {[{ team: t1, score: m.score1, winner: m.winnerId === m.team1Id }, { team: t2, score: m.score2, winner: m.winnerId === m.team2Id }].map((row, ri) => (
                                      <div key={ri} className={`flex items-center justify-between py-1.5 px-2 rounded-lg ${row.winner ? '' : ''}`}
                                        style={{ background: row.winner ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.03)' }}>
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] text-white"
                                            style={{ background: 'rgba(255,255,255,0.08)', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
                                            {row.team?.logo ?? '?'}
                                          </div>
                                          <span className="text-sm text-white/80">{row.team?.name ?? 'TBD'}</span>
                                          {row.winner && <CheckCircle className="w-3 h-3" style={{ color: '#4ade80' }} />}
                                        </div>
                                        <span className="text-sm" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: row.winner ? '#4ade80' : 'rgba(255,255,255,0.5)' }}>
                                          {row.score ?? '-'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'teams' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {registeredTeams.map((team, i) => (
                    <div key={team.id} className="flex items-center gap-3 p-4 rounded-xl border hover:bg-white/[0.02] transition-colors"
                      style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0"
                        style={{ background: `${game.color}20`, border: `1px solid ${game.color}30`, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
                        {team.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate" style={{ fontWeight: 600 }}>{team.name}</p>
                        <p className="text-xs text-white/40">[{team.tag}] · {team.region}</p>
                      </div>
                      <span className="text-xs text-white/30">#{i + 1}</span>
                    </div>
                  ))}
                  {/* Empty slots */}
                  {Array.from({ length: Math.max(0, tournament.maxTeams - tournament.registeredTeams) }).slice(0, 4).map((_, i) => (
                    <div key={`empty-${i}`} className="flex items-center gap-3 p-4 rounded-xl border border-dashed opacity-30"
                      style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                      <div className="w-10 h-10 rounded-xl border border-dashed" style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
                      <span className="text-xs text-white/40">Open Slot</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'schedule' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-3">
                {tournamentMatches.map(m => {
                  const t1 = TEAMS.find(t => t.id === m.team1Id);
                  const t2 = TEAMS.find(t => t.id === m.team2Id);
                  const ms = MATCH_STATUS_CONFIG[m.status];
                  return (
                    <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl border"
                      style={{ background: 'rgba(13,14,26,0.8)', borderColor: m.status === 'live' ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)' }}>
                      <div className="text-center w-16 flex-shrink-0">
                        <p className="text-xs text-white/40">{new Date(m.scheduledTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        <p className="text-xs text-white/60">{new Date(m.scheduledTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white/70">{t1?.name ?? 'TBD'}</span>
                          <span className="text-xs text-white/30">vs</span>
                          <span className="text-sm text-white/70">{t2?.name ?? 'TBD'}</span>
                        </div>
                        {m.score1 !== null && (
                          <span className="text-sm text-white/60" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
                            {m.score1} – {m.score2}
                          </span>
                        )}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ color: ms.color, background: `${ms.color}15` }}>
                        {ms.label}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'prize' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
                <div className="text-center py-8 rounded-xl border" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.05), rgba(255,140,0,0.05))', borderColor: 'rgba(255,215,0,0.15)' }}>
                  <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: '#ffd700' }} />
                  <p className="text-xs text-white/40 mb-1">Total Prize Pool</p>
                  <p className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '3rem', fontWeight: 700, color: '#ffd700' }}>
                    ${tournament.prizePool.toLocaleString()}
                  </p>
                </div>
                {prizeSource && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Sponsor Contribution', value: prizeSource.sponsorContribution, color: '#00d4ff' },
                      { label: 'Entry Fee Contribution', value: prizeSource.entryFeeContribution, color: '#4ade80' },
                      { label: 'Organizer Contribution', value: prizeSource.organizerContribution, color: '#a855f7' },
                    ].map(item => (
                      <div key={item.label} className="p-4 rounded-xl border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: `${item.color}22` }}>
                        <p className="text-[10px] text-white/35 mb-1">{item.label}</p>
                        <p className="text-lg" style={{ color: item.color, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>${item.value.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  {tournament.prizeBreakdown.map((prize, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl border"
                      style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                        style={{ background: i === 0 ? 'rgba(255,215,0,0.15)' : i === 1 ? 'rgba(192,192,192,0.1)' : 'rgba(205,127,50,0.1)', color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : '#cd7f32', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
                        {i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{prize.place} Place</p>
                        <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${prize.percentage}%`, background: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : '#cd7f32' }} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>${prize.amount.toLocaleString()}</p>
                        <p className="text-xs text-white/40">{prize.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Payout status */}
                <div className="p-4 rounded-xl border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <h4 className="text-sm text-white mb-3">Payout Status</h4>
                  {(payoutRecords.length > 0 ? payoutRecords : tournament.prizeBreakdown.map((prize, i) => ({ id: `${tournament.id}-${i}`, recipient: `${prize.place} winner`, place: prize.place, amount: prize.amount, status: tournament.status === 'completed' ? ('processing' as const) : ('pending' as const) }))).map((payout) => {
                    const color = payout.status === 'paid' ? '#4ade80' : payout.status === 'processing' ? '#00d4ff' : '#ffd700';
                    return (
                      <div key={payout.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div>
                          <span className="text-sm text-white/60">{payout.place}</span>
                          <p className="text-[10px] text-white/30">{payout.recipient}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/60">${payout.amount.toLocaleString()}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: `${color}15`, color }}>{payout.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Registration progress */}
            <div className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <h4 className="text-sm text-white mb-4">Registration</h4>
              <div className="flex justify-between text-xs text-white/50 mb-2">
                <span>{tournament.registeredTeams} teams registered</span>
                <span>{tournament.maxTeams - tournament.registeredTeams} slots left</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-3">
                <div className="h-full rounded-full transition-all" style={{ width: `${fill}%`, background: `linear-gradient(90deg, ${game.color}, ${game.secondaryColor})` }} />
              </div>
              <div className="text-xs text-white/40 space-y-1">
                <div className="flex justify-between">
                  <span>Deadline</span>
                  <span className="text-white/60">{new Date(tournament.registrationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-in</span>
                  <span className="text-white/60">{tournament.checkedIn}/{tournament.registeredTeams} confirmed</span>
                </div>
              </div>
            </div>

            {/* Sponsor */}
            {tournament.sponsor && (
              <div className="rounded-xl p-5 border text-center" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] text-white/30 mb-2" style={{ letterSpacing: '0.1em' }}>PRESENTED BY</p>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm mx-auto mb-2"
                  style={{ background: `${game.color}15`, border: `1px solid ${game.color}25`, color: game.color, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
                  TG
                </div>
                <p className="text-sm text-white/70">{tournament.sponsor}</p>
              </div>
            )}

            {/* Tournament info */}
            <div className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <h4 className="text-sm text-white mb-4">Details</h4>
              <div className="space-y-2.5 text-xs">
                {[
                  { label: 'Format', value: tournament.format.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) },
                  { label: 'Region', value: tournament.region },
                  { label: 'Start', value: new Date(tournament.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }) },
                  { label: 'End', value: new Date(tournament.endDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }) },
                  { label: 'Max Teams', value: tournament.maxTeams.toString() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-white/40">{label}</span>
                    <span className="text-white/70">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={() => setRegistered(true)}
        tournamentName={tournament.name}
        entryFee={tournament.entryFee}
      />
    </div>
  );
}

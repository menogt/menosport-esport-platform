import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Trophy, CheckCircle, Zap, Radio, RefreshCw, Upload,
  AlertTriangle, ShieldCheck, Wand2, ClipboardCheck, Clock
} from 'lucide-react';
import { TOURNAMENTS, TEAMS, MATCHES, GAMES, type Match } from '../data/dummy';
import {
  advanceWinner,
  generateSingleEliminationBracket,
  groupMatchesByRound,
  markMatchDisputed,
  markMatchWaiting,
} from '../lib/bracketEngine';

const MATCH_STATUS_STYLE = {
  upcoming: { label: 'Scheduled', color: '#6b7280', glow: 'rgba(107,114,128,0.0)' },
  live: { label: 'LIVE', color: '#4ade80', glow: 'rgba(74,222,128,0.2)' },
  waiting_result: { label: 'Awaiting', color: '#ffd700', glow: 'rgba(255,215,0,0.1)' },
  disputed: { label: 'Disputed', color: '#ff4655', glow: 'rgba(255,70,85,0.15)' },
  completed: { label: 'Done', color: '#4ade80', glow: 'rgba(74,222,128,0.0)' },
};

interface BracketMatchProps {
  match: Match;
  isCompact?: boolean;
  isSelected?: boolean;
  onSelect?: (matchId: string) => void;
}

function BracketMatch({ match, isCompact, isSelected, onSelect }: BracketMatchProps) {
  const t1 = TEAMS.find(t => t.id === match.team1Id);
  const t2 = TEAMS.find(t => t.id === match.team2Id);
  const style = MATCH_STATUS_STYLE[match.status];
  const matchReady = Boolean(match.team1Id && match.team2Id);

  return (
    <motion.button
      type="button"
      onClick={() => onSelect?.(match.id)}
      whileHover={{ scale: 1.02 }}
      className="rounded-xl overflow-hidden border transition-all text-left cursor-pointer"
      style={{
        background: 'rgba(13,14,26,0.95)',
        borderColor: isSelected ? '#00d4ff' : match.status === 'live' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)',
        boxShadow: isSelected ? '0 0 24px rgba(0,212,255,0.2)' : match.status === 'live' ? `0 0 20px ${style.glow}` : 'none',
        width: isCompact ? '100%' : 210,
      }}
    >
      <div className="px-3 py-1.5 flex items-center justify-between"
        style={{ background: match.status === 'live' ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="text-[10px] flex items-center gap-1" style={{ color: style.color }}>
          {match.status === 'live' && <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: style.color }} />}
          {style.label}
        </span>
        <span className="text-[9px] text-white/25">M{match.position}</span>
      </div>

      {[
        { team: t1, score: match.score1, winner: match.winnerId === match.team1Id },
        { team: t2, score: match.score2, winner: match.winnerId === match.team2Id },
      ].map((row, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 px-3 py-2.5 ${i === 0 ? 'border-b' : ''}`}
          style={{
            borderColor: 'rgba(255,255,255,0.05)',
            background: row.winner ? 'rgba(74,222,128,0.07)' : 'transparent',
            opacity: match.winnerId && !row.winner && match.status === 'completed' ? 0.45 : 1,
          }}
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] flex-shrink-0"
            style={{ background: row.team ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", color: 'rgba(255,255,255,0.7)' }}
          >
            {row.team?.logo ?? (matchReady ? '?' : 'BYE')}
          </div>
          <span className="flex-1 text-xs truncate" style={{ color: row.team ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)' }}>
            {row.team?.name ?? (matchReady ? 'TBD' : 'Bye / Awaiting')}
          </span>
          {row.winner && <CheckCircle className="w-3 h-3 flex-shrink-0" style={{ color: '#4ade80' }} />}
          <span className="text-xs flex-shrink-0" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: row.winner ? '#4ade80' : row.score !== null ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}>
            {row.score ?? '—'}
          </span>
        </div>
      ))}
    </motion.button>
  );
}

function RoundColumn({ round, matches, label, selectedMatchId, onSelect }: { round: number; matches: Match[]; label: string; selectedMatchId: string | null; onSelect: (matchId: string) => void }) {
  return (
    <div className="flex flex-col gap-0 flex-shrink-0">
      <div className="text-center mb-4 sticky top-20 z-10">
        <span className="text-xs text-white/40 px-3 py-1 rounded-full border"
          style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(13,14,26,0.9)', backdropFilter: 'blur(12px)' }}>
          {label}
        </span>
      </div>
      <div className="flex flex-col" style={{ gap: round === 1 ? 16 : round === 2 ? 80 : round === 3 ? 176 : 280 }}>
        {matches.map(m => (
          <BracketMatch key={m.id} match={m} isSelected={selectedMatchId === m.id} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function StandingsView({ teams }: { teams: typeof TEAMS }) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] text-white/30 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <span className="col-span-1">#</span>
        <span className="col-span-5">Team</span>
        <span className="col-span-1 text-center">W</span>
        <span className="col-span-1 text-center">L</span>
        <span className="col-span-2 text-center">WR%</span>
        <span className="col-span-2 text-right">Pts</span>
      </div>
      {teams.map((team, i) => {
        const wr = Math.round((team.wins / (team.wins + team.losses)) * 100);
        return (
          <div key={team.id} className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-b hover:bg-white/[0.02] transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <span className="col-span-1 text-sm" style={{ color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.3)', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
              {i + 1}
            </span>
            <div className="col-span-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] text-white flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.08)', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
                {team.logo}
              </div>
              <div>
                <p className="text-xs text-white truncate" style={{ fontWeight: 600 }}>{team.name}</p>
                <p className="text-[10px] text-white/40">{team.tag}</p>
              </div>
            </div>
            <span className="col-span-1 text-center text-sm" style={{ color: '#4ade80', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{team.wins}</span>
            <span className="col-span-1 text-center text-sm" style={{ color: '#ff4655', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{team.losses}</span>
            <div className="col-span-2 flex items-center justify-center gap-1">
              <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${wr}%`, background: wr >= 60 ? '#4ade80' : wr >= 45 ? '#ffd700' : '#ff4655' }} />
              </div>
              <span className="text-[10px] text-white/50">{wr}%</span>
            </div>
            <span className="col-span-2 text-right text-sm" style={{ color: '#00d4ff', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>{team.points.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}

export function BracketPage() {
  const { id } = useParams<{ id: string }>();
  const tournament = TOURNAMENTS.find(t => t.id === id);
  const [activeView, setActiveView] = useState<'bracket' | 'standings'>('bracket');
  const [mobileRound, setMobileRound] = useState(1);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [proofName, setProofName] = useState('');
  const [resultLog, setResultLog] = useState<string[]>([]);

  const seededTeams = useMemo(() => {
    if (!tournament) return [];
    const gameTeams = TEAMS.filter(t => t.game === tournament.game);
    const fallback = TEAMS.filter(t => !gameTeams.some(gt => gt.id === t.id));
    return [...gameTeams, ...fallback].slice(0, tournament.registeredTeams || tournament.maxTeams);
  }, [tournament]);

  const initialMatches = useMemo(() => {
    if (!tournament) return [];
    const stored = MATCHES.filter(m => m.tournamentId === tournament.id);
    if (stored.length > 0) return stored;
    if (tournament.format !== 'single_elimination') return [];
    return generateSingleEliminationBracket({
      tournamentId: tournament.id,
      teams: seededTeams,
      startDate: tournament.startDate,
    });
  }, [tournament, seededTeams]);

  const [liveMatches, setLiveMatches] = useState<Match[]>(initialMatches);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [realtimeActive, setRealtimeActive] = useState(true);

  useEffect(() => {
    setLiveMatches(initialMatches);
    setSelectedMatchId(initialMatches.find(m => m.team1Id && m.team2Id && m.status !== 'completed')?.id ?? initialMatches[0]?.id ?? null);
    setMobileRound(1);
    setScore1('');
    setScore2('');
    setProofName('');
    setResultLog([]);
    setLastUpdate(null);
  }, [id, initialMatches]);

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/40">Tournament not found.</p>
      </div>
    );
  }

  const game = GAMES.find(g => g.id === tournament.game)!;
  const rounds = groupMatchesByRound(liveMatches);
  const selectedMatch = liveMatches.find(m => m.id === selectedMatchId) ?? liveMatches.find(m => m.status === 'live' || m.status === 'waiting_result' || (m.team1Id && m.team2Id && m.status !== 'completed')) ?? liveMatches[0];
  const selectedTeam1 = TEAMS.find(t => t.id === selectedMatch?.team1Id);
  const selectedTeam2 = TEAMS.find(t => t.id === selectedMatch?.team2Id);
  const selectedReady = Boolean(selectedMatch?.team1Id && selectedMatch?.team2Id);
  const winnerFromScores = selectedMatch && Number(score1) !== Number(score2)
    ? Number(score1) > Number(score2) ? selectedMatch.team1Id : selectedMatch.team2Id
    : null;

  const generateBracketAgain = () => {
    const generated = generateSingleEliminationBracket({ tournamentId: tournament.id, teams: seededTeams, startDate: tournament.startDate });
    setLiveMatches(generated);
    setSelectedMatchId(generated.find(m => m.team1Id && m.team2Id && m.status !== 'completed')?.id ?? generated[0]?.id ?? null);
    setMobileRound(1);
    setResultLog(prev => [`Bracket regenerated from ${seededTeams.length} checked-in teams. Byes were auto-advanced.`, ...prev]);
    setLastUpdate('Bracket regenerated');
  };

  const submitResult = () => {
    if (!selectedMatch || !winnerFromScores || score1 === '' || score2 === '') return;
    setLiveMatches(prev => markMatchWaiting(prev, selectedMatch.id, Number(score1), Number(score2)));
    setResultLog(prev => [`Result submitted for ${selectedMatch.roundName} Match ${selectedMatch.position}. Waiting for opponent confirmation.`, ...prev]);
    setLastUpdate('Result submitted');
  };

  const confirmResult = () => {
    if (!selectedMatch || !winnerFromScores || score1 === '' || score2 === '') return;
    const winner = TEAMS.find(t => t.id === winnerFromScores);
    setLiveMatches(prev => advanceWinner(prev, {
      matchId: selectedMatch.id,
      score1: Number(score1),
      score2: Number(score2),
      winnerId: winnerFromScores,
    }));
    setResultLog(prev => [`Opponent confirmed. ${winner?.name ?? 'Winner'} advanced to the next round.`, ...prev]);
    setLastUpdate('Winner advanced');
    setScore1('');
    setScore2('');
    setProofName('');
  };

  const disputeMatch = () => {
    if (!selectedMatch) return;
    setLiveMatches(prev => markMatchDisputed(prev, selectedMatch.id));
    setResultLog(prev => [`Dispute opened for ${selectedMatch.roundName} Match ${selectedMatch.position}. Admin review required.`, ...prev]);
    setLastUpdate('Dispute opened');
  };

  const simulateRealtime = () => {
    const target = liveMatches.find(m => m.team1Id && m.team2Id && m.status !== 'completed' && m.status !== 'disputed');
    if (!target) {
      setLastUpdate('No playable match available');
      return;
    }
    const s1 = Math.floor(Math.random() * 3);
    let s2 = Math.floor(Math.random() * 3);
    if (s1 === s2) s2 = s1 === 2 ? 1 : s1 + 1;
    const winnerId = s1 > s2 ? target.team1Id! : target.team2Id!;
    setLiveMatches(prev => advanceWinner(prev, { matchId: target.id, score1: s1, score2: s2, winnerId }));
    const winner = TEAMS.find(t => t.id === winnerId);
    setSelectedMatchId(target.id);
    setResultLog(prev => [`Realtime demo confirmed ${winner?.name ?? 'winner'} ${s1}-${s2} in ${target.roundName}.`, ...prev]);
    setLastUpdate('Realtime result applied');
  };

  return (
    <div className="min-h-screen pt-20 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <Link to={`/tournaments/${tournament.id}`}
              className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Tournament
            </Link>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${game.color}15`, color: game.color }}>
                {game.shortName}
              </span>
              <span className="text-xs text-white/30">{tournament.format.replace('_', ' ')}</span>
            </div>
            <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 700 }}>
              {tournament.name}
            </h1>
            <p className="text-white/40 text-sm mt-1">Phase 5 bracket engine · {seededTeams.length} checked-in seeds · {liveMatches.length} match records</p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap justify-end gap-2">
              <button
                onClick={() => setRealtimeActive(p => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: realtimeActive ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${realtimeActive ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  color: realtimeActive ? '#4ade80' : 'rgba(255,255,255,0.4)',
                }}
              >
                {realtimeActive ? <><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /><Radio size={11} /> Live-ready</> : <><RefreshCw size={11} /> Paused</>}
              </button>
              <button onClick={simulateRealtime}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
                style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.22)', color: '#00d4ff' }}>
                <Zap size={11} /> Simulate result
              </button>
              <button onClick={generateBracketAgain}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
                style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.22)', color: '#a855f7' }}>
                <Wand2 size={11} /> Generate bracket
              </button>
            </div>
            <AnimatePresence mode="wait">
              {lastUpdate && (
                <motion.span key={lastUpdate} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {lastUpdate}
                </motion.span>
              )}
            </AnimatePresence>
            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              {(['bracket', 'standings'] as const).map(v => (
                <button key={v} onClick={() => setActiveView(v)}
                  className="px-4 py-2 text-sm capitalize transition-all"
                  style={activeView === v
                    ? { background: 'rgba(0,212,255,0.15)', color: '#00d4ff' }
                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeView === 'standings' ? (
          <StandingsView teams={seededTeams} />
        ) : liveMatches.length === 0 ? (
          <div className="rounded-2xl border p-8 text-center" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <Trophy className="w-10 h-10 mx-auto mb-3 text-white/20" />
            <h3 className="text-white mb-2">This format is prepared as a placeholder</h3>
            <p className="text-sm text-white/40 mb-5">Single elimination is implemented now. Double elimination, round-robin, and Swiss can plug into the same match model later.</p>
            <button onClick={generateBracketAgain} className="px-5 py-2.5 rounded-xl text-sm text-white" style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
              Generate Single Elimination Demo
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 mb-6">
              {Object.entries(MATCH_STATUS_STYLE).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5 text-xs text-white/40">
                  <span className="w-2 h-2 rounded-full" style={{ background: v.color }} />
                  {v.label}
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto pb-6">
              <div className="flex gap-8 items-start min-w-max">
                {rounds.map(({ round, matches, label }) => (
                  <RoundColumn key={round} round={round} matches={matches} label={label} selectedMatchId={selectedMatch?.id ?? null} onSelect={setSelectedMatchId} />
                ))}
                <div className="flex flex-col items-center justify-center gap-2" style={{ paddingTop: '32px' }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,140,0,0.1))', border: '1px solid rgba(255,215,0,0.2)' }}>
                    <Trophy className="w-7 h-7" style={{ color: '#ffd700' }} />
                  </div>
                  <span className="text-xs text-white/40">Champion</span>
                  {(() => {
                    const finalMatch = liveMatches.find(m => m.round === Math.max(...liveMatches.map(x => x.round)));
                    const winner = TEAMS.find(t => t.id === finalMatch?.winnerId);
                    return winner ? (
                      <div className="text-center">
                        <p className="text-xs text-white mt-1" style={{ fontWeight: 600 }}>{winner.name}</p>
                        <p className="text-[10px] text-white/40">[{winner.tag}]</p>
                      </div>
                    ) : <span className="text-xs text-white/25 mt-1">TBD</span>;
                  })()}
                </div>
              </div>
            </div>

            <div className="md:hidden">
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => setMobileRound(Math.max(1, mobileRound - 1))} disabled={mobileRound === 1}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/60 disabled:opacity-30 border"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <ArrowLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="text-sm text-white">
                  {rounds.find(r => r.round === mobileRound)?.label ?? `Round ${mobileRound}`}
                  <span className="text-white/40 ml-1">({mobileRound}/{rounds.length})</span>
                </span>
                <button onClick={() => setMobileRound(Math.min(rounds.length, mobileRound + 1))} disabled={mobileRound === rounds.length}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/60 disabled:opacity-30 border"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  Next <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>
              <div className="space-y-3">
                {rounds.find(r => r.round === mobileRound)?.matches.map(m => (
                  <BracketMatch key={m.id} match={m} isCompact isSelected={selectedMatch?.id === m.id} onSelect={setSelectedMatchId} />
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-8">
              {rounds.map(r => (
                <button key={r.round} onClick={() => setMobileRound(r.round)}
                  className="w-2 h-2 rounded-full transition-all duration-200 md:cursor-default"
                  style={{ background: r.round === mobileRound ? '#00d4ff' : 'rgba(255,255,255,0.15)' }} />
              ))}
            </div>
          </>
        )}

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl p-6 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <h3 className="text-white mb-1 flex items-center gap-2" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              <ClipboardCheck className="w-4 h-4" style={{ color: '#00d4ff' }} /> Phase 6 Result Center
            </h3>
            <p className="text-sm text-white/40 mb-5">Submit a captain result, wait for opponent confirmation, then advance the winner. Disputes freeze the match for admin review.</p>

            {selectedMatch ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 p-4 rounded-xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="text-xs text-white/40">Selected match</p>
                    <p className="text-sm text-white">{selectedMatch.roundName} · Match {selectedMatch.position}</p>
                  </div>
                  <Link to={`/matches/${selectedMatch.id}`} className="text-xs px-3 py-2 rounded-lg border" style={{ color: '#00d4ff', borderColor: 'rgba(0,212,255,0.2)' }}>
                    Match page
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs text-white/40">{selectedTeam1?.name ?? 'Team A'} Score</label>
                    <input value={score1} onChange={e => setScore1(e.target.value)} type="number" min="0" max="5" placeholder="0" disabled={!selectedReady}
                      className="w-full px-4 py-2.5 rounded-xl text-white outline-none text-center text-lg disabled:opacity-40"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs text-white/40">{selectedTeam2?.name ?? 'Team B'} Score</label>
                    <input value={score2} onChange={e => setScore2(e.target.value)} type="number" min="0" max="5" placeholder="0" disabled={!selectedReady}
                      className="w-full px-4 py-2.5 rounded-xl text-white outline-none text-center text-lg disabled:opacity-40"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }} />
                  </div>
                </div>

                <label className="border border-dashed rounded-xl py-5 flex flex-col items-center gap-2 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                  <Upload className="w-5 h-5 text-white/20" />
                  <span className="text-xs text-white/30">{proofName || 'Attach screenshot proof'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setProofName(e.target.files?.[0]?.name ?? '')} />
                </label>

                {winnerFromScores && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.12)', color: '#4ade80' }}>
                    <ShieldCheck className="w-4 h-4" /> Claimed winner: {TEAMS.find(t => t.id === winnerFromScores)?.name}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button onClick={submitResult} disabled={!selectedReady || !winnerFromScores}
                    className="flex-1 min-w-[150px] py-3 rounded-xl text-sm text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
                    Submit Result
                  </button>
                  <button onClick={confirmResult} disabled={!selectedReady || !winnerFromScores}
                    className="flex-1 min-w-[150px] py-3 rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80', fontWeight: 600 }}>
                    Opponent Confirm + Advance
                  </button>
                  <button onClick={disputeMatch} disabled={!selectedReady}
                    className="px-5 py-3 rounded-xl text-sm border transition-colors hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: 'rgba(255,70,85,0.3)', color: '#ff4655' }}>
                    Dispute
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/40">Generate a bracket first.</p>
            )}
          </div>

          <div className="rounded-2xl p-6 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <h3 className="text-white mb-4 flex items-center gap-2" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              <Clock className="w-4 h-4" style={{ color: '#ffd700' }} /> Activity Log
            </h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {resultLog.length === 0 ? (
                <p className="text-xs text-white/35">No local actions yet. Submit, confirm, dispute, or simulate a result to see Phase 5–6 flow.</p>
              ) : resultLog.map((log, i) => (
                <div key={i} className="flex gap-2 text-xs text-white/55">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: i === 0 ? '#00d4ff' : 'rgba(255,255,255,0.2)' }} />
                  <span>{log}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 p-3 rounded-xl text-xs" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.12)', color: 'rgba(255,255,255,0.55)' }}>
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" style={{ color: '#ffd700' }} /> This is sandbox/local state. Supabase tables can replace this state later without changing the UI model.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

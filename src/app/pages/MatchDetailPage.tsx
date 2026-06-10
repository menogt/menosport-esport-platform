import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Trophy, CheckCircle, Clock, AlertTriangle, Upload, X,
  MessageSquare, Zap, Send, Check, Loader, Shield, Camera
} from 'lucide-react';
import { MATCHES, TEAMS, TOURNAMENTS, GAMES } from '../data/dummy';
import { useAuth } from '../context/AuthContext';

type ReportStatus = 'idle' | 'submitting' | 'submitted' | 'confirmed' | 'disputed';
type DisputeStatus = 'idle' | 'submitting' | 'submitted';

const MATCH_STATUS_STYLE = {
  upcoming: { label: 'Scheduled', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  live: { label: 'LIVE', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  waiting_result: { label: 'Awaiting Result', color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
  disputed: { label: 'Disputed', color: '#ff4655', bg: 'rgba(255,70,85,0.12)' },
  completed: { label: 'Completed', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const match = MATCHES.find(m => m.id === id);

  const [reportStatus, setReportStatus] = useState<ReportStatus>('idle');
  const [disputeStatus, setDisputeStatus] = useState<DisputeStatus>('idle');
  const [activePanel, setActivePanel] = useState<'report' | 'dispute' | null>(null);
  const [myScore, setMyScore] = useState('');
  const [oppScore, setOppScore] = useState('');
  const [resultNotes, setResultNotes] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40">Match not found.</p>
          <Link to="/tournaments" className="text-sm mt-3 inline-block" style={{ color: '#00d4ff' }}>← Tournaments</Link>
        </div>
      </div>
    );
  }

  const team1 = TEAMS.find(t => t.id === match.team1Id);
  const team2 = TEAMS.find(t => t.id === match.team2Id);
  const tournament = TOURNAMENTS.find(t => t.id === match.tournamentId);
  const game = tournament ? GAMES.find(g => g.id === tournament.game) : null;
  const statusStyle = MATCH_STATUS_STYLE[match.status];
  const winner = TEAMS.find(t => t.id === match.winnerId);
  const isUserTeam = (tid: string | null) => user?.teamId === tid;
  const userIsParticipant = isUserTeam(match.team1Id) || isUserTeam(match.team2Id);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    const url = URL.createObjectURL(file);
    setScreenshotPreview(url);
  };

  const handleSubmitResult = async () => {
    if (!myScore || !oppScore) return;
    setReportStatus('submitting');
    await new Promise(r => setTimeout(r, 1200));
    setReportStatus('submitted');
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) return;
    setDisputeStatus('submitting');
    await new Promise(r => setTimeout(r, 1000));
    setDisputeStatus('submitted');
  };

  return (
    <div className="min-h-screen pt-20 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-white/30 mb-6 mt-4">
          {tournament && (
            <>
              <Link to={`/tournaments/${tournament.id}`} className="hover:text-white/60 transition-colors">
                {tournament.name}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="text-white/50">{match.roundName}</span>
        </div>

        {/* Match card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="rounded-2xl overflow-hidden border mb-6"
          style={{
            background: 'rgba(13,14,26,0.9)',
            borderColor: match.status === 'live' ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.08)',
            boxShadow: match.status === 'live' ? '0 0 40px rgba(74,222,128,0.08)' : 'none',
          }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: match.status === 'live' ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.02)' }}>
            <span className="text-xs flex items-center gap-1.5" style={{ color: statusStyle.color }}>
              {match.status === 'live' && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4ade80' }} />}
              {statusStyle.label}
            </span>
            <span className="text-xs text-white/30">{match.roundName}</span>
            <span className="text-xs text-white/30">{new Date(match.scheduledTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Teams vs score */}
          <div className="px-6 py-8">
            <div className="flex items-center justify-between gap-4">
              {/* Team 1 */}
              <div className="flex flex-col items-center gap-3 flex-1">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-lg"
                  style={{
                    background: game ? `${game.color}20` : 'rgba(255,255,255,0.08)',
                    border: `2px solid ${match.winnerId === match.team1Id ? '#4ade80' : game ? `${game.color}30` : 'rgba(255,255,255,0.12)'}`,
                    fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                    opacity: match.winnerId && match.winnerId !== match.team1Id ? 0.5 : 1,
                  }}>
                  {team1?.logo ?? '?'}
                </div>
                <div className="text-center">
                  <p className="text-sm text-white" style={{ fontWeight: 600 }}>{team1?.name ?? 'TBD'}</p>
                  <p className="text-xs text-white/40">[{team1?.tag ?? '?'}]</p>
                </div>
                {match.winnerId === match.team1Id && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>
                    <CheckCircle className="w-3 h-3" /> Winner
                  </span>
                )}
              </div>

              {/* Score */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                {match.score1 !== null ? (
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '3rem', fontWeight: 700, color: match.winnerId === match.team1Id ? '#4ade80' : match.status === 'completed' ? '#ff4655' : 'rgba(255,255,255,0.7)' }}>
                      {match.score1}
                    </span>
                    <span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.2)', fontFamily: "'Rajdhani', sans-serif" }}>:</span>
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '3rem', fontWeight: 700, color: match.winnerId === match.team2Id ? '#4ade80' : match.status === 'completed' ? '#ff4655' : 'rgba(255,255,255,0.7)' }}>
                      {match.score2}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '2.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.15)' }}>—</span>
                    <span style={{ color: 'rgba(255,255,255,0.1)', fontFamily: "'Rajdhani', sans-serif" }}>vs</span>
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '2.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.15)' }}>—</span>
                  </div>
                )}
                {game && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${game.color}15`, color: game.color }}>{game.shortName}</span>}
              </div>

              {/* Team 2 */}
              <div className="flex flex-col items-center gap-3 flex-1">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-lg"
                  style={{
                    background: 'rgba(168,85,247,0.15)',
                    border: `2px solid ${match.winnerId === match.team2Id ? '#4ade80' : 'rgba(168,85,247,0.25)'}`,
                    fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                    opacity: match.winnerId && match.winnerId !== match.team2Id ? 0.5 : 1,
                  }}>
                  {team2?.logo ?? '?'}
                </div>
                <div className="text-center">
                  <p className="text-sm text-white" style={{ fontWeight: 600 }}>{team2?.name ?? 'TBD'}</p>
                  <p className="text-xs text-white/40">[{team2?.tag ?? '?'}]</p>
                </div>
                {match.winnerId === match.team2Id && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>
                    <CheckCircle className="w-3 h-3" /> Winner
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action buttons for captain/participant */}
        {isAuthenticated && userIsParticipant && (match.status === 'live' || match.status === 'waiting_result') && reportStatus === 'idle' && (
          <div className="flex gap-3 mb-6">
            <button onClick={() => setActivePanel(activePanel === 'report' ? null : 'report')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all"
              style={activePanel === 'report'
                ? { background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff', fontWeight: 600 }
                : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
              <Zap className="w-4 h-4" /> Report Result
            </button>
            <button onClick={() => setActivePanel(activePanel === 'dispute' ? null : 'dispute')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm border transition-all"
              style={activePanel === 'dispute'
                ? { background: 'rgba(255,70,85,0.12)', border: '1px solid rgba(255,70,85,0.3)', color: '#ff4655', fontWeight: 600 }
                : { borderColor: 'rgba(255,70,85,0.2)', color: '#ff4655' }}>
              <AlertTriangle className="w-4 h-4" /> Dispute
            </button>
          </div>
        )}

        {/* Report submitted banner */}
        {reportStatus === 'submitted' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border mb-6"
            style={{ background: 'rgba(0,212,255,0.08)', borderColor: 'rgba(0,212,255,0.2)' }}>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#00d4ff' }} />
              <div className="flex-1">
                <p className="text-sm text-white" style={{ fontWeight: 600 }}>Result Submitted</p>
                <p className="text-xs text-white/50">Waiting for opponent to confirm. Score: {myScore}–{oppScore}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pl-8">
              <button onClick={() => setReportStatus('confirmed')}
                className="px-4 py-2 rounded-lg text-xs"
                style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80', fontWeight: 600 }}>
                Opponent Confirms
              </button>
              <button onClick={() => { setReportStatus('disputed'); setDisputeStatus('submitted'); }}
                className="px-4 py-2 rounded-lg text-xs"
                style={{ background: 'rgba(255,70,85,0.12)', border: '1px solid rgba(255,70,85,0.25)', color: '#ff4655', fontWeight: 600 }}>
                Opponent Disputes
              </button>
            </div>
          </motion.div>
        )}

        {reportStatus === 'confirmed' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl border mb-6"
            style={{ background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.2)' }}>
            <Check className="w-5 h-5 flex-shrink-0" style={{ color: '#4ade80' }} />
            <div>
              <p className="text-sm text-white" style={{ fontWeight: 600 }}>Result Confirmed</p>
              <p className="text-xs text-white/50">The bracket can now advance the winner from the bracket page.</p>
            </div>
          </motion.div>
        )}

        {reportStatus === 'disputed' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl border mb-6"
            style={{ background: 'rgba(255,70,85,0.08)', borderColor: 'rgba(255,70,85,0.2)' }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#ff4655' }} />
            <div>
              <p className="text-sm text-white" style={{ fontWeight: 600 }}>Result Disputed</p>
              <p className="text-xs text-white/50">A dispute ticket has been created for admin review.</p>
            </div>
          </motion.div>
        )}

        {/* Result Report Panel */}
        <AnimatePresence>
          {activePanel === 'report' && reportStatus !== 'submitted' && reportStatus !== 'confirmed' && reportStatus !== 'disputed' && (
            <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }} transition={{ duration: 0.25 }}
              className="rounded-2xl overflow-hidden border mb-6"
              style={{ background: 'rgba(13,14,26,0.9)', borderColor: 'rgba(0,212,255,0.15)' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
                <span className="text-sm text-white flex items-center gap-2" style={{ fontWeight: 600 }}>
                  <Zap className="w-4 h-4" style={{ color: '#00d4ff' }} /> Submit Match Result
                </span>
                <button onClick={() => setActivePanel(null)} className="text-white/30 hover:text-white/60 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-5">
                {/* Score inputs */}
                <div>
                  <p className="text-xs text-white/50 mb-3">Enter the final score</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] text-white/30 mb-1.5">{user?.teamId === match.team1Id ? team1?.name ?? 'Your Team' : team2?.name ?? 'Your Team'}</label>
                      <input value={myScore} onChange={e => setMyScore(e.target.value)} type="number" min="0" max="5" placeholder="0"
                        className="w-full text-center py-4 rounded-xl text-white outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: "'Rajdhani', sans-serif", fontSize: '2rem', fontWeight: 700 }} />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'Rajdhani', sans-serif", fontSize: '1.5rem' }}>–</span>
                    <div className="flex-1">
                      <label className="block text-[10px] text-white/30 mb-1.5">{user?.teamId === match.team1Id ? team2?.name ?? 'Opponent' : team1?.name ?? 'Opponent'}</label>
                      <input value={oppScore} onChange={e => setOppScore(e.target.value)} type="number" min="0" max="5" placeholder="0"
                        className="w-full text-center py-4 rounded-xl text-white outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: "'Rajdhani', sans-serif", fontSize: '2rem', fontWeight: 700 }} />
                    </div>
                  </div>
                </div>

                {/* Screenshot upload */}
                <div>
                  <label className="block text-xs text-white/50 mb-2">Screenshot Proof <span className="text-white/25">(recommended)</span></label>
                  {screenshotPreview ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img src={screenshotPreview} alt="Screenshot" className="w-full h-40 object-cover" />
                      <button onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white"
                        style={{ background: 'rgba(0,0,0,0.6)' }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="border border-dashed rounded-xl py-8 flex flex-col items-center gap-2 cursor-pointer hover:bg-white/[0.02] transition-colors"
                      style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                      <Camera className="w-7 h-7 text-white/20" />
                      <span className="text-sm text-white/30">Click to upload screenshot</span>
                      <span className="text-xs text-white/20">PNG, JPG up to 10MB</span>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Notes <span className="text-white/25">(optional)</span></label>
                  <textarea value={resultNotes} onChange={e => setResultNotes(e.target.value)}
                    placeholder="Any additional notes about the match..."
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none resize-none"
                    rows={2}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setActivePanel(null)}
                    className="flex-1 py-3 rounded-xl text-sm text-white/60 border hover:bg-white/5 transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Cancel</button>
                  <button onClick={handleSubmitResult} disabled={!myScore || !oppScore || reportStatus === 'submitting'}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
                    {reportStatus === 'submitting' ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {reportStatus === 'submitting' ? 'Submitting...' : 'Submit Result'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dispute Panel */}
        <AnimatePresence>
          {activePanel === 'dispute' && disputeStatus !== 'submitted' && (
            <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }} transition={{ duration: 0.25 }}
              className="rounded-2xl overflow-hidden border mb-6"
              style={{ background: 'rgba(13,14,26,0.9)', borderColor: 'rgba(255,70,85,0.2)' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,70,85,0.12)' }}>
                <span className="text-sm flex items-center gap-2" style={{ fontWeight: 600, color: '#ff4655' }}>
                  <AlertTriangle className="w-4 h-4" /> File a Dispute
                </span>
                <button onClick={() => setActivePanel(null)} className="text-white/30 hover:text-white/60 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-2 p-3 rounded-xl text-xs text-white/60"
                  style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.12)' }}>
                  <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#ffd700' }} />
                  <span>Disputes are reviewed by admins within 24 hours. False disputes may result in a penalty. Only file if there's a genuine discrepancy.</span>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Reason for Dispute *</label>
                  <select value={disputeReason} onChange={e => setDisputeReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: disputeReason ? 'white' : 'rgba(255,255,255,0.3)' }}>
                    <option value="" disabled>Select reason...</option>
                    {['Wrong score reported', 'Technical disconnection', 'Rule violation', 'Match integrity issue', 'Other'].map(r =>
                      <option key={r} value={r} style={{ background: '#0d0e1a', color: 'white' }}>{r}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Evidence / Details *</label>
                  <textarea value={disputeEvidence} onChange={e => setDisputeEvidence(e.target.value)}
                    placeholder="Describe the issue in detail. Include what happened, when, and any relevant context..."
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none resize-none"
                    rows={3}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                {/* Screenshot upload for dispute */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Evidence Screenshot</label>
                  <div onClick={() => fileRef.current?.click()}
                    className="border border-dashed rounded-xl py-5 flex flex-col items-center gap-1.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: 'rgba(255,70,85,0.2)' }}>
                    <Upload className="w-5 h-5 text-white/20" />
                    <span className="text-xs text-white/30">Upload screenshot</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setActivePanel(null)}
                    className="flex-1 py-3 rounded-xl text-sm text-white/60 border hover:bg-white/5 transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Cancel</button>
                  <button onClick={handleDispute}
                    disabled={!disputeReason || !disputeEvidence.trim() || disputeStatus === 'submitting'}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{ background: 'rgba(255,70,85,0.2)', border: '1px solid rgba(255,70,85,0.35)', color: '#ff4655', fontWeight: 600 }}>
                    {disputeStatus === 'submitting' ? <Loader className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                    {disputeStatus === 'submitting' ? 'Submitting...' : 'File Dispute'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {disputeStatus === 'submitted' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl border mb-6"
            style={{ background: 'rgba(255,70,85,0.08)', borderColor: 'rgba(255,70,85,0.2)' }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#ff4655' }} />
            <div>
              <p className="text-sm text-white" style={{ fontWeight: 600 }}>Dispute Filed</p>
              <p className="text-xs text-white/50">An admin will review your dispute within 24 hours. You will be notified of the decision.</p>
            </div>
          </motion.div>
        )}

        {/* Match info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <h3 className="text-xs text-white/40 mb-3" style={{ letterSpacing: '0.08em' }}>MATCH DETAILS</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Tournament', value: tournament?.name ?? '—' },
                { label: 'Round', value: match.roundName },
                { label: 'Format', value: tournament?.format.replace('_', ' ') ?? '—' },
                { label: 'Scheduled', value: new Date(match.scheduledTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                { label: 'Status', value: MATCH_STATUS_STYLE[match.status].label },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-white/40">{label}</span>
                  <span className="text-white/70 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next match info */}
          {tournament && (
            <div className="rounded-xl p-5 border" style={{ background: 'rgba(13,14,26,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <h3 className="text-xs text-white/40 mb-3" style={{ letterSpacing: '0.08em' }}>BRACKET</h3>
              <div className="space-y-3">
                <Link to={`/brackets/${tournament.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border hover:bg-white/[0.02] transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <span className="text-sm text-white/70">View Full Bracket</span>
                  <ArrowLeft className="w-4 h-4 text-white/30 rotate-180" />
                </Link>
                <Link to={`/tournaments/${tournament.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border hover:bg-white/[0.02] transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <span className="text-sm text-white/70">Tournament Page</span>
                  <ArrowLeft className="w-4 h-4 text-white/30 rotate-180" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

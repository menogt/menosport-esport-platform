import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Check, Plus, Trash2, Loader, AlertCircle, Twitch, DollarSign, Users, Calendar } from 'lucide-react';
import { GAMES } from '../data/dummy';
import { useAuth } from '../context/AuthContext';
import type { TournamentFormat } from '../data/dummy';

const REGIONS = ['SEA', 'EU', 'NA', 'LATAM', 'APAC', 'SA', 'Global'];
const FORMATS: { key: TournamentFormat; label: string; desc: string }[] = [
  { key: 'single_elimination', label: 'Single Elimination', desc: 'Lose once and you\'re out. Simple and fast.' },
  { key: 'double_elimination', label: 'Double Elimination', desc: 'Teams get a second chance in the loser\'s bracket.' },
  { key: 'round_robin', label: 'Round Robin', desc: 'Every team plays against every other team.' },
  { key: 'swiss', label: 'Swiss Format', desc: 'Players with similar records face each other each round.' },
];
const COVER_GRADIENTS = [
  { label: 'Cyber Blue', value: 'from-cyan-600 via-blue-700 to-indigo-900', preview: 'linear-gradient(135deg, #0891b2, #1d4ed8, #312e81)' },
  { label: 'Neon Red', value: 'from-red-600 via-rose-700 to-pink-900', preview: 'linear-gradient(135deg, #dc2626, #be123c, #831843)' },
  { label: 'Gold', value: 'from-yellow-500 via-orange-600 to-red-800', preview: 'linear-gradient(135deg, #eab308, #ea580c, #991b1b)' },
  { label: 'Emerald', value: 'from-green-600 via-emerald-700 to-teal-900', preview: 'linear-gradient(135deg, #16a34a, #047857, #134e4a)' },
  { label: 'Purple', value: 'from-purple-600 via-violet-700 to-indigo-900', preview: 'linear-gradient(135deg, #9333ea, #6d28d9, #312e81)' },
];

type Step = 1 | 2 | 3;

export function CreateTournamentPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [basic, setBasic] = useState({
    name: '',
    game: '',
    region: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    coverGradient: COVER_GRADIENTS[0].value,
  });

  const [settings, setSettings] = useState({
    format: 'single_elimination' as TournamentFormat,
    maxTeams: '16',
    entryFee: '0',
    prizePool: '',
    sponsor: '',
    streamLink: '',
  });

  const [rules, setRules] = useState(['']);
  const [prizeBreakdown, setPrizeBreakdown] = useState([
    { place: '1st', percentage: '60' },
    { place: '2nd', percentage: '25' },
    { place: '3rd–4th', percentage: '15' },
  ]);

  const setBasicField = (f: keyof typeof basic) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setBasic(p => ({ ...p, [f]: e.target.value }));
  const setSettField = (f: keyof typeof settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setSettings(p => ({ ...p, [f]: e.target.value }));

  const validateStep1 = () => {
    if (!basic.name.trim()) { setError('Tournament name is required.'); return false; }
    if (!basic.game) { setError('Please select a game.'); return false; }
    if (!basic.region) { setError('Please select a region.'); return false; }
    if (!basic.startDate) { setError('Start date is required.'); return false; }
    if (!basic.registrationDeadline) { setError('Registration deadline is required.'); return false; }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!settings.prizePool || isNaN(Number(settings.prizePool))) { setError('Enter a valid prize pool amount.'); return false; }
    if (Number(settings.maxTeams) < 2) { setError('Need at least 2 teams.'); return false; }
    const total = prizeBreakdown.reduce((s, p) => s + Number(p.percentage), 0);
    if (total !== 100) { setError(`Prize percentages must total 100% (currently ${total}%).`); return false; }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => navigate('/tournaments'), 2500);
  };

  const selectedGame = GAMES.find(g => g.id === basic.game);

  if (!isAuthenticated || (user?.role !== 'organizer' && user?.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 mb-2">Only Organizers can host tournaments.</p>
          <p className="text-xs text-white/25 mb-4">Sign in as an Organizer or Admin to continue.</p>
          <Link to="/login" className="px-6 py-2.5 rounded-xl text-sm text-white" style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)' }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(74,222,128,0.15)', border: '2px solid rgba(74,222,128,0.3)' }}>
            <Check className="w-10 h-10" style={{ color: '#4ade80' }} />
          </div>
          <h2 className="text-white mb-2" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '2rem', fontWeight: 700 }}>Tournament Created!</h2>
          <p className="text-white/40 text-sm">Redirecting to Tournaments page...</p>
        </motion.div>
      </div>
    );
  }

  const STEPS = [
    { n: 1, label: 'Basics' },
    { n: 2, label: 'Settings' },
    { n: 3, label: 'Rules' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link to="/tournaments" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Tournaments
          </Link>
          <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 700 }}>
            HOST TOURNAMENT
          </h1>
          <p className="text-white/40 text-sm mt-1">Create a competitive event for your community.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center mb-10">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all"
                  style={{ background: s.n < step ? '#4ade80' : s.n === step ? 'linear-gradient(135deg, #00d4ff, #0066ff)' : 'rgba(255,255,255,0.08)', color: s.n <= step ? 'white' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                  {s.n < step ? <Check className="w-4 h-4" /> : s.n}
                </div>
                <span className="text-[10px] mt-1 whitespace-nowrap" style={{ color: s.n <= step ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)' }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 rounded-full" style={{ background: step > s.n ? '#4ade80' : 'rgba(255,255,255,0.1)' }} />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-8 border" style={{ background: 'rgba(13,14,26,0.9)', borderColor: 'rgba(255,255,255,0.08)' }}>
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-6"
              style={{ background: 'rgba(255,70,85,0.1)', border: '1px solid rgba(255,70,85,0.2)', color: '#ff4655' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* STEP 1 — Basic Info */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Tournament Name *</label>
                <input value={basic.name} onChange={setBasicField('name')} placeholder="e.g. SEA Championship Season 5"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Game *</label>
                  <select value={basic.game} onChange={setBasicField('game')}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: basic.game ? 'white' : 'rgba(255,255,255,0.3)' }}>
                    <option value="" disabled>Select game...</option>
                    {GAMES.map(g => <option key={g.id} value={g.id} style={{ background: '#0d0e1a', color: 'white' }}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Region *</label>
                  <select value={basic.region} onChange={setBasicField('region')}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: basic.region ? 'white' : 'rgba(255,255,255,0.3)' }}>
                    <option value="" disabled>Select region...</option>
                    {REGIONS.map(r => <option key={r} value={r} style={{ background: '#0d0e1a', color: 'white' }}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Registration Deadline *</label>
                  <input type="date" value={basic.registrationDeadline} onChange={setBasicField('registrationDeadline')}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Start Date *</label>
                  <input type="date" value={basic.startDate} onChange={setBasicField('startDate')}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">End Date</label>
                <input type="date" value={basic.endDate} onChange={setBasicField('endDate')}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
              </div>
              {/* Cover gradient */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Cover Style</label>
                <div className="flex gap-2">
                  {COVER_GRADIENTS.map(g => (
                    <button key={g.value} onClick={() => setBasic(p => ({ ...p, coverGradient: g.value }))}
                      className="w-10 h-10 rounded-xl transition-all hover:scale-110 flex-shrink-0"
                      style={{ background: g.preview, border: basic.coverGradient === g.value ? '2px solid white' : '2px solid transparent', boxShadow: basic.coverGradient === g.value ? '0 0 12px rgba(255,255,255,0.3)' : 'none' }}
                      title={g.label} />
                  ))}
                </div>
                {/* Preview */}
                <div className={`mt-3 h-12 rounded-xl bg-gradient-to-r ${basic.coverGradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 flex items-center px-4">
                    <span className="text-xs text-white/70 truncate">{basic.name || 'Tournament Name'}</span>
                    {selectedGame && (
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full text-white" style={{ background: `${selectedGame.color}40` }}>{selectedGame.shortName}</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => { if (validateStep1()) setStep(2); }}
                className="w-full py-3.5 rounded-xl text-sm text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
                Continue →
              </button>
            </motion.div>
          )}

          {/* STEP 2 — Settings */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
              {/* Format selection */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Tournament Format *</label>
                <div className="space-y-2">
                  {FORMATS.map(f => (
                    <button key={f.key} onClick={() => setSettings(p => ({ ...p, format: f.key }))}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left"
                      style={settings.format === f.key
                        ? { background: 'rgba(0,212,255,0.08)', borderColor: 'rgba(0,212,255,0.3)' }
                        : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: settings.format === f.key ? '#00d4ff' : 'rgba(255,255,255,0.2)' }}>
                        {settings.format === f.key && <div className="w-2 h-2 rounded-full" style={{ background: '#00d4ff' }} />}
                      </div>
                      <div>
                        <p className="text-sm text-white" style={{ fontWeight: 600 }}>{f.label}</p>
                        <p className="text-xs text-white/40">{f.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Max Teams *</label>
                  <select value={settings.maxTeams} onChange={setSettField('maxTeams')}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {[4, 8, 16, 32, 64].map(n => <option key={n} value={n} style={{ background: '#0d0e1a' }}>{n} Teams</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Entry Fee (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input value={settings.entryFee} onChange={setSettField('entryFee')} type="number" min="0" placeholder="0 = Free"
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5">Total Prize Pool (USD) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={settings.prizePool} onChange={setSettField('prizePool')} type="number" min="0" placeholder="e.g. 10000"
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              </div>

              {/* Prize breakdown */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Prize Distribution <span className="text-white/30">(must total 100%)</span></label>
                <div className="space-y-2">
                  {prizeBreakdown.map((pb, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-white/50 w-16 flex-shrink-0">{pb.place}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <input value={pb.percentage} onChange={e => setPrizeBreakdown(prev => prev.map((p, j) => j === i ? { ...p, percentage: e.target.value } : p))}
                          type="number" min="0" max="100" placeholder="%"
                          className="w-20 px-3 py-2 rounded-lg text-sm text-white outline-none text-center"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                        <span className="text-xs text-white/30">%</span>
                        {settings.prizePool && !isNaN(Number(settings.prizePool)) && (
                          <span className="text-xs text-white/40">= ${(Number(settings.prizePool) * Number(pb.percentage) / 100).toLocaleString()}</span>
                        )}
                      </div>
                      {i > 1 && (
                        <button onClick={() => setPrizeBreakdown(prev => prev.filter((_, j) => j !== i))}
                          className="w-7 h-7 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {prizeBreakdown.length < 5 && (
                    <button onClick={() => setPrizeBreakdown(prev => [...prev, { place: `${prev.length + 1}th`, percentage: '0' }])}
                      className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors">
                      <Plus className="w-3 h-3" /> Add place
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Sponsor <span className="text-white/25">(optional)</span></label>
                  <input value={settings.sponsor} onChange={setSettField('sponsor')} placeholder="Sponsor name"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Stream Link <span className="text-white/25">(optional)</span></label>
                  <input value={settings.streamLink} onChange={setSettField('streamLink')} placeholder="twitch.tv/..."
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm text-white/60 border hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>← Back</button>
                <button onClick={() => { if (validateStep2()) setStep(3); }} className="flex-1 py-3 rounded-xl text-sm text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
                  Continue →
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Rules */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
              <div>
                <label className="block text-xs text-white/50 mb-2">Tournament Rules <span className="text-white/25">(add up to 10 rules)</span></label>
                <div className="space-y-2">
                  {rules.map((rule, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="w-7 h-10 flex items-center justify-center flex-shrink-0 text-xs text-white/30"
                        style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>{i + 1}</div>
                      <input value={rule} onChange={e => setRules(prev => prev.map((r, j) => j === i ? e.target.value : r))}
                        placeholder={`Rule ${i + 1}...`}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      {i > 0 && (
                        <button onClick={() => setRules(prev => prev.filter((_, j) => j !== i))}
                          className="w-10 flex items-center justify-center rounded-xl border text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                          style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {rules.length < 10 && (
                    <button onClick={() => setRules(prev => [...prev, ''])}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white/40 border hover:text-white hover:bg-white/5 transition-all w-full"
                      style={{ borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed' }}>
                      <Plus className="w-4 h-4" /> Add rule
                    </button>
                  )}
                </div>
              </div>

              {/* Final summary */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className={`h-10 bg-gradient-to-r ${basic.coverGradient}`} />
                <div className="p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-sm text-white mb-0.5" style={{ fontWeight: 700 }}>{basic.name}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-white/50 mt-2">
                    <span>{GAMES.find(g => g.id === basic.game)?.shortName} · {basic.region}</span>
                    <span>{settings.format.replace('_', ' ')}</span>
                    <span>{settings.maxTeams} teams</span>
                    <span style={{ color: '#ffd700' }}>${Number(settings.prizePool || 0).toLocaleString()} prize</span>
                    {Number(settings.entryFee) === 0 ? <span style={{ color: '#4ade80' }}>Free</span> : <span>${settings.entryFee} entry</span>}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl text-sm text-white/60 border hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>← Back</button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                  {loading ? 'Creating...' : 'Publish Tournament'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Users, Check, Plus, Trash2, Loader, Twitter, MessageSquare, Globe, Upload, AlertCircle } from 'lucide-react';
import { GAMES } from '../data/dummy';
import { useAuth } from '../context/AuthContext';

const REGIONS = ['SEA', 'EU', 'NA', 'LATAM', 'APAC', 'SA', 'Global'];

const GRADIENT_OPTIONS = [
  { label: 'Cyber Blue', value: 'from-cyan-500 via-blue-600 to-indigo-800', preview: 'linear-gradient(135deg, #06b6d4, #2563eb, #3730a3)' },
  { label: 'Neon Purple', value: 'from-purple-500 via-violet-600 to-indigo-800', preview: 'linear-gradient(135deg, #a855f7, #7c3aed, #3730a3)' },
  { label: 'Red Fire', value: 'from-red-500 via-rose-600 to-pink-800', preview: 'linear-gradient(135deg, #ef4444, #e11d48, #9d174d)' },
  { label: 'Gold Rush', value: 'from-yellow-400 via-orange-500 to-red-700', preview: 'linear-gradient(135deg, #facc15, #f97316, #b91c1c)' },
  { label: 'Emerald', value: 'from-green-400 via-emerald-500 to-teal-700', preview: 'linear-gradient(135deg, #4ade80, #10b981, #0f766e)' },
];

type Step = 1 | 2 | 3;

export function CreateTeamPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    tag: '',
    game: '',
    region: '',
    gradient: GRADIENT_OPTIONS[0].value,
  });

  const [social, setSocial] = useState({ twitter: '', discord: '', website: '' });
  const [invites, setInvites] = useState(['', '', '']);

  const setField = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const validateStep1 = () => {
    if (!form.name.trim()) { setError('Team name is required.'); return false; }
    if (!form.tag.trim() || form.tag.length > 5) { setError('Tag must be 1–5 characters.'); return false; }
    if (!form.game) { setError('Select a game.'); return false; }
    if (!form.region) { setError('Select a region.'); return false; }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => navigate('/dashboard/team'), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 mb-4">You need to sign in to create a team.</p>
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
          <h2 className="text-white mb-2" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '2rem', fontWeight: 700 }}>Team Created!</h2>
          <p className="text-white/40 text-sm">Redirecting to your Team Dashboard...</p>
        </motion.div>
      </div>
    );
  }

  const STEPS = [
    { n: 1, label: 'Identity' },
    { n: 2, label: 'Social Links' },
    { n: 3, label: 'Invite Players' },
  ];

  const selectedGame = GAMES.find(g => g.id === form.game);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link to="/teams" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Teams
          </Link>
          <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 700 }}>
            CREATE TEAM
          </h1>
          <p className="text-white/40 text-sm mt-1">Build your squad and start competing.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center mb-10">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all"
                  style={{
                    background: s.n < step ? '#4ade80' : s.n === step ? 'linear-gradient(135deg, #00d4ff, #0066ff)' : 'rgba(255,255,255,0.08)',
                    color: s.n <= step ? 'white' : 'rgba(255,255,255,0.3)',
                    fontWeight: 700,
                  }}>
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
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-6" style={{ background: 'rgba(255,70,85,0.1)', border: '1px solid rgba(255,70,85,0.2)', color: '#ff4655' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Step 1: Identity */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs text-white/50 mb-1.5">Team Name *</label>
                  <input value={form.name} onChange={setField('name')} placeholder="e.g. Phantom Ascent"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs text-white/50 mb-1.5">Team Tag * <span className="text-white/25">(max 5 chars)</span></label>
                  <input value={form.tag} onChange={setField('tag')} placeholder="e.g. PHX" maxLength={5}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none uppercase"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Primary Game *</label>
                  <select value={form.game} onChange={setField('game')}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: form.game ? 'white' : 'rgba(255,255,255,0.3)' }}>
                    <option value="" disabled>Select game...</option>
                    {GAMES.map(g => <option key={g.id} value={g.id} style={{ background: '#0d0e1a', color: 'white' }}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Region *</label>
                  <select value={form.region} onChange={setField('region')}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: form.region ? 'white' : 'rgba(255,255,255,0.3)' }}>
                    <option value="" disabled>Select region...</option>
                    {REGIONS.map(r => <option key={r} value={r} style={{ background: '#0d0e1a', color: 'white' }}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Logo preview */}
              {form.name && (
                <div className="flex items-center gap-4 p-4 rounded-xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{
                      background: selectedGame ? `${selectedGame.color}20` : 'rgba(0,212,255,0.1)',
                      border: `1px solid ${selectedGame?.color ?? '#00d4ff'}30`,
                      fontFamily: "'Rajdhani', sans-serif", fontSize: '1.1rem', fontWeight: 700,
                    }}>
                    {form.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-white" style={{ fontWeight: 600 }}>{form.name || 'Team Name'}</p>
                    <p className="text-xs text-white/40">{form.tag ? `[${form.tag.toUpperCase()}]` : '[TAG]'} · {form.region || 'Region'}</p>
                    {selectedGame && <p className="text-xs mt-0.5" style={{ color: selectedGame.color }}>{selectedGame.shortName}</p>}
                  </div>
                </div>
              )}

              {/* Banner gradient picker */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Team Banner Color</label>
                <div className="flex gap-2 flex-wrap">
                  {GRADIENT_OPTIONS.map(g => (
                    <button key={g.value} onClick={() => setForm(p => ({ ...p, gradient: g.value }))}
                      className="w-10 h-10 rounded-xl transition-all hover:scale-110"
                      style={{ background: g.preview, border: form.gradient === g.value ? '2px solid white' : '2px solid transparent', boxShadow: form.gradient === g.value ? '0 0 12px rgba(255,255,255,0.3)' : 'none' }}
                      title={g.label} />
                  ))}
                </div>
              </div>

              <button onClick={() => { if (validateStep1()) setStep(2); }}
                className="w-full py-3.5 rounded-xl text-sm text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
                Continue →
              </button>
            </motion.div>
          )}

          {/* Step 2: Social Links */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
              <p className="text-sm text-white/60 mb-2">Add your team's social profiles <span className="text-white/30">(all optional)</span></p>
              {[
                { field: 'twitter' as const, label: 'Twitter / X', placeholder: '@yourteam', icon: Twitter },
                { field: 'discord' as const, label: 'Discord Server', placeholder: 'discord.gg/yourserver', icon: MessageSquare },
                { field: 'website' as const, label: 'Website', placeholder: 'https://yourteam.gg', icon: Globe },
              ].map(s => (
                <div key={s.field}>
                  <label className="block text-xs text-white/50 mb-1.5">{s.label}</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <s.icon className="w-4 h-4 text-white/40" />
                    </div>
                    <input value={social[s.field]} onChange={e => setSocial(p => ({ ...p, [s.field]: e.target.value }))}
                      placeholder={s.placeholder}
                      className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm text-white/60 border hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>← Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl text-sm text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
                  Continue →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Invite players */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
              <p className="text-sm text-white/60">Invite players by username or email. You can always invite more later.</p>

              <div className="space-y-2">
                {invites.map((invite, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={invite} onChange={e => setInvites(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                      placeholder={`Player ${i + 1} username or email`}
                      className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    {i > 0 && (
                      <button onClick={() => setInvites(prev => prev.filter((_, j) => j !== i))}
                        className="w-12 flex items-center justify-center rounded-xl border text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                        style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {invites.length < 6 && (
                  <button onClick={() => setInvites(prev => [...prev, ''])}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white/50 border hover:text-white hover:bg-white/5 transition-all w-full"
                    style={{ borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed' }}>
                    <Plus className="w-4 h-4" /> Add another player
                  </button>
                )}
              </div>

              {/* Summary */}
              <div className="rounded-xl p-4 border" style={{ background: 'rgba(0,212,255,0.05)', borderColor: 'rgba(0,212,255,0.15)' }}>
                <p className="text-xs text-white/50 mb-3">Team Summary</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm"
                    style={{ background: 'rgba(0,212,255,0.2)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
                    {form.name.slice(0, 2).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm text-white" style={{ fontWeight: 600 }}>{form.name} [{form.tag.toUpperCase()}]</p>
                    <p className="text-xs text-white/40">{GAMES.find(g => g.id === form.game)?.shortName} · {form.region}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl text-sm text-white/60 border hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>← Back</button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  {loading ? 'Creating Team...' : 'Create Team'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

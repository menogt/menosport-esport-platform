import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Swords, Eye, EyeOff, Zap, Chrome, MessageSquare, Check, AlertCircle, Loader } from 'lucide-react';
import { useAuth, type UserRole } from '../context/AuthContext';

const ROLES: { key: UserRole; label: string; desc: string }[] = [
  { key: 'player', label: 'Player', desc: 'Compete in tournaments individually' },
  { key: 'captain', label: 'Team Captain', desc: 'Lead and manage your team' },
  { key: 'organizer', label: 'Organizer', desc: 'Host and manage tournaments' },
];

const GAMES = ['Mobile Legends: Bang Bang', 'Valorant', 'Free Fire', 'Call of Duty: Mobile'];
const REGIONS = ['SEA', 'EU', 'NA', 'LATAM', 'APAC', 'SA', 'Global'];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole>('player');
  const [game, setGame] = useState('');
  const [region, setRegion] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleStep1 = () => {
    if (!form.username.trim()) { setError('Username is required.'); return; }
    if (!form.email.includes('@')) { setError('Valid email is required.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!game) { setError('Please select your primary game.'); return; }
    if (!region) { setError('Please select your region.'); return; }
    if (!agreed) { setError('Please accept the Terms of Service.'); return; }
    setError('');
    setLoading(true);
    try {
      await register({ ...form, role, game, region });
      if (role === 'organizer') navigate('/dashboard/admin', { replace: true });
      else if (role === 'captain') navigate('/dashboard/team', { replace: true });
      else navigate('/dashboard/player', { replace: true });
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: '#08090f' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(124,58,237,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.02) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}>
              <Swords className="w-5 h-5 text-white" />
            </div>
            <span className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.3rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              ARENA<span style={{ color: '#00d4ff' }}>X</span>
            </span>
          </Link>
          <h1 className="text-white mb-1" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>Create Account</h1>
          <p className="text-white/40 text-sm">Join thousands of competitive players</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6 px-2">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${s <= step ? 'text-white' : 'text-white/30'}`}
                style={{ background: s < step ? '#4ade80' : s === step ? 'linear-gradient(135deg, #00d4ff, #0066ff)' : 'rgba(255,255,255,0.08)', fontWeight: 700 }}>
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              <div className="flex-1">
                <p className="text-[10px]" style={{ color: s <= step ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)' }}>
                  {s === 1 ? 'Account Info' : 'Your Profile'}
                </p>
              </div>
              {s < 2 && <div className="w-6 h-px rounded-full" style={{ background: s < step ? '#4ade80' : 'rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-8 border" style={{ background: 'rgba(13,14,26,0.9)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4" style={{ background: 'rgba(255,70,85,0.1)', border: '1px solid rgba(255,70,85,0.2)', color: '#ff4655' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
              <div className="flex gap-3 mb-4">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-white/70 border hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Chrome className="w-4 h-4" /> Google
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-white/70 border hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <MessageSquare className="w-4 h-4" /> Discord
                </button>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs text-white/30">or email</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Username</label>
                <input value={form.username} onChange={handleChange('username')} placeholder="YourGamerTag" type="text"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Email Address</label>
                <input value={form.email} onChange={handleChange('email')} placeholder="you@example.com" type="email"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Password</label>
                <div className="relative">
                  <input value={form.password} onChange={handleChange('password')} placeholder="Min. 6 characters"
                    type={showPass ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button onClick={handleStep1}
                className="w-full py-3.5 rounded-xl text-sm text-white mt-2 transition-all hover:opacity-90 hover:scale-[1.01]"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
                Continue →
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
              <div>
                <label className="block text-xs text-white/50 mb-3">I am a...</label>
                <div className="space-y-2">
                  {ROLES.map(r => (
                    <button key={r.key} onClick={() => setRole(r.key)}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left"
                      style={role === r.key
                        ? { background: 'rgba(0,212,255,0.1)', borderColor: 'rgba(0,212,255,0.35)' }
                        : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ borderColor: role === r.key ? '#00d4ff' : 'rgba(255,255,255,0.2)' }}>
                        {role === r.key && <div className="w-2 h-2 rounded-full" style={{ background: '#00d4ff' }} />}
                      </div>
                      <div>
                        <p className="text-sm text-white" style={{ fontWeight: 600 }}>{r.label}</p>
                        <p className="text-xs text-white/40">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Primary Game</label>
                <select value={game} onChange={e => setGame(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: game ? 'white' : 'rgba(255,255,255,0.3)' }}>
                  <option value="" disabled>Select your game...</option>
                  {GAMES.map(g => <option key={g} value={g} style={{ background: '#0d0e1a', color: 'white' }}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Region</label>
                <select value={region} onChange={e => setRegion(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: region ? 'white' : 'rgba(255,255,255,0.3)' }}>
                  <option value="" disabled>Select region...</option>
                  {REGIONS.map(r => <option key={r} value={r} style={{ background: '#0d0e1a', color: 'white' }}>{r}</option>)}
                </select>
              </div>
              <label className="flex items-start gap-2.5 text-xs text-white/50 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded flex-shrink-0" style={{ accentColor: '#00d4ff' }} />
                <span>I agree to the <a href="#" style={{ color: '#00d4ff' }}>Terms of Service</a> and <a href="#" style={{ color: '#00d4ff' }}>Privacy Policy</a></span>
              </label>
              <div className="flex gap-3">
                <button onClick={() => { setStep(1); setError(''); }}
                  className="flex-1 py-3 rounded-xl text-sm text-white/60 border hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>← Back</button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', fontWeight: 600 }}>
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </motion.div>
          )}

          <p className="text-center text-sm text-white/40 mt-6">
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#00d4ff' }} className="hover:opacity-80 transition-opacity">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

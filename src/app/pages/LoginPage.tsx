import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { Eye, EyeOff, LogIn, Chrome, MessageSquare, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import menoArenaMark from '../../assets/brand/meno-arena-mark-web.png';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/dashboard/player';

  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo');
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, 'demo');
      navigate(from, { replace: true });
    } catch {
      setError('Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: '#08090f' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6" aria-label="Meno Arena home">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src={menoArenaMark} alt="" className="h-10 w-10 object-contain drop-shadow-[0_0_18px_rgba(255,70,85,0.55)]" />
            </div>
            <span className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.3rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              Meno <span style={{ color: '#ff4655' }}>Arena</span>
            </span>
          </Link>
          <h1 className="text-white mb-1" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>Welcome back</h1>
          <p className="text-white/40 text-sm">Sign in to your account to continue</p>
        </div>

        {/* Demo accounts */}
        <div className="rounded-xl p-4 border mb-4" style={{ background: 'rgba(0,212,255,0.05)', borderColor: 'rgba(0,212,255,0.15)' }}>
          <p className="text-[10px] text-white/40 mb-2" style={{ letterSpacing: '0.08em' }}>DEMO ACCOUNTS — CLICK TO LOGIN</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { email: 'player@demo.com', label: 'Player', color: '#00d4ff' },
              { email: 'captain@demo.com', label: 'Captain', color: '#a855f7' },
              { email: 'organizer@demo.com', label: 'Organizer', color: '#ffd700' },
              { email: 'admin@demo.com', label: 'Admin', color: '#ff4655' },
            ].map(d => (
              <button key={d.email} onClick={() => quickLogin(d.email)}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: `${d.color}10`, border: `1px solid ${d.color}25`, color: d.color }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-8 border" style={{ background: 'rgba(13,14,26,0.9)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
          <div className="flex gap-3 mb-6">
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-white/70 border hover:bg-white/5 transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <Chrome className="w-4 h-4" /> Google
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-white/70 border hover:bg-white/5 transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <MessageSquare className="w-4 h-4" /> Discord
            </button>
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-xs text-white/30">or email</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,70,85,0.1)', border: '1px solid rgba(255,70,85,0.2)', color: '#ff4655' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-white/50 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 rounded" style={{ accentColor: '#00d4ff' }} />
                Remember me
              </label>
              <a href="#" className="hover:opacity-80 transition-opacity" style={{ color: '#00d4ff' }}>Forgot password?</a>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm text-white transition-all hover:opacity-90 hover:scale-[1.01] mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 24px rgba(0,212,255,0.25)', fontWeight: 600 }}>
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="hover:opacity-80 transition-opacity" style={{ color: '#00d4ff' }}>Create one</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

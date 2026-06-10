import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Swords, Bell, Menu, X, ChevronDown, Trophy, Users, Gamepad2,
  Film, Zap, LogOut, User, Plus, Radio, MessageCircle, ShoppingBag, Handshake
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

const NAV_LINKS = [
  { label: 'Tournaments', href: '/tournaments', icon: Trophy },
  { label: 'Teams', href: '/teams', icon: Users },
  { label: 'Games', href: '/games', icon: Gamepad2 },
  { label: 'Media', href: '/media', icon: Film },
  { label: 'Live', href: '/live', icon: Radio },
  { label: 'Community', href: '/community', icon: MessageCircle },
  { label: 'Sponsors', href: '/sponsors', icon: Handshake },
  { label: 'Store', href: '/store', icon: ShoppingBag },
];

const ROLE_DASHBOARD: Record<string, string> = {
  player: '/dashboard/player',
  captain: '/dashboard/team',
  organizer: '/dashboard/admin',
  admin: '/dashboard/admin',
  sponsor: '/dashboard/admin',
};

const ROLE_STYLE: Record<string, { label: string; color: string }> = {
  player: { label: 'Player', color: '#00d4ff' },
  captain: { label: 'Captain', color: '#a855f7' },
  organizer: { label: 'Organizer', color: '#ffd700' },
  admin: { label: 'Admin', color: '#ff4655' },
  sponsor: { label: 'Sponsor', color: '#4ade80' },
};

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markNotificationRead } = useRealtime();
  const unread = unreadCount;
  const roleInfo = user ? ROLE_STYLE[user.role] : null;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(8,9,15,0.95)' : 'linear-gradient(to bottom, rgba(8,9,15,0.9), transparent)',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', boxShadow: '0 0 20px rgba(0,212,255,0.4)' }}>
              <Swords className="w-5 h-5 text-white" />
            </div>
            <span className="text-white hidden sm:block"
              style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              ARENA<span style={{ color: '#00d4ff' }}>X</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link key={link.href} to={link.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                  location.pathname.startsWith(link.href)
                    ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}>
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <Link to={ROLE_DASHBOARD[user!.role]}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                    location.pathname.startsWith('/dashboard')
                      ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}>
                  Dashboard
                </Link>
                {(user?.role === 'organizer' || user?.role === 'admin') && (
                  <Link to="/tournaments/create"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 text-white/60 hover:text-white hover:bg-white/5">
                    <Plus className="w-3.5 h-3.5" /> Host
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            {isAuthenticated && (
              <div className="relative">
                <button onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                  className="relative w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                      style={{ background: '#00d4ff', boxShadow: '0 0 8px rgba(0,212,255,0.6)' }}>
                      {unread}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-2 right-0 w-80 rounded-xl border overflow-hidden"
                      style={{ background: 'rgba(13,14,26,0.98)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
                      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                        <span className="text-sm text-white">Notifications</span>
                        {unread > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff' }}>{unread} new</span>}
                      </div>
                      {notifications.slice(0, 4).map(n => (
                        <div key={n.id} onClick={() => markNotificationRead(n.id)} className={`px-4 py-3 border-b hover:bg-white/5 transition-colors cursor-pointer ${n.read ? 'opacity-60' : ''}`}
                          style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                          <div className="flex items-start gap-2">
                            {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00d4ff' }} />}
                            {n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" />}
                            <div>
                              <p className="text-xs text-white" style={{ fontWeight: 600 }}>{n.title}</p>
                              <p className="text-xs text-white/50 mt-0.5">{n.message}</p>
                              <p className="text-[10px] text-white/30 mt-1">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="px-4 py-2.5 text-center">
                        <Link to="/notifications" className="text-xs hover:opacity-80 transition-opacity" style={{ color: '#00d4ff' }}>
                          View all notifications
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Authenticated user menu */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all hover:bg-white/5"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white"
                    style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
                    {user.avatar}
                  </div>
                  <span className="hidden sm:block text-sm text-white/80 max-w-24 truncate">{user.username}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-2 right-0 w-56 rounded-xl border overflow-hidden"
                      style={{ background: 'rgba(13,14,26,0.98)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
                      {/* User info */}
                      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                        <p className="text-sm text-white" style={{ fontWeight: 600 }}>{user.username}</p>
                        <p className="text-xs text-white/40">{user.email}</p>
                        {roleInfo && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block"
                            style={{ background: `${roleInfo.color}15`, color: roleInfo.color }}>
                            {roleInfo.label}
                          </span>
                        )}
                      </div>
                      <div className="py-1">
                        <Link to={ROLE_DASHBOARD[user.role]}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                          <User className="w-4 h-4" /> Dashboard
                        </Link>
                        {user.role === 'captain' && (
                          <Link to="/teams/create"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                            <Users className="w-4 h-4" /> Create Team
                          </Link>
                        )}
                        {(user.role === 'organizer' || user.role === 'admin') && (
                          <Link to="/tournaments/create"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                            <Trophy className="w-4 h-4" /> Host Tournament
                          </Link>
                        )}
                        <div className="my-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/register"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-white transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 16px rgba(0,212,255,0.25)' }}>
                  <Zap className="w-3.5 h-3.5" /> Join Now
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="lg:hidden border-t overflow-hidden"
            style={{ background: 'rgba(8,9,15,0.98)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <nav className="px-4 py-4 space-y-1">
              {NAV_LINKS.map(link => (
                <Link key={link.href} to={link.href}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                  <link.icon className="w-4 h-4" /> {link.label}
                </Link>
              ))}
              {isAuthenticated && (
                <>
                  <Link to={ROLE_DASHBOARD[user!.role]}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                    <User className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link to="/notifications"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                    <Bell className="w-4 h-4" /> Notifications
                    {unread > 0 && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold text-black" style={{ background: '#00d4ff' }}>{unread}</span>
                    )}
                  </Link>
                </>
              )}
              <div className="my-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              {!isAuthenticated ? (
                <div className="pt-2 flex gap-2">
                  <Link to="/login" className="flex-1 text-center px-4 py-2.5 rounded-lg border text-sm text-white/70 hover:text-white"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Sign In</Link>
                  <Link to="/register" className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm text-white"
                    style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)' }}>Join Now</Link>
                </div>
              ) : (
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

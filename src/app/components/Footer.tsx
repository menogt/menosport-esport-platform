import { Link } from 'react-router';
import { Swords, Twitter, Twitch, Youtube, MessageSquare } from 'lucide-react';

const LINKS = {
  Platform: [
    { label: 'Tournaments', href: '/tournaments' },
    { label: 'Teams', href: '/teams' },
    { label: 'Games', href: '/games' },
    { label: 'Media', href: '/media' },
  ],
  Community: [
    { label: 'Discord', href: '#' },
    { label: 'Twitch', href: '#' },
    { label: 'Twitter/X', href: '#' },
    { label: 'YouTube', href: '#' },
  ],
  Account: [
    { label: 'Sign In', href: '/login' },
    { label: 'Register', href: '/register' },
    { label: 'Player Dashboard', href: '/dashboard/player' },
    { label: 'Team Dashboard', href: '/dashboard/team' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Sponsors', href: '/sponsors' },
    { label: 'Store', href: '/store' },
    { label: 'Contact', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t mt-20" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(8,9,15,0.8)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', boxShadow: '0 0 16px rgba(0,212,255,0.3)' }}>
                <Swords className="w-4 h-4 text-white" />
              </div>
              <span className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                ARENA<span style={{ color: '#00d4ff' }}>X</span>
              </span>
            </Link>
            <p className="text-xs text-white/40 leading-relaxed mb-4">
              The premier esports tournament platform. Compete, connect, and conquer.
            </p>
            <div className="flex gap-3">
              {[Twitter, MessageSquare, Twitch, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs text-white/40 mb-3" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>{category}</h4>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-xs text-white/30">© 2026 ArenaX. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white/60 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

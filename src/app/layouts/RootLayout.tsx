import { Outlet, useLocation } from 'react-router';
import { useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

const NO_FOOTER_PATHS = ['/login', '/register', '/dashboard/player', '/dashboard/team', '/dashboard/admin'];

export function RootLayout() {
  const location = useLocation();
  const hideFooter = NO_FOOTER_PATHS.includes(location.pathname);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#08090f', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

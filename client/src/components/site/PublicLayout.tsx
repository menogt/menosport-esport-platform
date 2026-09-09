import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowUpRight, LayoutDashboard, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";

export const PUBLIC_NAV = [
  { label: "Tournaments", href: "/tournaments" },
  { label: "Games", href: "/games" },
  { label: "Teams", href: "/teams" },
  { label: "Clans", href: "/clans" },
  { label: "Media", href: "/media" },
  { label: "Store", href: "/store" },
  { label: "Sponsors", href: "/sponsors" },
] as const;

export function Logo() {
  return (
    <Link href="/" className="brand-mark" aria-label="Meno Arena home">
      <span className="brand-mark__symbol"><span /></span>
      <span className="brand-mark__type">MENO<span>ARENA</span></span>
    </Link>
  );
}

export function SiteHeader({ actions }: { actions?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav className={`main-nav ${open ? "main-nav--open" : ""}`} aria-label="Primary navigation">
          {PUBLIC_NAV.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={location.startsWith(item.href) ? "text-lime-300" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          {actions}
          {!loading && isAuthenticated ? (
            <Button className="header-login" variant="outline" asChild>
              <Link href="/dashboard/player"><LayoutDashboard size={15} /> Dashboard</Link>
            </Button>
          ) : (
            <Button className="header-login" variant="outline" asChild>
              <Link href="/login">Sign in <ArrowUpRight size={15} /></Link>
            </Button>
          )}
          <button className="menu-button" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(value => !value)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell site-footer__inner">
        <Logo />
        <span>Competition, organized.</span>
        <div className="footer-links">
          <Link href="/tournaments">Tournaments</Link>
          <Link href="/clans">Clans</Link>
          <Link href="/sponsors">Sponsors</Link>
          <Link href="/store">Store</Link>
          <a href="mailto:hello@menoarena.gg">Contact</a>
        </div>
        <span className="footer-copy">© {new Date().getFullYear()} Meno Arena</span>
      </div>
    </footer>
  );
}

/**
 * Shell for every public (non-dashboard) page: fixed header, padded main, footer.
 * Pages render their own hero/banner as the first child when they need one.
 */
export default function PublicLayout({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="app-shell min-h-screen bg-[#0b0d0e] text-[#e9ebe6]">
      <SiteHeader />
      <main className={`pt-[76px] ${className}`}>{children}</main>
      <SiteFooter />
    </div>
  );
}

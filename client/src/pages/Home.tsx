import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowUpRight,
  Bell,
  ChevronRight,
  CircleDot,
  Command,
  Menu,
  Play,
  Search,
  Shield,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ParallaxHeroArt from "@/components/ParallaxHeroArt";
import ParallaxGameCard from "@/components/ParallaxGameCard";
import { ScrollReveal, ShimmerLine } from "@/components/VisualEffects";
import ArenaMotionDirector from "@/components/ArenaMotionDirector";

const tournaments = [
  {
    title: "Nightfall Open",
    game: "Valorant",
    tag: "VCT-style · Open bracket",
    date: "Aug 24–25",
    prize: "$18,400",
    teams: "64 / 64 teams",
    accent: "#d8ff62",
    art: "linear-gradient(135deg, #142b2b 0%, #0f1719 52%, #252b16 100%)",
  },
  {
    title: "Neon Circuit // 04",
    game: "Mobile Legends",
    tag: "5v5 · Clan eligible",
    date: "Sep 01–03",
    prize: "$12,000",
    teams: "32 / 64 teams",
    accent: "#89c7ff",
    art: "linear-gradient(135deg, #172748 0%, #121c2a 58%, #1c1b37 100%)",
  },
  {
    title: "Rivals: Open Qualifier",
    game: "CS2",
    tag: "5v5 · Single elimination",
    date: "Sep 08–09",
    prize: "$8,750",
    teams: "48 / 128 teams",
    accent: "#ffab78",
    art: "linear-gradient(135deg, #302014 0%, #171819 58%, #342117 100%)",
  },
];

const games = [
  { name: "Valorant", meta: "44 active events", tone: "#d8ff62", slot: "[GAME_HEADER_IMAGE: Valorant]" },
  { name: "Mobile Legends", meta: "28 active events", tone: "#89c7ff", slot: "[GAME_HEADER_IMAGE: Mobile Legends]" },
  { name: "CS2", meta: "19 active events", tone: "#ffab78", slot: "[GAME_HEADER_IMAGE: CS2]" },
  { name: "EA FC 26", meta: "12 active events", tone: "#c4a8ff", slot: "[GAME_HEADER_IMAGE: EA FC 26]" },
];

const liveMatches = [
  { a: "Astra Forge", b: "Kairo Seven", game: "Valorant", score: "1 — 0", status: "LIVE", progress: "78%" },
  { a: "Orbit Syndicate", b: "Haven House", game: "Mobile Legends", score: "2 — 2", status: "MAP 5", progress: "63%" },
  { a: "Nox Division", b: "Hush Protocol", game: "CS2", score: "0 — 1", status: "ROUND 18", progress: "41%" },
];

const teams = [
  { rank: "01", name: "Astra Forge", tag: "AST", points: "8,420", delta: "+412", color: "#d8ff62" },
  { rank: "02", name: "Orbit Syndicate", tag: "ORB", points: "7,960", delta: "+188", color: "#89c7ff" },
  { rank: "03", name: "Kairo Seven", tag: "K7", points: "7,540", delta: "+96", color: "#ffab78" },
  { rank: "04", name: "Nox Division", tag: "NOX", points: "7,215", delta: "−24", color: "#c4a8ff" },
];

function SectionLabel({ children }: { children: string }) {
  return <p className="section-label">{children}</p>;
}

function Logo() {
  return (
    <Link href="/" className="brand-mark" aria-label="Meno Arena home">
      <span className="brand-mark__symbol"><span /></span>
      <span className="brand-mark__type">MENO<span>ARENA</span></span>
    </Link>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const nav = [
    { label: "Tournaments", href: "/tournaments/live" },
    { label: "Games", href: "/games" },
    { label: "Teams", href: "/clans" },
    { label: "Clans", href: "/clans" },
    { label: "Media", href: "/media" },
  ];

  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav className={`main-nav ${open ? "main-nav--open" : ""}`} aria-label="Primary navigation">
          {nav.map((item) => <Link key={item.label} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}
        </nav>
        <div className="header-actions">
          <button className="icon-button header-search" aria-label="Search" onClick={() => toast.message("Search is being connected to the tournament and clan index.")}><Search size={17} /></button>
          <button className="icon-button header-bell" aria-label="Notifications" onClick={() => toast.message("Open the live room to review your current alerts.")}><Bell size={17} /><i /></button>
          <Button className="header-login" variant="outline" onClick={() => { window.location.href = "/login"; }}>Sign in <ArrowUpRight size={15} /></Button>
          <button className="menu-button" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero-section">
      <ArenaMotionDirector />
      <div className="hero-grid" />
      <div className="hero-scanline" />
      <div className="hero-orb hero-orb--one" />
      <div className="hero-orb hero-orb--two" />
      <div className="hero-content page-shell">
          <div className="hero-copy">
          <div data-hero-intro className="eyebrow"><span className="eyebrow-dot" /> The competitive layer for everyone</div>
          <h1 data-hero-intro>Play with<br /><em>intent.</em></h1>
          <p data-hero-intro className="hero-lede">Meno Arena is where organized competition meets the people who make it matter. Find your next bracket, build a real team, and leave a mark.</p>
          <div data-hero-intro className="hero-actions">
            <Button className="button-primary" asChild><a href="#tournaments">Explore tournaments <ArrowUpRight size={16} /></a></Button>
            <Button className="button-quiet" variant="ghost" asChild><a href="#how-it-works">How it works <ChevronRight size={16} /></a></Button>
          </div>
          <div data-hero-intro className="hero-proof"><div className="avatar-stack"><span>JF</span><span>RK</span><span>LM</span><span>+</span></div><span><strong>18,620</strong> competitors already in the arena</span></div>
        </div>
        <ParallaxHeroArt />
      </div>
      <div className="hero-foot page-shell"><span>SCROLL TO ENTER</span><span className="hero-foot__line" /><span>EST. 2024 · WORLDWIDE</span></div>
    </section>
  );
}

function LiveTicker() {
  const tickers = [...liveMatches, ...liveMatches];
  return <div className="live-ticker"><div className="page-shell live-ticker__inner"><div className="live-ticker__label"><CircleDot size={13} /> Live now</div><div className="ticker-viewport"><div className="ticker-items">{tickers.map((match, index) => <div className="ticker-match" key={`${match.a}-${index}`}><span>{match.game}</span><strong>{match.a}</strong><b>{match.score}</b><strong>{match.b}</strong></div>)}</div></div><Link href="/tournaments/live" className="ticker-link">View all <ArrowUpRight size={14} /></Link></div></div>;
}

function TournamentSection() {
  return <section className="section-block" id="tournaments"><div className="page-shell"><div className="section-heading"><div><SectionLabel>01 / On the calendar</SectionLabel><h2>Find your next<br /><span>high-stakes room.</span></h2></div><Link className="text-link" href="/tournaments/live">View all tournaments <ArrowUpRight size={15} /></Link></div><div className="tournament-grid">{tournaments.map((tournament, index) => <article className={`tournament-card tournament-card--${index === 0 ? "featured" : ""}`} key={tournament.title} style={{ "--card-accent": tournament.accent } as React.CSSProperties}><div className="tournament-card__art" style={{ background: tournament.art }}><span className="card-index">0{index + 1}</span><span className="card-live-label">{index === 0 ? "REGISTRATION OPEN" : "OPEN FOR ENTRIES"}</span><div className="card-art-mark">{index === 0 ? <Shield size={50} strokeWidth={1} /> : <Trophy size={42} strokeWidth={1} />}</div></div><div className="tournament-card__body"><div className="card-meta"><span>{tournament.game}</span><span>{tournament.date}</span></div><h3>{tournament.title}</h3><p>{tournament.tag}</p><div className="tournament-card__footer"><span><small>Prize pool</small><strong>{tournament.prize}</strong></span><span><small>Capacity</small><strong>{tournament.teams}</strong></span><Link className="circle-arrow" href="/tournaments/live" aria-label={`Open ${tournament.title}`}><ArrowUpRight size={16} /></Link></div></div></article>)}</div></div></section>;
}

function LiveMatches() {
  return <section className="section-block section-block--tight" id="matches"><div className="page-shell"><div className="section-heading section-heading--row"><div><SectionLabel>02 / Watch the room</SectionLabel><h2>Live <span>matches.</span></h2></div><div className="live-status"><span className="pulse-dot" /> Scores update in real time</div></div><div className="match-list">{liveMatches.map((match, index) => <article className="match-row" key={match.a}><div className="match-row__game"><span className="game-mini game-mini--lime">{match.game.slice(0, 2).toUpperCase()}</span><span>{match.game}</span></div><div className="match-row__teams"><strong>{match.a}</strong><b>{match.score}</b><strong>{match.b}</strong></div><div className="match-row__progress"><div><span style={{ width: match.progress }} /></div><small>{match.status}</small></div><Link href={`/matches/${index + 1}`} className="watch-button"><Play size={13} fill="currentColor" /> Watch</Link></article>)}</div></div></section>;
}

function GameSection() {
  return <section className="section-block section-block--dark" id="games"><div className="page-shell"><div className="section-heading"><div><SectionLabel>03 / Pick your arena</SectionLabel><h2>Every game has<br /><span>its own gravity.</span></h2></div><Link className="text-link" href="/games">Browse all games <ArrowUpRight size={15} /></Link></div><div className="game-grid">{games.map((game, index) => <ParallaxGameCard key={game.name} name={game.name} meta={game.meta} tone={game.tone} index={index} glyph={index === 0 ? "V" : index === 1 ? "M" : index === 2 ? "C" : "F"} />)}</div></div></section>;
}

function LeaderboardSection() {
  return <section className="section-block" id="teams"><div className="page-shell leaderboard-layout"><div className="leaderboard-intro"><SectionLabel>04 / The standings</SectionLabel><h2>Built by<br /><span>the best.</span></h2><p>The teams at the top don’t get there by accident. Track the climb, find your rivals, and make the next move count.</p><Link className="text-link" href="/clans">Open leaderboard <ArrowUpRight size={15} /></Link><div className="stat-rule"><span><strong>128</strong><small>active clans</small></span><span><strong>4.8k</strong><small>registered players</small></span></div></div><div className="leaderboard-table"><div className="leaderboard-table__head"><span>Global ranking</span><span>Points / trend</span></div>{teams.map((team) => <Link href="/clans" className="leaderboard-line" key={team.name}><span className="leaderboard-rank">{team.rank}</span><span className="team-avatar" style={{ background: team.color }}>{team.tag.slice(0, 1)}</span><span className="team-name"><strong>{team.name}</strong><small>{team.tag} · Global</small></span><span className="team-points"><strong>{team.points}</strong><small className={team.delta.startsWith("+") ? "positive" : "negative"}>{team.delta}</small></span><ChevronRight size={16} className="leaderboard-chevron" /></Link>)}</div></div></section>;
}

function SponsorSection() {
  return <section className="sponsor-strip"><div className="page-shell sponsor-strip__inner"><div><span className="sponsor-kicker">THE ARENA IS PRESENTED BY</span><strong>ARC / NINE</strong></div><ShimmerLine /><p>Partners who believe competitive gaming deserves a bigger stage.</p><Link href="/sponsors" className="text-link">Partner with us <ArrowUpRight size={15} /></Link></div></section>;
}

export default function Home() {
  return <div className="app-shell"><Header /><main><Hero /><LiveTicker /><ScrollReveal><TournamentSection /></ScrollReveal><ScrollReveal delay={60}><LiveMatches /></ScrollReveal><ScrollReveal delay={90}><GameSection /></ScrollReveal><ScrollReveal delay={120}><LeaderboardSection /></ScrollReveal><ScrollReveal delay={150}><SponsorSection /></ScrollReveal><ScrollReveal delay={180}><section className="final-cta" id="how-it-works"><div className="page-shell final-cta__inner"><div><SectionLabel>05 / Your move</SectionLabel><h2>There’s a bracket<br /><span>with your name on it.</span></h2></div><Button className="button-primary" asChild><Link href="/profile">Create your profile <ArrowUpRight size={16} /></Link></Button></div></section></ScrollReveal></main><footer className="site-footer"><div className="page-shell site-footer__inner"><Logo /><span>Competition, organized.</span><div className="footer-links"><a href="#how-it-works">About</a><Link href="/tournaments/live">Rules</Link><Link href="/sponsors">Sponsors</Link><a href="mailto:hello@menoarena.gg">Contact</a></div><span className="footer-copy">© 2024 Meno Arena</span></div></footer></div>;
}

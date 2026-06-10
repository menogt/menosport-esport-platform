import { useRef, type MouseEvent } from 'react';
import { Link } from 'react-router';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowRight, Radio, Shield, Trophy, Users, Zap } from 'lucide-react';
import { PLATFORM_STATS } from '../../data/dummy';
import menoArenaLandscape from '../../../assets/brand/meno-arena-landscape-web.png';
import { EnergyBackground } from './EnergyBackground';
import { EsportsCharacterLayer } from './EsportsCharacterLayer';
import { FloatingEsportsCard } from './FloatingEsportsCard';

export function CinematicEsportsHero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], reduceMotion ? ['0%', '0%'] : ['0%', '-20%']);
  const backgroundScale = useTransform(scrollYProgress, [0, 1], reduceMotion ? [1, 1] : [1, 1.25]);
  const backgroundOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.95, 0.68]);

  const titleY = useTransform(scrollYProgress, [0, 0.52, 0.86], reduceMotion ? [0, 0, 0] : [0, -70, -180]);
  const titleScale = useTransform(scrollYProgress, [0, 0.86], reduceMotion ? [1, 1] : [1, 0.9]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.68, 0.9], [1, 1, 0]);
  const titleBlur = useTransform(scrollYProgress, [0, 0.86], ['blur(0px)', reduceMotion ? 'blur(0px)' : 'blur(8px)']);

  const nextRevealY = useTransform(scrollYProgress, [0.68, 1], reduceMotion ? [0, 0] : [80, -16]);
  const nextRevealOpacity = useTransform(scrollYProgress, [0.62, 0.84], [0, 1]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const tiltY = useTransform(mouseX, [-1, 1], reduceMotion ? [0, 0] : [-8, 8]);
  const tiltX = useTransform(mouseY, [-1, 1], reduceMotion ? [0, 0] : [5, -5]);

  const liveY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [120, -440]);
  const liveX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-140, 70]);
  const liveScale = useTransform(scrollYProgress, [0, 0.45, 1], [0.82, 1.04, 1.18]);
  const liveRotateY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-18, 18]);

  const bracketY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-40, -360]);
  const bracketX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [160, -90]);
  const bracketRotate = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [8, -10]);

  const prizeY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [320, -220]);
  const prizeX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [220, 20]);
  const prizeScale = useTransform(scrollYProgress, [0.12, 0.68], [0.75, 1.2]);

  const rosterY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [260, -500]);
  const rosterX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-260, -40]);
  const rosterOpacity = useTransform(scrollYProgress, [0.08, 0.18, 0.82, 1], [0, 1, 1, 0]);

  const resultY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [520, -160]);
  const resultX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-70, 180]);
  const sponsorY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [580, -320]);
  const mediaY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [440, -420]);
  const statsY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [160, -260]);

  const assassinY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [220, -320]);
  const assassinX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-360, -80]);
  const tankY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [140, -220]);
  const tankX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [360, 80]);
  const marksmanY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [520, -120]);
  const marksmanScale = useTransform(scrollYProgress, [0, 0.72], [0.72, 1.18]);

  const smoothLiveY = useSpring(liveY, { stiffness: 70, damping: 24 });
  const smoothAssassinY = useSpring(assassinY, { stiffness: 70, damping: 26 });
  const smoothTankY = useSpring(tankY, { stiffness: 70, damping: 26 });

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    mouseY.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };

  return (
    <section ref={sectionRef} onMouseMove={handleMouseMove} className="relative min-h-[190vh] overflow-visible bg-[#04050b] md:min-h-[330vh]">
      <div className="sticky top-0 h-screen overflow-hidden" style={{ perspective: 1200 }}>
        <EnergyBackground y={backgroundY} scale={backgroundScale} opacity={backgroundOpacity} />

        <motion.div className="absolute inset-0 pointer-events-none" style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: 'preserve-3d' }}>
          <FloatingEsportsCard variant="live" className="left-[8%] top-[18%]" style={{ x: liveX, y: smoothLiveY, scale: liveScale, rotateY: liveRotateY, zIndex: 24 }} />
          <FloatingEsportsCard variant="bracket" className="right-[8%] top-[16%]" style={{ x: bracketX, y: bracketY, rotate: bracketRotate, rotateY: liveRotateY, zIndex: 16 }} />
          <FloatingEsportsCard variant="prize" className="right-[17%] bottom-[17%]" style={{ x: prizeX, y: prizeY, scale: prizeScale, rotateY: liveRotateY, zIndex: 32 }} />
          <FloatingEsportsCard variant="roster" className="left-[12%] bottom-[14%]" style={{ x: rosterX, y: rosterY, opacity: rosterOpacity, rotateY: liveRotateY, zIndex: 18 }} />
          <FloatingEsportsCard variant="result" className="left-[42%] bottom-[10%]" style={{ x: resultX, y: resultY, scale: liveScale, zIndex: 34 }} />
          <FloatingEsportsCard variant="sponsor" className="right-[36%] top-[10%]" style={{ y: sponsorY, rotate: bracketRotate, zIndex: 12 }} />
          <FloatingEsportsCard variant="media" className="left-[36%] top-[9%]" style={{ y: mediaY, scale: prizeScale, zIndex: 13 }} />
          <FloatingEsportsCard variant="stats" className="right-[5%] bottom-[38%]" style={{ y: statsY, rotateY: liveRotateY, zIndex: 26 }} />
        </motion.div>

        <EsportsCharacterLayer variant="assassin" className="left-[4%] bottom-[-4%]" style={{ x: assassinX, y: smoothAssassinY, rotateY: liveRotateY, opacity: rosterOpacity, zIndex: 20 }} />
        <EsportsCharacterLayer variant="tank" className="right-[3%] bottom-[-5%]" style={{ x: tankX, y: smoothTankY, rotateY: liveRotateY, opacity: rosterOpacity, zIndex: 22 }} />
        <EsportsCharacterLayer variant="marksman" className="left-[42%] bottom-[-14%]" style={{ y: marksmanY, scale: marksmanScale, rotateY: liveRotateY, zIndex: 30 }} />

        <motion.div
          className="absolute left-1/2 top-1/2 z-40 w-[min(92vw,900px)] -translate-x-1/2 -translate-y-1/2 text-center"
          style={{ y: titleY, scale: titleScale, opacity: titleOpacity, filter: titleBlur }}
        >
          <img
            src={menoArenaLandscape}
            alt="Meno Arena"
            loading="eager"
            className="mx-auto mb-4 h-20 w-auto max-w-[72vw] object-contain opacity-95 drop-shadow-[0_0_28px_rgba(255,70,85,0.34)] sm:h-24"
          />
          <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-white/[0.045] px-4 py-2 text-[11px] tracking-[0.22em] text-white/70 backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_18px_rgba(255,70,85,0.9)]" />
            LIVE TOURNAMENT OPS
          </div>
          <h1 className="text-white" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(4rem, 13vw, 11rem)', fontWeight: 900, lineHeight: 0.78, letterSpacing: '-0.04em', textShadow: '0 16px 80px rgba(0,0,0,0.98), 0 0 44px rgba(255,70,85,0.2)' }}>
            Meno
            <br />
            <span style={{ background: 'linear-gradient(135deg, #ff4655, #ffffff 42%, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Arena</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-xl text-white/95" style={{ textShadow: '0 4px 28px rgba(0,0,0,0.96)' }}>
            Run tournaments. Build teams. Track brackets. Create esports moments.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-white/72" style={{ textShadow: '0 3px 22px rgba(0,0,0,0.94)' }}>
            A modern esports tournament platform for teams, players, organizers, live matches, brackets, prize pools, and competitive gaming communities.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link to="/tournaments" className="flex items-center gap-2 rounded-xl px-7 py-4 text-sm font-bold text-white transition-transform hover:scale-105" style={{ background: 'linear-gradient(135deg, #ff4655, #a855f7)', boxShadow: '0 18px 44px rgba(255,70,85,0.28)' }}>
              <Trophy className="h-4 w-4" /> Explore Tournaments
            </Link>
            <Link to="/brackets/trn1" className="flex items-center gap-2 rounded-xl border border-white/18 bg-white/[0.07] px-7 py-4 text-sm font-semibold text-white backdrop-blur-xl transition-transform hover:scale-105">
              <Radio className="h-4 w-4" /> View Live Brackets
            </Link>
            <Link to="/dashboard/team" className="flex items-center gap-2 rounded-xl border border-cyan-200/25 bg-cyan-300/[0.08] px-7 py-4 text-sm font-semibold text-white backdrop-blur-xl transition-transform hover:scale-105">
              <Users className="h-4 w-4" /> Create Team
            </Link>
          </div>
          <div className="mx-auto mt-11 grid max-w-xl grid-cols-3 gap-4">
            {[
              { label: 'Active Players', value: PLATFORM_STATS.activePlayers, icon: Zap },
              { label: 'Prize Money', value: PLATFORM_STATS.totalPrizeMoney, icon: Trophy },
              { label: 'Teams', value: PLATFORM_STATS.teamsRegistered, icon: Shield },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 backdrop-blur-xl">
                <item.icon className="mx-auto mb-1 h-4 w-4 text-cyan-200" />
                <p className="text-lg font-black text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{item.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-white/45">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="absolute bottom-12 left-1/2 z-40 max-w-3xl -translate-x-1/2 text-center" style={{ y: nextRevealY, opacity: nextRevealOpacity }}>
          <p className="text-2xl font-black text-white" style={{ fontFamily: "'Rajdhani', sans-serif", textShadow: '0 8px 34px rgba(0,0,0,0.9)' }}>
            Built for tournaments, teams, creators, and competitive communities.
          </p>
          <ArrowRight className="mx-auto mt-4 h-5 w-5 text-cyan-200" />
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#08090f] to-transparent" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.42), transparent 24%, transparent 76%, rgba(0,0,0,0.42))' }} />
      </div>
    </section>
  );
}

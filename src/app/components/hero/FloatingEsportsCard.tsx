import type { MotionValue } from 'motion/react';
import { motion } from 'motion/react';

type FloatingEsportsCardProps = {
  variant: 'live' | 'bracket' | 'prize' | 'roster' | 'result' | 'sponsor' | 'media' | 'stats';
  className?: string;
  style?: {
    x?: MotionValue<string | number>;
    y?: MotionValue<string | number>;
    scale?: MotionValue<number>;
    rotate?: MotionValue<number>;
    rotateX?: MotionValue<number>;
    rotateY?: MotionValue<number>;
    opacity?: MotionValue<number>;
    filter?: MotionValue<string>;
    zIndex?: number;
  };
};

const baseStyle = {
  background: 'linear-gradient(145deg, rgba(14,17,29,0.82), rgba(7,9,18,0.64))',
  border: '1px solid rgba(255,255,255,0.13)',
  boxShadow: '0 24px 80px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.12)',
  backdropFilter: 'blur(18px)',
};

function MiniBars({ color = '#00d4ff' }: { color?: string }) {
  return (
    <div className="flex items-end gap-1.5">
      {[18, 32, 24, 42, 28].map((height, index) => (
        <span key={index} className="w-2 rounded-full" style={{ height, background: `linear-gradient(to top, ${color}, rgba(255,255,255,0.32))` }} />
      ))}
    </div>
  );
}

export function FloatingEsportsCard({ variant, className = '', style }: FloatingEsportsCardProps) {
  return (
    <motion.div
      className={`absolute hidden rounded-2xl p-4 text-white lg:block ${className}`}
      style={{ ...baseStyle, transformStyle: 'preserve-3d', ...style }}
    >
      {variant === 'live' && (
        <div className="w-80">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] tracking-[0.28em] text-red-300">LIVE MATCH</span>
            <span className="ml-auto text-[10px] text-white/45">MATCH 03 · BO3</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div>
              <p className="text-sm font-semibold">Phoenix Reapers</p>
              <p className="text-[10px] text-white/40">Meno Premier</p>
            </div>
            <div className="text-3xl font-black" style={{ fontFamily: "'Rajdhani', sans-serif" }}>1 - 1</div>
            <div className="text-right">
              <p className="text-sm font-semibold">Shadow Legion</p>
              <p className="text-[10px] text-white/40">Semi Final</p>
            </div>
          </div>
        </div>
      )}

      {variant === 'bracket' && (
        <div className="w-72">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] tracking-[0.24em] text-cyan-300">BRACKET</span>
            <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'rgba(0,212,255,0.14)', color: '#67e8f9' }}>LOCKED</span>
          </div>
          {['Quarter Final', 'Semi Final', 'Grand Final'].map((round, index) => (
            <div key={round} className="mb-2 flex items-center gap-2">
              <span className="h-px flex-1" style={{ background: index === 1 ? '#00d4ff' : 'rgba(255,255,255,0.16)' }} />
              <span className="text-xs text-white/70">{round}</span>
              <span className="h-px flex-1" style={{ background: index === 1 ? '#ff4655' : 'rgba(255,255,255,0.16)' }} />
            </div>
          ))}
          <p className="mt-4 text-xs text-white/45">Team A advances · Semi final locked</p>
        </div>
      )}

      {variant === 'prize' && (
        <div className="w-64">
          <p className="text-[10px] tracking-[0.3em] text-yellow-200">PRIZE POOL</p>
          <p className="mt-2 text-4xl font-black text-yellow-300" style={{ fontFamily: "'Rajdhani', sans-serif" }}>$2,500</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-white/55">
            <span>1st 60%</span>
            <span>2nd 30%</span>
            <span>3rd 10%</span>
          </div>
        </div>
      )}

      {variant === 'roster' && (
        <div className="w-64">
          <p className="text-[10px] tracking-[0.24em] text-violet-300">TEAM ROSTER</p>
          <p className="mt-2 text-lg font-bold">Meno Titans</p>
          <div className="mt-3 space-y-2">
            {['Captain', 'Jungler', 'Roamer', 'Marksman', 'Support'].map((role) => (
              <div key={role} className="flex items-center justify-between rounded-lg bg-white/[0.045] px-3 py-1.5 text-xs">
                <span>{role}</span>
                <span className="text-cyan-300">ONLINE</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === 'result' && (
        <div className="w-72">
          <span className="rounded-full px-2 py-1 text-[10px]" style={{ color: '#4ade80', background: 'rgba(74,222,128,0.12)' }}>RESULT UPLOADED</span>
          <p className="mt-4 text-sm font-semibold">Screenshot proof attached</p>
          <p className="mt-1 text-xs text-white/45">Waiting for opponent confirmation</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/3 rounded-full" style={{ background: 'linear-gradient(90deg, #4ade80, #00d4ff)' }} />
          </div>
        </div>
      )}

      {variant === 'sponsor' && (
        <div className="w-72">
          <p className="text-[10px] tracking-[0.3em] text-white/45">PRESENTED BY</p>
          <p className="mt-2 text-2xl font-black" style={{ fontFamily: "'Rajdhani', sans-serif" }}>NOVA ENERGY</p>
          <div className="mt-4 h-16 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(255,70,85,0.28), rgba(124,58,237,0.24), rgba(0,212,255,0.22))' }} />
        </div>
      )}

      {variant === 'media' && (
        <div className="w-64">
          <div className="h-28 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(255,70,85,0.32), rgba(0,212,255,0.2))' }} />
          <p className="mt-3 text-sm font-semibold">Final clutch highlight</p>
          <p className="mt-1 text-xs text-white/45">2.4M views · featured clip</p>
        </div>
      )}

      {variant === 'stats' && (
        <div className="w-60">
          <p className="text-[10px] tracking-[0.24em] text-cyan-300">PLAYER STATS</p>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-3xl font-black" style={{ fontFamily: "'Rajdhani', sans-serif" }}>8.7</p>
              <p className="text-xs text-white/45">KDA</p>
            </div>
            <MiniBars />
          </div>
        </div>
      )}
    </motion.div>
  );
}

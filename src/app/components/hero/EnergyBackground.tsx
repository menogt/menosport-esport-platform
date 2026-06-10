import type { MotionValue } from 'motion/react';
import { motion } from 'motion/react';

export function EnergyBackground({
  y,
  scale,
  opacity,
}: {
  y: MotionValue<string | number>;
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
}) {
  return (
    <motion.div className="absolute inset-0 pointer-events-none" style={{ y, scale, opacity }}>
      <div className="absolute inset-0" style={{ background: '#04050b' }} />

      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(circle at 18% 28%, rgba(255,70,85,0.24), transparent 34%),
          radial-gradient(circle at 82% 24%, rgba(0,212,255,0.18), transparent 35%),
          radial-gradient(circle at 50% 78%, rgba(124,58,237,0.24), transparent 42%),
          linear-gradient(180deg, rgba(8,10,18,0), rgba(4,5,11,0.92))
        `,
      }} />

      <div className="absolute inset-x-[-10%] bottom-[-22%] h-[70%]" style={{
        backgroundImage: `
          linear-gradient(rgba(0,212,255,0.09) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,70,85,0.08) 1px, transparent 1px)
        `,
        backgroundSize: '70px 70px',
        transform: 'perspective(780px) rotateX(64deg)',
        transformOrigin: 'center bottom',
        maskImage: 'linear-gradient(to top, black, transparent 86%)',
      }} />

      <div className="absolute left-1/2 top-[58%] h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10" />
      <div className="absolute left-1/2 top-[58%] h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-300/10" />
      <div className="absolute left-1/2 top-[58%] h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/10" />

      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `
          radial-gradient(1px 1px at 12% 22%, rgba(255,255,255,0.7), transparent),
          radial-gradient(1px 1px at 22% 74%, rgba(0,212,255,0.65), transparent),
          radial-gradient(1px 1px at 62% 18%, rgba(255,70,85,0.72), transparent),
          radial-gradient(1px 1px at 86% 62%, rgba(255,255,255,0.46), transparent),
          radial-gradient(1px 1px at 46% 88%, rgba(124,58,237,0.7), transparent)
        `,
      }} />

      <div className="absolute left-[10%] top-[18%] h-32 w-72 rotate-[-18deg] border-l border-t border-red-300/14" />
      <div className="absolute right-[8%] top-[20%] h-40 w-80 rotate-[16deg] border-r border-t border-cyan-300/14" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.56) 100%)' }} />
    </motion.div>
  );
}

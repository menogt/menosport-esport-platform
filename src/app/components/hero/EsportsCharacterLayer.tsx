import type { MotionValue } from 'motion/react';
import { motion } from 'motion/react';

type CharacterVariant = 'assassin' | 'tank' | 'marksman' | 'strategist';

type EsportsCharacterLayerProps = {
  variant: CharacterVariant;
  className?: string;
  style?: {
    x?: MotionValue<string | number>;
    y?: MotionValue<string | number>;
    scale?: MotionValue<number>;
    rotate?: MotionValue<number>;
    rotateY?: MotionValue<number>;
    opacity?: MotionValue<number>;
    zIndex?: number;
  };
};

const colors: Record<CharacterVariant, { main: string; rim: string; dark: string }> = {
  assassin: { main: '#ff4655', rim: '#00d4ff', dark: '#111827' },
  tank: { main: '#7c3aed', rim: '#ff4655', dark: '#0f172a' },
  marksman: { main: '#00d4ff', rim: '#a855f7', dark: '#0b1120' },
  strategist: { main: '#f97316', rim: '#00d4ff', dark: '#101018' },
};

export function EsportsCharacterLayer({ variant, className = '', style }: EsportsCharacterLayerProps) {
  const c = colors[variant];

  return (
    <motion.div
      className={`absolute hidden md:block pointer-events-none select-none ${className}`}
      style={{ transformStyle: 'preserve-3d', transformOrigin: 'bottom center', ...style }}
    >
      <motion.div
        animate={{ y: [0, -14, 0], rotateZ: [-1.4, 1.4, -1.4] }}
        transition={{ duration: variant === 'tank' ? 5.8 : 4.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'relative',
          width: variant === 'tank' ? 270 : 230,
          height: variant === 'tank' ? 520 : 480,
          transformStyle: 'preserve-3d',
          filter: `drop-shadow(0 0 26px ${c.main}44) drop-shadow(0 28px 40px rgba(0,0,0,0.55))`,
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 80%, ${c.main}35, transparent 66%)`,
          filter: 'blur(18px)',
          transform: 'translateZ(-80px)',
        }} />

        <div style={{
          position: 'absolute',
          left: '50%',
          top: 50,
          width: 70,
          height: 84,
          transform: 'translateX(-50%) translateZ(70px)',
          borderRadius: variant === 'strategist' ? '44% 44% 52% 52%' : '50% 50% 44% 44%',
          background: `linear-gradient(145deg, ${c.rim}, ${c.dark} 58%)`,
          border: `1px solid ${c.rim}66`,
          boxShadow: `0 0 28px ${c.rim}55, inset -12px -16px 20px rgba(0,0,0,0.36)`,
        }} />
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 87,
          width: 86,
          height: 14,
          transform: 'translateX(-50%) translateZ(98px)',
          borderRadius: 999,
          background: `linear-gradient(90deg, transparent, ${c.rim}, white, ${c.rim}, transparent)`,
          boxShadow: `0 0 24px ${c.rim}`,
        }} />

        <div style={{
          position: 'absolute',
          left: '50%',
          top: 138,
          width: variant === 'tank' ? 140 : 112,
          height: 170,
          transform: 'translateX(-50%) translateZ(52px)',
          clipPath: 'polygon(20% 0, 80% 0, 100% 28%, 84% 100%, 16% 100%, 0 28%)',
          background: `linear-gradient(145deg, ${c.main}, ${c.dark} 62%)`,
          border: `1px solid ${c.rim}40`,
          boxShadow: `inset -16px -26px 32px rgba(0,0,0,0.42), 0 0 34px ${c.main}33`,
        }} />

        <motion.div
          animate={{ rotateZ: variant === 'marksman' ? [-12, -4, -12] : [-16, 10, -16] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', left: 38, top: 160, width: 42, height: 180, transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
        >
          <div style={{ height: 118, borderRadius: 22, background: `linear-gradient(180deg, ${c.dark}, ${c.main}88)`, border: `1px solid ${c.rim}28` }} />
          <div style={{ marginTop: -6, marginLeft: -10, width: 34, height: 84, borderRadius: 18, background: c.dark, border: `1px solid ${c.main}44` }} />
        </motion.div>

        <motion.div
          animate={{ rotateZ: variant === 'marksman' ? [8, -12, 8] : [14, -8, 14] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', right: 38, top: 160, width: 42, height: 210, transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
        >
          <div style={{ height: 122, borderRadius: 22, background: `linear-gradient(180deg, ${c.dark}, ${c.main}88)`, border: `1px solid ${c.rim}28` }} />
          <div style={{ marginTop: -6, marginLeft: 18, width: 34, height: 92, borderRadius: 18, background: c.dark, border: `1px solid ${c.main}44` }} />
          {variant === 'marksman' && (
            <div style={{ position: 'absolute', left: 16, top: 116, width: 150, height: 12, borderRadius: 999, background: `linear-gradient(90deg, ${c.rim}, white)`, boxShadow: `0 0 22px ${c.rim}`, transform: 'rotate(-8deg) translateZ(64px)' }} />
          )}
        </motion.div>

        <motion.div animate={{ rotateX: [7, -8, 7] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', left: 92, top: 294, width: 44, height: 174, transformOrigin: 'top center' }}>
          <div style={{ height: 104, borderRadius: 20, background: `linear-gradient(180deg, ${c.dark}, #05070d)`, border: `1px solid ${c.rim}22` }} />
          <div style={{ marginTop: -4, width: 42, height: 86, borderRadius: 20, background: '#060913', border: `1px solid ${c.main}33` }} />
        </motion.div>
        <motion.div animate={{ rotateX: [-7, 8, -7] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', right: 92, top: 294, width: 44, height: 174, transformOrigin: 'top center' }}>
          <div style={{ height: 104, borderRadius: 20, background: `linear-gradient(180deg, ${c.dark}, #05070d)`, border: `1px solid ${c.rim}22` }} />
          <div style={{ marginTop: -4, width: 42, height: 86, borderRadius: 20, background: '#060913', border: `1px solid ${c.main}33` }} />
        </motion.div>

        {variant === 'tank' && (
          <div style={{ position: 'absolute', left: -16, top: 168, width: 78, height: 154, borderRadius: '22px 22px 50px 50px', background: `linear-gradient(135deg, ${c.main}44, rgba(255,255,255,0.08))`, border: `1px solid ${c.rim}55`, boxShadow: `0 0 28px ${c.main}44`, transform: 'translateZ(90px)' }} />
        )}
      </motion.div>
    </motion.div>
  );
}

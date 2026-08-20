import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import GameHeaderPlaceholder from "@/components/GameHeaderPlaceholder";

type ParallaxGameCardProps = {
  name: string;
  meta: string;
  tone: string;
  index: number;
  glyph: string;
};

export default function ParallaxGameCard({ name, meta, tone, index, glyph }: ParallaxGameCardProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [18, -18]);

  return (
    <motion.a
      ref={ref}
      className="game-card"
      href={`#${name.toLowerCase().replaceAll(" ", "-")}`}
      style={{ "--game-accent": tone } as React.CSSProperties}
    >
      <div className="game-card__top"><span>0{index + 1}</span><ArrowUpRight size={17} /></div>
      <motion.div className="game-card__visual" style={{ y }}>
        <GameHeaderPlaceholder game={name} accent={tone} />
        <div className="game-card__glyph">{glyph}</div>
      </motion.div>
      <div className="game-card__bottom"><div><h3>{name}</h3><p>{meta}</p></div><span className="game-card__dot" /></div>
    </motion.a>
  );
}

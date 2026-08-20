import { motion, useScroll, useTransform } from "framer-motion";
import { SpotlightFrame } from "@/components/VisualEffects";

export default function ParallaxHeroArt() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 700], [0, 72]);
  const rotate = useTransform(scrollY, [0, 700], [0, -7]);
  const scale = useTransform(scrollY, [0, 700], [1, 0.94]);

  return (
    <motion.div
      className="hero-art"
      aria-label="Abstract placeholder for licensed esports artwork"
      style={{ y, rotate, scale }}
    >
      <SpotlightFrame>
        <div className="hero-art__beam" />
      <div className="hero-art__ring hero-art__ring--outer" />
      <div className="hero-art__ring hero-art__ring--inner" />
      <div className="hero-art__core"><span>MA</span></div>
      <div className="hero-art__label"><span>LIVE SYSTEM</span><strong>COMPETITION<br />WITHOUT STATIC</strong></div>
        <div className="hero-art__readout"><span>NET / 04</span><strong>01:24:08</strong></div>
      </SpotlightFrame>
    </motion.div>
  );
}

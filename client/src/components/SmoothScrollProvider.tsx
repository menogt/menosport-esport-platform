import { useEffect, type PropsWithChildren } from "react";
import Lenis from "lenis";

export default function SmoothScrollProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mediaQuery.matches) {
      root.style.setProperty("--scroll-progress", "0");
      root.style.setProperty("--scroll-velocity", "0");
      root.dataset.motion = "reduced";
      return;
    }

    root.dataset.motion = "full";
    const lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      syncTouch: false,
      lerp: 0.085,
      wheelMultiplier: 0.92,
    });

    let frameId = 0;
    let velocity = 0;
    const handleScroll = ({ progress, velocity: nextVelocity, direction }: { progress: number; velocity: number; direction: number }) => {
      velocity = Math.max(-1.8, Math.min(1.8, nextVelocity / 900));
      root.style.setProperty("--scroll-progress", progress.toFixed(4));
      root.style.setProperty("--scroll-velocity", velocity.toFixed(4));
      root.style.setProperty("--scroll-direction", String(direction));
    };

    lenis.on("scroll", handleScroll);

    const raf = (time: number) => {
      lenis.raf(time);
      velocity *= 0.92;
      root.style.setProperty("--scroll-velocity", velocity.toFixed(4));
      frameId = window.requestAnimationFrame(raf);
    };

    frameId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(frameId);
      lenis.off("scroll", handleScroll);
      lenis.destroy();
      delete root.dataset.motion;
      root.style.removeProperty("--scroll-progress");
      root.style.removeProperty("--scroll-velocity");
      root.style.removeProperty("--scroll-direction");
    };
  }, []);

  return <>{children}</>;
}

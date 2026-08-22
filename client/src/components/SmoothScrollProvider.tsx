import { useEffect, type PropsWithChildren } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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
      ScrollTrigger.update();
    };

    lenis.on("scroll", handleScroll);

    const raf = (time: number) => {
      lenis.raf(time);
      velocity *= 0.92;
      root.style.setProperty("--scroll-velocity", velocity.toFixed(4));
      frameId = window.requestAnimationFrame(raf);
    };

    frameId = window.requestAnimationFrame(raf);
    const refreshScrollTrigger = () => ScrollTrigger.refresh();
    window.addEventListener("load", refreshScrollTrigger, { once: true });
    document.fonts?.ready.then(refreshScrollTrigger).catch(() => undefined);
    window.setTimeout(refreshScrollTrigger, 120);

    return () => {
      window.cancelAnimationFrame(frameId);
      lenis.off("scroll", handleScroll);
      lenis.destroy();
      ScrollTrigger.refresh();
      window.removeEventListener("load", refreshScrollTrigger);
      delete root.dataset.motion;
      root.style.removeProperty("--scroll-progress");
      root.style.removeProperty("--scroll-velocity");
      root.style.removeProperty("--scroll-direction");
    };
  }, []);

  return <>{children}</>;
}

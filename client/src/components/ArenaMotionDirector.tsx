import { useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ArenaMotionDirector() {
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .from(".site-header", { y: -20, autoAlpha: 0, duration: 0.6 })
        .from("[data-hero-intro]", { y: 20, autoAlpha: 0, stagger: 0.09, duration: 0.72 }, "-=0.22")
        .from(".hero-art__core", { scale: 0.82, rotation: 26, autoAlpha: 0, duration: 0.9 }, "-=0.48")
        .from(".hero-art__ring", { scale: 0.78, autoAlpha: 0, stagger: 0.12, duration: 0.8 }, "-=0.7")
        .from(".hero-art__label, .hero-art__readout", { x: 14, autoAlpha: 0, stagger: 0.08, duration: 0.55 }, "-=0.48");

      gsap.to(".hero-art__beam", { scaleX: 1.28, opacity: 0.8, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to(".hero-scanline", { scaleX: 1.18, xPercent: -7, opacity: 0.72, duration: 3.6, ease: "sine.inOut", yoyo: true, repeat: -1 });

      gsap.to(".spotlight-frame", {
        y: -34,
        scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: 0.7 },
      });
      gsap.to(".hero-art__ring--outer", {
        rotation: 142,
        scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: 1.05 },
      });
      gsap.to(".hero-art__ring--inner", {
        rotation: -128,
        scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: 0.9 },
      });

      const batches = [".tournament-card", ".match-row", ".game-card", ".leaderboard-line"];
      batches.forEach(selector => {
        gsap.set(selector, { y: 26, autoAlpha: 0 });
        ScrollTrigger.batch(selector, {
          start: "top 86%",
          once: true,
          onEnter: elements => gsap.to(elements, { y: 0, autoAlpha: 1, stagger: 0.075, duration: 0.72, ease: "power3.out", overwrite: true }),
        });
      });

      const hero = document.querySelector<HTMLElement>(".hero-section");
      let frame = 0;
      let pointerX = 0;
      let pointerY = 0;
      const updatePointer = () => {
        if (!hero) return;
        hero.style.setProperty("--arena-pointer-x", pointerX.toFixed(2));
        hero.style.setProperty("--arena-pointer-y", pointerY.toFixed(2));
        frame = 0;
      };
      const handlePointer = (event: PointerEvent) => {
        if (!hero) return;
        const bounds = hero.getBoundingClientRect();
        pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
        if (!frame) frame = window.requestAnimationFrame(updatePointer);
      };
      const resetPointer = () => {
        pointerX = 0;
        pointerY = 0;
        if (!frame) frame = window.requestAnimationFrame(updatePointer);
      };
      hero?.addEventListener("pointermove", handlePointer, { passive: true });
      hero?.addEventListener("pointerleave", resetPointer);

      return () => {
        if (frame) window.cancelAnimationFrame(frame);
        hero?.removeEventListener("pointermove", handlePointer);
        hero?.removeEventListener("pointerleave", resetPointer);
      };
    });

    return () => context.revert();
  }, []);

  return null;
}

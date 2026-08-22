import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("motion system", () => {
  it("synchronises Lenis scroll updates with GSAP ScrollTrigger", () => {
    const provider = read("client/src/components/SmoothScrollProvider.tsx");
    expect(provider).toContain('import { ScrollTrigger } from "gsap/ScrollTrigger"');
    expect(provider).toContain("ScrollTrigger.update()");
    expect(provider).toContain("ScrollTrigger.refresh()");
  });

  it("keeps public motion scoped, interactive, and reduced-motion safe", () => {
    const director = read("client/src/components/ArenaMotionDirector.tsx");
    const styles = read("client/src/index.css");
    expect(director).toContain("prefers-reduced-motion: reduce");
    expect(director).toContain("ScrollTrigger.batch");
    expect(director).toContain("pointermove");
    expect(styles).toContain("@keyframes ticker-drift");
    expect(styles).toContain(".ticker-items { animation: none; }");
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("Phase 1 foundation", () => {
  it("initializes Lenis once and cleans up its animation frame", () => {
    const provider = readProjectFile("client/src/components/SmoothScrollProvider.tsx");

    expect(provider).toContain('import Lenis from "lenis"');
    expect(provider).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
    expect(provider).toContain("window.requestAnimationFrame(raf)");
    expect(provider).toContain("lenis.destroy()");
  });

  it("keeps reduced-motion behavior in the global stylesheet", () => {
    const stylesheet = readProjectFile("client/src/index.css");

    expect(stylesheet).toContain("@media (prefers-reduced-motion: reduce)");
    expect(stylesheet).toContain("--arena-lime: #d8ff62");
    expect(stylesheet).toContain("min-height: 100dvh");
  });
});

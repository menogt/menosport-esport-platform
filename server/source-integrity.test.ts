import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoots = ["client/src", "server", "shared", "drizzle"];
const conflictMarker = /^(<<<<<<<|=======|>>>>>>>)/m;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap(entry => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx|css|sql)$/.test(path) ? [path] : [];
  });
}

describe("source integrity", () => {
  it("contains no unresolved merge-conflict markers in application sources", () => {
    const files = sourceRoots.flatMap(sourceFiles);
    const conflicts = files.filter(file => conflictMarker.test(readFileSync(file, "utf8")));

    expect(conflicts).toEqual([]);
  });
});

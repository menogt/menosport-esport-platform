import { describe, expect, it } from "vitest";
import { isValidSandboxEmail, markNotificationRead, unreadNotificationCount } from "../client/src/lib/phase3";

describe("Phase 3 client state helpers", () => {
  it("accepts valid sandbox registration emails and rejects malformed values", () => {
    expect(isValidSandboxEmail("captain@yourorg.gg")).toBe(true);
    expect(isValidSandboxEmail("captain@yourorg")).toBe(false);
    expect(isValidSandboxEmail(" captain@yourorg.gg ")).toBe(true);
  });

  it("marks a notification read without mutating the original collection", () => {
    const source = [
      { id: 1, title: "Match", detail: "Room open", unread: true },
      { id: 2, title: "Roster", detail: "Locked", unread: false },
    ];
    const next = markNotificationRead(source, 1);
    expect(next[0]?.unread).toBe(false);
    expect(source[0]?.unread).toBe(true);
    expect(unreadNotificationCount(next)).toBe(0);
  });
});

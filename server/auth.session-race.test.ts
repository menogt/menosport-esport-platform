import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/_core/hooks/useAuth.ts", import.meta.url), "utf8");

describe("useAuth session restoration guard", () => {
  it("does not query auth.me until Supabase reports that session restoration is ready", () => {
    expect(source).toContain("const [authReady, setAuthReady] = useState(false)");
    expect(source).toContain("enabled: authReady");
    expect(source).toContain("supabase.auth.getSession().finally");
  });

  it("invalidates auth.me when Supabase auth state changes", () => {
    expect(source).toContain("supabase.auth.onAuthStateChange");
    expect(source).toContain("void utils.auth.me.invalidate()");
  });
});

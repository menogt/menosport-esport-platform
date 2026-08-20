import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    setPending(false);

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      toast.success("Account created. Check your email to confirm access.");
      setMode("signin");
      return;
    }

    toast.success("Welcome back to Meno Arena.");
    navigate("/dashboard/player");
    window.location.reload();
  }

  return (
    <main className="min-h-[100dvh] bg-[#070907] text-white">
      <div className="grid min-h-[100dvh] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden border-r border-white/10 px-12 py-12 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(183,255,58,0.18),transparent_35%),linear-gradient(135deg,#10170d_0%,#070907_58%)]" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300 font-black text-black">M</span>
            <div>
              <p className="text-xs font-black tracking-[0.24em]">MENO ARENA</p>
              <p className="mt-1 text-[10px] tracking-[0.2em] text-white/40">PLAYER NETWORK</p>
            </div>
          </div>
          <div className="relative max-w-xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-lime-300">The room is live</p>
            <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-white xl:text-7xl">Your next series starts here.</h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/55">Keep your roster, brackets, match evidence, and organization signal in one competitive workspace.</p>
          </div>
          <p className="relative text-xs text-white/35">Supabase Auth is enabled for this environment.</p>
        </section>

        <section className="flex items-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-lime-300 font-black text-black">M</span>
                <span className="text-xs font-black tracking-[0.24em]">MENO ARENA</span>
              </div>
            </div>
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lime-300">Secure access</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">{mode === "signin" ? "Enter the arena." : "Create your player seat."}</h2>
              <p className="mt-4 text-sm leading-6 text-white/50">{mode === "signin" ? "Sign in to manage your teams, matches, and tournament commitments." : "Use an email and password to create a Supabase-backed player account."}</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-[0.16em] text-white/55">Email address</Label>
                <Input id="email" type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="captain@yourorg.gg" className="h-12 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/25" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-[0.16em] text-white/55">Password</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 6 characters" className="h-12 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/25" />
              </div>
              <Button type="submit" disabled={pending} className="h-12 w-full rounded-xl bg-lime-300 font-semibold text-black transition-transform hover:bg-lime-200 active:scale-[0.98]">{pending ? "Connecting..." : mode === "signin" ? "Sign in" : "Create account"}</Button>
            </form>

            <button type="button" onClick={() => setMode(current => current === "signin" ? "signup" : "signin")} className="mt-6 text-sm text-white/45 transition-colors hover:text-lime-300">{mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}</button>
          </div>
        </section>
      </div>
    </main>
  );
}

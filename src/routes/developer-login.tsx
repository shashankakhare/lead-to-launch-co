import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { amIDeveloper } from "@/lib/developer.functions";
import { Code2 } from "lucide-react";

export const Route = createFileRoute("/developer-login")({
  head: () => ({
    meta: [
      { title: "Developer Login · Building Website Now" },
      { name: "description", content: "Sign in to your developer workspace." },
    ],
  }),
  component: DeveloperLoginPage,
});

function DeveloperLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/developer" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      const res = await amIDeveloper();
      if (!res.isDeveloper) {
        await supabase.auth.signOut();
        throw new Error("You are not authorized to access the developer workspace.");
      }
      navigate({ to: "/developer" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!email) {
      setError("Enter your email first, then click Forgot password.");
      return;
    }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setError(err ? err.message : "Reset link sent — check your inbox.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-1 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Code2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Developer workspace</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage your assigned projects.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dev-email">Email</Label>
            <Input id="dev-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dev-password">Password</Label>
            <Input id="dev-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="text-center text-sm space-y-1">
          <button type="button" onClick={handleReset} className="text-primary hover:underline">
            Forgot password?
          </button>
          <div>
            <a href="/auth" className="text-muted-foreground hover:underline">Client login</a>
          </div>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@server/supabase/client";
import Spinner from "@/components/Spinner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="panel-theme panel-login">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 shadow-sm"
      >
        <h1 className="font-display text-xl font-semibold text-navy">Admin Login</h1>
        <p className="mt-1 text-sm text-ink-soft">Shenjar Crafts content management</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy">Email</label>
            <input
              aria-label="Email address" autoComplete="username" type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Password</label>
            <input
              aria-label="Password" autoComplete="current-password" type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error ? <p role="alert" className="mt-4 text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-wood px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-60"
        >
          {loading ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

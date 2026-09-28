"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@server/supabase/client";
import { partnerAuthEmail } from "@server/partners/authEmail";
import Spinner from "@/components/Spinner";

function PartnerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inactive = searchParams.get("error") === "inactive";

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: partnerAuthEmail(mobile),
      password,
    });
    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }
    router.replace("/partner");
    router.refresh();
  }

  return (
    <div className="panel-theme panel-login">
      <div className="w-full max-w-sm space-y-4">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-white p-8 shadow-sm"
        >
          <h1 className="font-display text-xl font-semibold text-navy">Partner Login</h1>
          <p className="mt-1 text-sm text-ink-soft">Shenjar Crafts partner portal</p>

          {inactive ? (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              This partner account is inactive. Contact the shop to reactivate it.
            </p>
          ) : null}

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy">Mobile</label>
              <input
                aria-label="Mobile number" autoComplete="username" type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
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

        <aside className="rounded-2xl border border-border bg-white/85 p-4 text-sm text-ink-soft shadow-sm">
          <p className="font-semibold text-navy">Install as Partner App</p>
          <p className="mt-1 text-xs leading-relaxed">
            Open this page on your phone, then add it to your home screen for app-like access.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs leading-relaxed">
            <li><strong className="text-navy">Android:</strong> Chrome menu → Add to Home screen.</li>
            <li><strong className="text-navy">iPhone:</strong> Safari share button → Add to Home Screen.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

export default function PartnerLoginPage() {
  return (
    <Suspense>
      <PartnerLoginForm />
    </Suspense>
  );
}

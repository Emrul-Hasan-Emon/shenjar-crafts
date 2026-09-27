import type { NextConfig } from "next";
import { tryGetSupabaseUrl } from "./server/supabase/env";

const supabaseUrl = tryGetSupabaseUrl();
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "*.supabase.co";

const nextConfig: NextConfig = {
  // Bridges the environment-specific Supabase URL/anon key (SUPABASE_URL/SUPABASE_ANON_KEY in
  // production, DEV_SUPABASE_URL/DEV_SUPABASE_ANON_KEY in development — see
  // server/supabase/env.ts) into the browser bundle under fixed names, since only
  // NEXT_PUBLIC_-prefixed vars (or vars listed here) are ever visible client-side. Both values
  // are meant to be public — the anon key is designed to be safe in the browser; real access
  // control is Row Level Security, not secrecy of this key. The service role key must NEVER
  // appear here.
  env:
    process.env.NODE_ENV === "production"
      ? {
          NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        }
      : {
          NEXT_PUBLIC_SUPABASE_URL: process.env.DEV_SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.DEV_SUPABASE_ANON_KEY,
        },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Some local/sandboxed dev networks resolve the Supabase hostname to a
    // NAT64-synthesized IPv6 address, which Next's SSRF check mistakes for a
    // private IP. Only relax this in development — production (Vercel) DNS
    // doesn't hit this, so the SSRF protection stays fully on there.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;

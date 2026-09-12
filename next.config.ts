import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "*.supabase.co";

const nextConfig: NextConfig = {
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

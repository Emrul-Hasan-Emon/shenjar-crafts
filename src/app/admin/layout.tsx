import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminPwaRegistration from "@/components/pwa/AdminPwaRegistration";

// The root layout advertises the Partner Portal app. Everything under /admin overrides it with the Admin
// app's own manifest and icons, so "Install"/"Add to Home Screen" from here installs the Admin app.
export const metadata: Metadata = {
  manifest: "/admin-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Shenjar Admin",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/images/admin_app_192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/admin_app_512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/images/admin_app_180.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AdminPwaRegistration />
    </>
  );
}

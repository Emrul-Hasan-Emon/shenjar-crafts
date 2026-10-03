import type { Metadata } from "next";

/**
 * Partner Portal app identity (manifest + icons). Applied only to the Partner pages and the public /partners
 * install page. It is deliberately not in the root layout, so the Admin app and the public site never
 * advertise or install the Partner app.
 */
export const partnerPwaMetadata: Metadata = {
  manifest: "/partner-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Shenjar Partner",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/images/partner_portal_192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/partner_portal_512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/images/partner_portal_180.png", sizes: "180x180", type: "image/png" }],
  },
};

import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/data/site";
import { LanguageProvider } from "@/lib/i18n";
import PartnerPwaRegistration from "@/components/PartnerPwaRegistration";

const heading = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} | Custom Furniture & Interior Design in Dhaka`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
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

export const viewport: Viewport = {
  themeColor: "#172e40",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${heading.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink font-sans">
        <LanguageProvider>{children}<PartnerPwaRegistration /></LanguageProvider>
      </body>
    </html>
  );
}

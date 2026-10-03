import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/data/site";
import { LanguageProvider } from "@/lib/i18n";

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
  // No app manifest here: Admin and Partner each declare their own on their own pages.
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
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

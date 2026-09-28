import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/Container";
import PageIntro from "@/components/PageIntro";
import PartnerInstallButton from "@/components/PartnerInstallButton";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Partners",
  description:
    "Join the Shenjar Crafts partner network, create customer orders, share your partner code, and manage commissions through the Partner Portal app.",
};

const benefits = [
  {
    title: "Earn from referred projects",
    description: "Create orders for your customers and track commission once the project is delivered.",
  },
  {
    title: "Give customers a better offer",
    description: "Your partner code can carry a customer discount configured by Shenjar Crafts.",
  },
  {
    title: "Manage from your phone",
    description: "Use the Partner Portal like an app for order creation, order status, and partner summaries.",
  },
];

const steps = [
  ["01", "Share your customer need", "Furniture, interior, or custom craft requirement — create it from the Partner Portal."],
  ["02", "Shenjar Crafts handles the project", "Our team reviews, prices, crafts, and delivers the work with the customer."],
  ["03", "Track your commission", "Your dashboard keeps your code, order records, discounts, and earned commission in one place."],
];

export default function PartnersPage() {
  return (
    <>
      <PageIntro
        eyebrow="Partners"
        title="Grow with Shenjar Crafts. Bring customers, track orders, earn commission."
        description="The Shenjar Crafts Partner Program gives selected partners a dedicated portal for creating orders, sharing partner codes, and following their commission journey from mobile."
      />

      <section className="py-8 sm:py-14 lg:py-20">
        <Container className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-wood uppercase">Partner program</p>
            <h2 className="font-display mt-3 text-2xl font-semibold text-navy sm:text-4xl">
              A professional way to work with customers and Shenjar Crafts.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
              Partners can introduce customers, create order requests, and let Shenjar Crafts manage the craft,
              pricing, production, and delivery process. The portal keeps the partner side simple, transparent,
              and mobile-friendly.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/partner/login"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-navy px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-navy-light"
              >
                Go to Partner Portal
              </Link>
              <PartnerInstallButton className="inline-flex min-h-12 items-center justify-center rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-cream" />
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-white p-4 shadow-[0_18px_45px_rgba(22,43,60,0.08)] sm:p-6">
            <div className="relative mx-auto aspect-square max-w-xs overflow-hidden rounded-3xl bg-navy p-6">
              <Image
                src="/images/partner_portal.png"
                alt="Shenjar Crafts Partner Portal logo"
                fill
                sizes="(min-width: 1024px) 360px, 80vw"
                className="object-contain p-8"
                priority
              />
            </div>
            <div className="mt-5 rounded-2xl bg-cream-dark/50 p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-wood uppercase">Partner Portal App</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Add the portal to your phone home screen and open it like a dedicated app whenever you need to
                create or check orders.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-cream-dark/55 py-8 sm:py-14 lg:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-wood uppercase">Why partner with us</p>
            <h2 className="font-display mt-3 text-2xl font-semibold text-navy sm:text-4xl">
              Designed for simple, mobile partner work.
            </h2>
          </div>
          <div className="mt-6 grid gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-5">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <h3 className="font-display text-lg font-semibold text-navy">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{benefit.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-8 sm:py-14 lg:py-20">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-12">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-wood uppercase">How it works</p>
              <h2 className="font-display mt-3 text-2xl font-semibold text-navy sm:text-4xl">
                From customer interest to delivered project.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
                Partners do not need to manage the full production process. The portal keeps the request and tracking
                workflow clear while Shenjar Crafts handles the craft work.
              </p>
            </div>
            <ol className="grid gap-3">
              {steps.map(([number, title, description]) => (
                <li key={number} className="flex gap-4 rounded-2xl border border-border bg-white p-5">
                  <span className="font-display text-3xl leading-none text-wood">{number}</span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-navy">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section id="install-partner-app" className="commission-section py-8 sm:py-14 lg:py-20">
        <Container className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-wood uppercase">Install the app</p>
            <h2 className="font-display mt-3 text-2xl font-semibold text-navy sm:text-4xl">
              Add Partner Portal to your phone.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
              The Partner Portal is available as an installable web app. It uses the same secure login and opens in
              an app-like full-screen experience after installation.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-cream p-4">
                <p className="font-semibold text-navy">Android</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Open in Chrome, tap the menu, then choose <strong>Add to Home screen</strong>.
                </p>
              </div>
              <div className="rounded-2xl bg-cream p-4">
                <p className="font-semibold text-navy">iPhone</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Open in Safari, tap Share, then choose <strong>Add to Home Screen</strong>.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <PartnerInstallButton className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-wood px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy" />
              </div>
              <Link
                href="/partner/login"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-cream"
              >
                Go to Partner Portal
              </Link>
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-cream"
              >
                Ask about partnership
              </a>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}



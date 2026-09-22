import type { Metadata } from "next";
import type { ReactElement } from "react";
import Container from "@/components/Container";
import PageIntro from "@/components/PageIntro";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Shenjar Crafts for custom furniture, interior, exterior, and electrical projects in Dhaka.",
};

function ContactIcon({ path }: { path: ReactElement }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {path}
    </svg>
  );
}

const CONTACT_CARDS = [
  {
    label: "WhatsApp",
    value: "Discuss your project",
    href: site.whatsappHref,
    icon: <path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8v.5z" />,
  },
  {
    label: "Call the Workshop",
    value: site.phoneDisplay,
    href: site.phoneHref,
    icon: <path d="M2.25 6.75c0 8.284 6.716 15 15 15h1.5a2.25 2.25 0 002.25-2.25v-1.5a1 1 0 00-.8-.98l-4-.8a1 1 0 00-1 .27l-1 1a13 13 0 01-6.15-6.15l1-1a1 1 0 00.27-1l-.8-4a1 1 0 00-.98-.8h-1.5A2.25 2.25 0 002.25 6.75z" />,
  },
  {
    label: "Address",
    value: site.address,
    href: site.mapEmbedSrc.replace("&output=embed", ""),
    icon: <><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></>,
  },
  {
    label: "Facebook",
    value: "Shenjar Crafts",
    href: site.facebook,
    icon: <path d="M14 9.75h2.25V6.75H14c-1.795 0-3.25 1.455-3.25 3.25v1.75H9v3h1.75V21h3v-6.25h2.25l.5-3H13.75v-1.5c0-.414.336-.75.75-.75z" />,
  },
];

export default function ContactPage() {
  return (
    <>
    <PageIntro eyebrow="Let’s Talk" title="Every great piece starts with a conversation." description="Share your ideas, measurements, or a reference you love. Let’s work out what fits your space." />
    <section className="py-6 sm:py-10 lg:py-12">
      <Container>


        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {CONTACT_CARDS.map((card) => (
            <a
              key={card.label}
              href={card.href}
              target={card.href.startsWith("http") ? "_blank" : undefined}
              rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="studio-card rounded-2xl border border-border bg-white/80 p-4 text-center transition-all sm:p-6"
            >
              <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-wood-soft text-wood sm:h-11 sm:w-11">
                <ContactIcon path={card.icon} />
              </span>
              <p className="mt-3 text-[10px] font-semibold tracking-[0.15em] text-wood uppercase sm:mt-4 sm:text-xs sm:tracking-[0.2em]">
                {card.label}
              </p>
              <p className="mt-1.5 text-xs font-medium text-navy sm:mt-2 sm:text-sm">{card.value}</p>
            </a>
          ))}
        </div>

        <div className="contact-consultation mt-6 rounded-2xl border border-border bg-cream-dark/50 p-5 sm:p-8">
          <p className="text-xs font-semibold tracking-widest text-wood uppercase">A little inspiration goes a long way</p>
          <h2 className="font-display mt-2 text-2xl font-semibold text-navy">Tell us what you have in mind.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">Send a photo of your space, approximate measurements, and any designs or finishes you like. We can discuss the details together.</p>
        <div className="mt-5 grid grid-cols-2 items-center gap-3 sm:max-w-xl">
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-full bg-wood px-3 py-3 text-center text-xs sm:px-8 sm:text-sm font-semibold text-cream transition-colors hover:bg-navy sm:w-auto"
          >
            Message on WhatsApp
          </a>
          <a
            href={site.phoneHref}
            className="w-full rounded-full bg-navy px-3 py-3 text-center text-xs sm:px-8 sm:text-sm font-semibold text-cream transition-colors hover:bg-navy-light sm:w-auto"
          >
            Call {site.phoneDisplay}
          </a>
        </div>

        </div>

        <div className="mt-6 overflow-hidden sm:mt-12 rounded-2xl border border-border shadow-sm">
          <iframe
            title="Shenjar Crafts location"
            src={site.mapEmbedSrc}
            className="h-56 w-full sm:h-80"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Container>
    </section>
    </>
  );
}

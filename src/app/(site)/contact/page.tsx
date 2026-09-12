import type { Metadata } from "next";
import type { ReactElement } from "react";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
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
    label: "Call or WhatsApp",
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
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Get In Touch"
          title="Let's Build Something Together"
          description="Send us your project details — measurements, ideas, reference photos — and we'll get back to you."
          align="center"
        />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONTACT_CARDS.map((card) => (
            <a
              key={card.label}
              href={card.href}
              target={card.href.startsWith("http") ? "_blank" : undefined}
              rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="rounded-2xl border border-border bg-white p-6 text-center transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-28px_rgba(22,41,74,0.3)]"
            >
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-wood-soft text-wood">
                <ContactIcon path={card.icon} />
              </span>
              <p className="mt-4 text-xs font-semibold tracking-[0.2em] text-wood uppercase">
                {card.label}
              </p>
              <p className="mt-2 text-sm font-medium text-navy">{card.value}</p>
            </a>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-full bg-wood px-8 py-3 text-center text-sm font-semibold text-cream transition-colors hover:bg-wood-light sm:w-auto"
          >
            Message on WhatsApp
          </a>
          <a
            href={site.phoneHref}
            className="w-full rounded-full bg-navy px-8 py-3 text-center text-sm font-semibold text-cream transition-colors hover:bg-navy-light sm:w-auto"
          >
            Call {site.phoneDisplay}
          </a>
        </div>

        <div className="mt-14 overflow-hidden rounded-2xl border border-border shadow-sm">
          <iframe
            title="Shenjar Crafts location"
            src={site.mapEmbedSrc}
            className="h-80 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Container>
    </section>
  );
}

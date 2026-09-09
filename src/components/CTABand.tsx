import Container from "./Container";
import { site } from "@/data/site";

export default function CTABand() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-light px-8 py-14 text-center sm:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 16px)",
            }}
          />
          <div className="relative flex flex-col items-center gap-6">
            <h2 className="font-display max-w-xl text-2xl font-semibold text-cream sm:text-3xl">
              Have a design or project in mind?
            </h2>
            <p className="max-w-xl text-cream/70">
              From a single custom piece to a complete interior and
              electrical project — tell us what you need and we&apos;ll
              bring it to life.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-wood px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-wood-light"
              >
                Message on WhatsApp
              </a>
              <a
                href={site.phoneHref}
                className="rounded-full border border-cream/25 px-7 py-3 text-sm font-semibold text-cream transition-colors hover:bg-cream/10"
              >
                Call {site.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

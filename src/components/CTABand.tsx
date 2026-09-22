import Container from "./Container";
import { site } from "@/data/site";

export default function CTABand() {
  return (
    <section className="py-8 sm:py-16">
      <Container>
        <div className="relative overflow-hidden rounded-2xl border border-wood-light/30 bg-gradient-to-br from-navy to-ink-dark px-5 py-8 text-center sm:px-16 sm:py-14">
          <div className="relative flex flex-col items-center gap-4 sm:gap-6">
            <h2 className="font-display max-w-xl text-2xl font-semibold text-cream sm:text-3xl">
              A piece that belongs in your space.
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-cream/80 sm:text-base">
              From a single custom piece to a complete interior and
              electrical project — tell us what you need and we&apos;ll
              bring it to life.
            </p>
            <div className="flex flex-row flex-wrap justify-center gap-2 sm:gap-3">
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-wood px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-navy sm:px-7 sm:py-3 sm:text-sm"
              >
                <span className="sm:hidden">WhatsApp</span>
                <span className="hidden sm:inline">Discuss Your Project</span>
              </a>
              <a
                href={site.phoneHref}
                className="rounded-full border border-cream/25 px-4 py-2.5 text-xs font-semibold text-cream transition-colors hover:bg-cream/10 sm:px-7 sm:py-3 sm:text-sm"
              >
                <span className="sm:hidden">Call Now</span>
                <span className="hidden sm:inline">Call {site.phoneDisplay}</span>
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

import Container from "./Container";
import { site } from "@/data/site";

export default function CTABand() {
  return (
    <section className="py-8 sm:py-16">
      <Container>
        <div className="cta-band rounded-3xl px-5 py-10 text-center sm:px-16 sm:py-16">
          <div className="relative flex flex-col items-center gap-4 sm:gap-6">
            <h2 className="font-display max-w-xl text-2xl font-semibold text-cream sm:text-3xl">
              A piece that belongs in your space.
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
              From a single custom piece to a complete interior and
              electrical project — tell us what you need and we&apos;ll
              bring it to life.
            </p>
            <div className="flex flex-row flex-wrap justify-center gap-2 sm:gap-3">
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-gradient-to-br from-[#ffd166] to-[#ffab2e] px-4 py-2.5 text-xs font-bold text-navy shadow-[0_8px_22px_#0a184055] transition-transform hover:-translate-y-0.5 sm:px-7 sm:py-3 sm:text-sm"
              >
                <span className="sm:hidden">WhatsApp</span>
                <span className="hidden sm:inline">Discuss Your Project</span>
              </a>
              <a
                href={site.phoneHref}
                className="rounded-full border border-white/45 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/15 sm:px-7 sm:py-3 sm:text-sm"
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

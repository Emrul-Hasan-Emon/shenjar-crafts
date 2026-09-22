import Link from "next/link";
import Container from "./Container";

export default function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <section className="studio-page-intro">
      <Container>
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-xs text-cream/70">
          <Link href="/" className="hover:text-white">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{eyebrow}</span>
        </nav>
        <p className="text-[10px] font-semibold tracking-[0.2em] text-wood-light uppercase sm:text-xs">{eyebrow}</p>
        <h1 className="font-display mt-3 max-w-3xl text-3xl leading-tight font-semibold text-cream sm:text-5xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream/80 sm:mt-5 sm:text-base">{description}</p> : null}
      </Container>
    </section>
  );
}

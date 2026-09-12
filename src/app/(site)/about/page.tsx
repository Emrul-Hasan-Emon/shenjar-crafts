import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import CTABand from "@/components/CTABand";
import { defaultAboutParagraphs, vision, commitment, expertise } from "@/data/site";
import { createClient } from "@server/supabase/server-client";
import { getAboutUs } from "@server/db/aboutUs";
import AboutContent from "./AboutContent";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Shenjar Crafts — a Dhaka-based custom furniture, interior, exterior, and electrical solutions studio.",
};

export default async function AboutPage() {
  const supabase = await createClient();
  const aboutUs = await getAboutUs(supabase);

  return (
    <>
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="About Shenjar Crafts"
            title="Designed by you, crafted by us"
          />
          <AboutContent
            contentEn={aboutUs?.content_en ?? null}
            contentBn={aboutUs?.content_bn ?? null}
            fallbackParagraphs={defaultAboutParagraphs}
          />
        </Container>
      </section>

      <section className="bg-cream-dark/50 py-10 sm:py-16 lg:py-20">
        <Container className="grid grid-cols-2 gap-3 sm:gap-6">
          <div className="rounded-2xl border border-border bg-white p-4 sm:p-8">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-wood-soft text-wood sm:h-11 sm:w-11">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4 sm:h-5 sm:w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <h3 className="font-display mt-3 text-sm font-semibold text-navy sm:mt-5 sm:text-xl">
              Our Vision
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-soft sm:mt-3 sm:text-base">{vision}</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4 sm:p-8">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-wood-soft text-wood sm:h-11 sm:w-11">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4 sm:h-5 sm:w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </span>
            <h3 className="font-display mt-3 text-sm font-semibold text-navy sm:mt-5 sm:text-xl">
              Our Commitment
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-soft sm:mt-3 sm:text-base">{commitment}</p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Our Expertise" title="What we're known for" align="center" />
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {expertise.map((item) => (
              <span
                key={item}
                className="rounded-full border border-navy/15 px-5 py-2 text-sm font-medium text-navy"
              >
                {item}
              </span>
            ))}
          </div>
        </Container>
      </section>

      <CTABand />
    </>
  );
}

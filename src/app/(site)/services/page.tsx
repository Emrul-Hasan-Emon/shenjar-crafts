import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import CTABand from "@/components/CTABand";
import Icon from "@/components/icons";
import { services } from "@/data/services";
import { createClient } from "@server/supabase/server-client";
import { listCategories } from "@server/db/categories";
import { listRawMedia } from "@server/db/rawMedia";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Services",
  description:
    "Custom furniture, interior & exterior solutions, house wiring, and fabrication services from Shenjar Crafts in Dhaka.",
};

export default async function ServicesPage() {
  const supabase = await createClient();
  const [categories, rawMedia] = await Promise.all([
    listCategories(supabase),
    listRawMedia(supabase),
  ]);

  const categoriesWithWork = new Set(
    rawMedia.map((m) => categories.find((c) => c.id === m.category_id)?.name_en.toLowerCase())
  );

  function workLinkFor(workCategories?: string[]) {
    if (!workCategories?.length) return null;
    const match = workCategories.find((name) => categoriesWithWork.has(name.toLowerCase()));
    if (!match) return null;
    const category = categories.find((c) => c.name_en.toLowerCase() === match.toLowerCase());
    if (!category) return null;
    return `/our-work?category=${category.slug}`;
  }

  return (
    <>
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="What We Do"
            title="Our Main Services"
            description="At Shenjar Crafts, we provide a comprehensive range of furniture, interior, exterior, electrical, and installation solutions — designed to meet both residential and commercial requirements, with a strong focus on quality, functionality, customization, and professional workmanship."
          />
        </Container>
      </section>

      <section className="pb-16 sm:pb-20">
        <Container className="space-y-8">
          {services.map((service, index) => {
            const workLink = workLinkFor(service.workCategories);
            return (
              <div
                key={service.slug}
                id={service.slug}
                className="scroll-mt-24 rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-[0_20px_40px_-28px_rgba(22,41,74,0.3)] sm:p-8"
              >
                <div className="flex items-start gap-3 sm:gap-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wood-soft text-wood sm:h-12 sm:w-12">
                    <Icon name={service.icon} className="h-5 w-5 sm:h-6 sm:w-6" />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold tracking-[0.2em] text-wood/70 uppercase">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="font-display text-xl font-semibold text-navy sm:text-2xl">
                      {service.title}
                    </h2>
                    <p className="mt-3 leading-relaxed text-ink-soft">{service.description}</p>
                    {service.items.length > 0 ? (
                      <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                        {service.items.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm text-ink-soft">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-wood" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {workLink ? (
                      <Link
                        href={workLink}
                        className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-wood"
                      >
                        See Our Work
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          className="h-4 w-4"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </Container>
      </section>

      <CTABand />
    </>
  );
}

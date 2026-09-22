import PageIntro from "@/components/PageIntro";
import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
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
      <PageIntro eyebrow="Our Expertise" title="From a single piece to an entire space." description="Furniture, interiors, exterior work, and electrical solutions — thoughtfully planned and carefully made." />


      <section className="py-6 sm:py-10">
        <Container className="grid items-start gap-4 lg:grid-cols-2 lg:gap-6">
          {services.map((service, index) => {
            const workLink = workLinkFor(service.workCategories);
            return (
              <div
                key={service.slug}
                id={service.slug}
                className="service-detail studio-card scroll-mt-24 rounded-2xl border border-border bg-white/80 p-4 sm:p-6"
              >
                <div className="flex items-start gap-3 sm:gap-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wood-soft text-wood sm:h-12 sm:w-12">
                    <Icon name={service.icon} className="h-5 w-5 sm:h-6 sm:w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold tracking-[0.2em] text-wood/70 uppercase">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="font-display text-xl font-semibold text-navy sm:text-2xl">
                      {service.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed sm:text-base text-ink-soft">{service.description}</p>
                    {service.items.length > 0 ? (
                      <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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

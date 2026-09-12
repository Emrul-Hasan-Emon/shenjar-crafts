import Image from "next/image";
import Link from "next/link";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import ServiceCard from "@/components/ServiceCard";
import CategoryTiles, { type CategoryTile } from "@/components/CategoryTiles";
import BannerSlider, { type BannerSlide } from "@/components/BannerSlider";
import PlaceholderTile from "@/components/PlaceholderTile";
import Localized from "@/components/Localized";
import TrustBand from "@/components/TrustBand";
import CTABand from "@/components/CTABand";
import { site, expertise } from "@/data/site";
import { services } from "@/data/services";
import { createClient } from "@server/supabase/server-client";
import { listCategories } from "@server/db/categories";
import { listBanners } from "@server/db/banners";
import { listPhotocards } from "@server/db/photocards";
import { listRawMedia } from "@server/db/rawMedia";
import { getPublicUrl } from "@server/supabase/storage";

export const revalidate = 60;

const FALLBACK_HERO_IMAGE = "/images/portfolio/wardrobe-01.jpg";

export default async function Home() {
  const supabase = await createClient();
  const [categories, banners, photocards, rawMedia] = await Promise.all([
    listCategories(supabase),
    listBanners(supabase),
    listPhotocards(supabase),
    listRawMedia(supabase),
  ]);

  const slides: BannerSlide[] = banners.map((b) => ({
    id: b.id,
    url: getPublicUrl(supabase, b.image_path),
  }));

  const countByCategory = new Map<string, number>();
  const firstPhotocardImageByCategory = new Map<string, string>();
  for (const p of photocards) {
    countByCategory.set(p.category_id, (countByCategory.get(p.category_id) ?? 0) + 1);
    if (!firstPhotocardImageByCategory.has(p.category_id)) {
      firstPhotocardImageByCategory.set(p.category_id, p.image_path);
    }
  }
  for (const m of rawMedia) {
    countByCategory.set(m.category_id, (countByCategory.get(m.category_id) ?? 0) + 1);
  }

  const featuredCategories = [...categories]
    .filter((c) => (countByCategory.get(c.id) ?? 0) > 0)
    .sort((a, b) => (countByCategory.get(b.id) ?? 0) - (countByCategory.get(a.id) ?? 0))
    .slice(0, 3);

  const categoryTiles: CategoryTile[] = featuredCategories.map((c) => ({
    slug: c.slug,
    title: c.name_en,
    titleBn: c.name_bn,
    subtitle: c.description_en?.trim() || "Custom-made, built to your space",
    subtitleBn: c.description_bn,
    href: `/products?category=${c.slug}`,
    imageUrl: c.banner_path
      ? getPublicUrl(supabase, c.banner_path)
      : firstPhotocardImageByCategory.has(c.id)
        ? getPublicUrl(supabase, firstPhotocardImageByCategory.get(c.id)!)
        : null,
  }));

  const firstWorkImage = rawMedia.find((m) => m.kind === "image");
  categoryTiles.push({
    slug: "our-work",
    title: "Our Work",
    subtitle: "Real projects, real workmanship",
    href: "/our-work",
    imageUrl: firstWorkImage ? getPublicUrl(supabase, firstWorkImage.media_path) : FALLBACK_HERO_IMAGE,
  });

  const featuredServices = services
    .filter((s) => s.slug !== "custom-project-solutions")
    .slice(0, 6);
  const featuredProducts = photocards.slice(0, 4);
  const featuredWork = rawMedia.filter((m) => m.kind === "image").slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-wood-soft/60 blur-3xl" />
        <Container className="relative flex flex-col gap-5 py-10 sm:gap-6 sm:py-12 lg:grid lg:grid-cols-2 lg:grid-rows-2 lg:items-center lg:gap-x-12 lg:gap-y-0 lg:py-16">
          <div className="lg:col-start-1 lg:row-start-1">
            <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-wood uppercase lg:mb-4">
              Interior Design Studio &middot; Carpenter &middot; Furniture
            </p>
            <h1 className="font-display text-3xl font-bold leading-[1.05] tracking-tight text-navy sm:text-4xl lg:text-5xl">
              {site.tagline}
            </h1>
          </div>

          <BannerSlider
            slides={slides}
            fallbackUrl={slides.length === 0 ? FALLBACK_HERO_IMAGE : undefined}
            className="aspect-[16/9] sm:aspect-[5/4] lg:col-start-2 lg:row-start-1 lg:row-span-2"
          />

          <div className="lg:col-start-1 lg:row-start-2">
            <p className="max-w-lg text-base text-ink-soft lg:hidden">
              Custom furniture, interior &amp; exterior design, and electrical work — premium
              materials and flawless finishing, built around your space in Dhaka.
            </p>
            <ul className="mt-6 hidden max-w-lg space-y-2.5 lg:block">
              {[
                "Beautiful interior decoration for your office, showroom, or home",
                "Custom-made furniture, designed and built just for you",
                "Quality board and wood craftsmanship you can always trust",
                "Premium materials, flawless finishing, and one-of-a-kind designs — created around your space, right here in Dhaka",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 text-base text-ink-soft sm:text-lg">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-wood" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center lg:mt-8">
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-wood px-7 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-wood/20 transition-colors hover:bg-wood-light"
              >
                Inbox for Custom Order
              </a>
              <Link
                href="/our-work"
                className="rounded-full border border-navy/15 px-7 py-3 text-center text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-cream"
              >
                View Our Work
              </Link>
              <a
                href={site.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Shenjar Crafts on Facebook"
                className="flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-full border border-navy/15 text-navy transition-colors hover:bg-navy hover:text-cream sm:self-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M14 9.75h2.25V6.75H14c-1.795 0-3.25 1.455-3.25 3.25v1.75H9v3h1.75V21h3v-6.25h2.25l.5-3H13.75v-1.5c0-.414.336-.75.75-.75z" />
                </svg>
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Expertise marquee */}
      <section className="overflow-hidden border-y border-border bg-navy py-4">
        <div className="flex w-max animate-marquee">
          {[...expertise, ...expertise].map((item, i) => (
            <span key={i} className="flex items-center gap-3 px-4">
              <span className="text-xs font-semibold tracking-[0.2em] whitespace-nowrap text-cream/80 uppercase">
                {item}
              </span>
              <span className="h-1 w-1 rounded-full bg-wood-light" />
            </span>
          ))}
        </div>
      </section>

      {/* Shop by category */}
      <section className="py-20">
        <Container>
          <div className="relative">
            <SectionHeading
              eyebrow="Explore"
              title="Find What You Need"
              description="From a single custom piece to a full room — browse by what you're looking for."
              align="center"
            />
            <Link
              href="/products"
              className="absolute top-0 right-0 inline-flex items-center gap-1 rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-cream"
            >
              View All
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
          <div className="mt-12">
            <CategoryTiles tiles={categoryTiles} />
          </div>
        </Container>
      </section>

      {/* About snippet */}
      <section className="py-10 sm:py-12 lg:py-20">
        <Container className="grid grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <SectionHeading
              eyebrow="Who We Are"
              title="Crafted with purpose, built to last"
              description="Shenjar Crafts is a creative workshop built on craftsmanship. We design and build custom furniture, complete interior and exterior makeovers, and safe, reliable house wiring — every project handled with care and close attention to detail."
            />
            <p className="mt-6 hidden text-base leading-relaxed text-ink-soft lg:block">
              Modern, traditional, minimal, or fully your own — whatever style
              you have in mind, we turn it into beautifully made furniture and
              spaces for your home, office, or shop.
            </p>
            <Link
              href="/about"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-wood lg:mt-6"
            >
              More about our story
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>

          <div className="hidden justify-center lg:flex">
            <div className="relative flex aspect-square w-full max-w-sm items-center justify-center rounded-3xl border border-border bg-white p-10 shadow-[0_30px_60px_-30px_rgba(22,41,74,0.25)]">
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-wood-soft/30" />
              <div className="relative text-center">
                <p className="font-display text-5xl font-bold text-navy">Shenjar</p>
                <p className="mt-1 text-sm font-semibold tracking-[0.35em] text-wood uppercase">
                  Crafts
                </p>
                <p className="mt-5 text-xs font-medium text-ink-soft">
                  Your Vision, Our Craftsmanship
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Services */}
      <section className="bg-cream-dark/60 py-12 sm:py-16 lg:py-20">
        <Container>
          <SectionHeading
            eyebrow="What We Do"
            title="Our Main Services"
            description="Everything you need under one roof — custom furniture, interior and exterior design, electrical work, and installation services for homes and businesses alike."
            align="center"
          />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-6 lg:grid-cols-3">
            {featuredServices.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/services"
              className="rounded-full bg-navy px-7 py-3 text-sm font-semibold text-cream transition-colors hover:bg-navy-light"
            >
              See All Services
            </Link>
          </div>
        </Container>
      </section>

      <TrustBand />

      {/* Products preview */}
      {featuredProducts.length > 0 ? (
        <section className="py-12 sm:py-16 lg:py-20">
          <Container>
            <SectionHeading
              eyebrow="What We Can Build"
              title="Popular Products"
              description="A look at furniture and interior pieces we design and build — fully customizable in size, color, and finish."
              align="center"
            />
            <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-6 lg:grid-cols-4">
              {featuredProducts.map((product) => {
                const category = categories.find((c) => c.id === product.category_id);
                return (
                  <Link
                    key={product.id}
                    href={category ? `/products?category=${category.slug}` : "/products"}
                    className="group relative block overflow-hidden rounded-2xl shadow-[0_20px_45px_-28px_rgba(22,41,74,0.3)]"
                  >
                    <div className="relative aspect-[3/4] w-full bg-cream-dark/40">
                      <Image
                        src={getPublicUrl(supabase, product.image_path)}
                        alt={product.name_en ?? category?.name_en ?? "Product"}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-dark/85 via-ink-dark/0 to-transparent opacity-90" />
                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                      <p className="text-xs font-semibold text-white sm:text-sm">
                        <Localized en={product.name_en ?? category?.name_en} bn={product.name_bn ?? category?.name_bn} />
                      </p>
                      <span className="mt-1 hidden items-center gap-1 text-xs font-semibold text-wood-light opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:inline-flex">
                        View Details
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/products"
                className="rounded-full bg-navy px-7 py-3 text-sm font-semibold text-cream transition-colors hover:bg-navy-light"
              >
                See All Products
              </Link>
            </div>
          </Container>
        </section>
      ) : null}

      {/* Our Work preview */}
      {featuredWork.length > 0 ? (
        <section className="bg-cream-dark/60 py-12 sm:py-16 lg:py-20">
          <Container>
            <SectionHeading
              eyebrow="Our Work"
              title="A Glimpse Into Our Work"
              description="Real projects from our workshop and job sites in Dhaka."
              align="center"
            />
            <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-6 lg:grid-cols-3">
              {featuredWork.map((item) => {
                const category = categories.find((c) => c.id === item.category_id);
                return (
                  <figure
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-border bg-white"
                  >
                    <div className="relative aspect-[4/3] w-full">
                      {item.width && item.height ? (
                        <Image
                          src={getPublicUrl(supabase, item.media_path)}
                          alt={item.name_en ?? category?.name_en ?? "Our work"}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      ) : (
                        <PlaceholderTile category={category?.name_en ?? "Our Work"} />
                      )}
                    </div>
                    <figcaption className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5 sm:py-4">
                      <span className="text-xs font-medium text-navy sm:text-sm">
                        <Localized en={item.name_en ?? category?.name_en} bn={item.name_bn ?? category?.name_bn} />
                      </span>
                      <span className="inline-block w-fit rounded-full bg-wood-soft px-2 py-0.5 text-[10px] font-semibold tracking-wide text-wood uppercase sm:px-3 sm:py-1 sm:text-xs">
                        <Localized en={category?.name_en} bn={category?.name_bn} />
                      </span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/our-work"
                className="rounded-full border border-navy/20 px-7 py-3 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-cream"
              >
                View Full Our Work
              </Link>
            </div>
          </Container>
        </section>
      ) : null}

      <CTABand />
    </>
  );
}

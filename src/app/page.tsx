import Image from "next/image";
import Link from "next/link";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import ServiceCard from "@/components/ServiceCard";
import GalleryGrid from "@/components/GalleryGrid";
import CategoryTiles from "@/components/CategoryTiles";
import TrustBand from "@/components/TrustBand";
import CTABand from "@/components/CTABand";
import { site, expertise } from "@/data/site";
import { services } from "@/data/services";
import { gallery } from "@/data/gallery";
import { products, categoryLabelToSlug } from "@/data/products";

export default function Home() {
  const featuredServices = services.filter(
    (s) => s.slug !== "custom-project-solutions"
  ).slice(0, 6);
  const featuredWork = gallery.slice(0, 3);
  const featuredProducts = products.slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-wood-soft/60 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-navy/5 blur-3xl" />
        <Container className="relative grid grid-cols-1 items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-wood uppercase">
              Interior Design Studio &middot; Carpenter &middot; Furniture
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-navy sm:text-6xl">
              {site.tagline}
            </h1>
            <ul className="mt-6 max-w-lg space-y-2.5">
              {[
                "Interior Decoration for Office, Showroom & Home",
                "Custom Furniture",
                "Board & Wood Crafts",
                "Premium quality, perfect finish, and unique designs built around your space in Dhaka",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 text-base text-ink-soft sm:text-lg">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-wood" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-wood px-7 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-wood/20 transition-colors hover:bg-wood-light"
              >
                Inbox for Custom Order
              </a>
              <Link
                href="/portfolio"
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M14 9.75h2.25V6.75H14c-1.795 0-3.25 1.455-3.25 3.25v1.75H9v3h1.75V21h3v-6.25h2.25l.5-3H13.75v-1.5c0-.414.336-.75.75-.75z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-[0_30px_60px_-20px_rgba(22,41,74,0.25)] sm:aspect-[5/4]">
              <Image
                src="/images/portfolio/wardrobe-01.jpg"
                alt="Custom wardrobe crafted by Shenjar Crafts"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 left-6 flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_20px_40px_-16px_rgba(22,41,74,0.3)] sm:left-10">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wood-soft text-wood">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-navy">Premium Quality</p>
                <p className="text-xs text-ink-soft">Perfect Finish, Every Time</p>
              </div>
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
          <SectionHeading
            eyebrow="Explore"
            title="Find What You Need"
            description="From a single custom piece to a full room — browse by what you're looking for."
            align="center"
          />
          <div className="mt-12">
            <CategoryTiles />
          </div>
        </Container>
      </section>

      {/* About snippet */}
      <section className="py-20">
        <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Who We Are"
              title="Crafted with purpose, built to last"
              description="Shenjar Crafts is a creative, craftsmanship-focused studio specializing in custom furniture, interior & exterior solutions, and house wiring — combining practical design with quality workmanship."
            />
            <p className="mt-6 text-base leading-relaxed text-ink-soft">
              Whether it&apos;s a modern, traditional, minimalist, or fully
              personalized design, we turn ideas into beautifully crafted
              furniture and spaces — for homes, offices, and shops alike.
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-wood"
            >
              More about our story
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
          </div>

          <div className="flex justify-center">
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
      <section className="bg-cream-dark/60 py-20">
        <Container>
          <SectionHeading
            eyebrow="What We Do"
            title="Our Main Services"
            description="A comprehensive range of furniture, interior, exterior, electrical, and installation solutions for residential and commercial spaces."
            align="center"
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      <section className="py-20">
        <Container>
          <SectionHeading
            eyebrow="What We Can Build"
            title="Popular Products"
            description="A look at furniture and interior pieces we design and build — fully customizable in size, color, and finish."
            align="center"
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product, i) => (
              <Link
                key={product.slug}
                href={`/products?category=${categoryLabelToSlug(product.category)}`}
                className="group relative block overflow-hidden rounded-2xl shadow-[0_20px_45px_-28px_rgba(22,41,74,0.3)]"
              >
                <div className="relative aspect-[3/4] w-full bg-cream-dark/40">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-ink-dark/85 via-ink-dark/0 to-transparent opacity-90" />
                {i === 0 ? (
                  <span className="absolute top-4 left-4 rounded-full bg-wood px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    Popular
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-sm font-semibold text-white">{product.title}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-wood-light opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    View Details
                  </span>
                </div>
              </Link>
            ))}
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

      {/* Portfolio preview */}
      <section className="bg-cream-dark/60 py-20">
        <Container>
          <SectionHeading
            eyebrow="Our Work"
            title="A Glimpse Into Our Portfolio"
            description="Real projects from our workshop and job sites in Dhaka."
            align="center"
          />
          <div className="mt-12">
            <GalleryGrid items={featuredWork} />
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/portfolio"
              className="rounded-full border border-navy/20 px-7 py-3 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-cream"
            >
              View Full Portfolio
            </Link>
          </div>
        </Container>
      </section>

      <CTABand />
    </>
  );
}

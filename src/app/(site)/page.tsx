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

import { site } from "@/data/site";

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
  const formatProductPrice = (value: number | null) =>
    value === null ? null : `৳${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  const featuredWork = rawMedia.filter((m) => m.kind === "image").slice(0, 3);



  return (

    <>

      <section className="hero-stage">
        <Container>
          <div className="hero-composition">
            <div className="hero-heading">
              <p className="hero-eyebrow">BESPOKE FURNITURE &amp; INTERIORS · DHAKA</p>
              <h1 className="font-display">Designed by you.<br /><em>Crafted by us.</em></h1>
            </div>
            <div className="hero-visual">
              <BannerSlider slides={slides} fallbackUrl={FALLBACK_HERO_IMAGE} className="hero-banner" />
              <div className="hero-image-caption"><span>THE SHENJAR COLLECTION</span><Link href="/our-work">Explore our work →</Link></div>
            </div>
            <div className="hero-details">
              <p className="hero-intro">Your space has a story. Let’s craft something that belongs in it.</p>
              <ul className="hero-promises">
                <li>Custom furniture, made to your measurements</li>
                <li>Thoughtful interiors for your home or workplace</li>
                <li>Board &amp; wood craftsmanship, finished with care</li>
              </ul>
              <div className="hero-actions">
                <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer" className="hero-primary">Discuss Your Project <span aria-hidden="true">↗</span></a>
                <Link href="/products" className="hero-secondary">Explore Our Craft <span aria-hidden="true">→</span></Link>
              </div>
              <div className="hero-signature"><span>MADE FOR YOU</span><span>BUILT IN DHAKA</span><span>CRAFTED TO LAST</span></div>
            </div>
          </div>
        </Container>
      </section>
      <section aria-label="Our specialties" className="specialties-strip">
        <Container className="grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:flex-wrap sm:justify-between">
          {["Custom Furniture", "Interior Design", "Board & Wood Crafts", "Your Vision. Our Hands."].map((item) => (
            <span key={item}><span aria-hidden="true">✦</span> {item}</span>
          ))}
        </Container>
      </section>

      {/* Shop by category */}

      <section className="py-8 sm:py-14 lg:py-20">

        <Container>

          <div className="collection-heading">

            <SectionHeading

              eyebrow="Find your inspiration"

              title="A place for every possibility."

              description="Furniture, thoughtful storage, and interiors — made to belong in your space."


            />

            <Link

              href="/products"

              className="mt-3 inline-flex items-center gap-1 rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-cream"

            >

              View All

              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">

                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />

              </svg>

            </Link>

          </div>

          <div className="mt-5 sm:mt-10">

            <CategoryTiles tiles={categoryTiles} />

          </div>

        </Container>

      </section>



      {/* Products preview */}

      {featuredProducts.length > 0 ? (

        <section className="bg-cream-dark/70 py-8 sm:py-16 lg:py-20">

          <Container>

            <SectionHeading

              eyebrow="What We Can Build"

              title="Pieces to Make Your Own"

              description="A look at furniture and interior pieces we design and build — fully customizable in size, color, and finish."

              align="center"

            />

            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-6 lg:grid-cols-4">

              {featuredProducts.map((product) => {

                const category = categories.find((c) => c.id === product.category_id);
                const productPrice = product.price ?? null;
                const productDiscountedPrice = product.discounted_price ?? null;
                const activePrice = productDiscountedPrice ?? productPrice;
                const hasDiscount = productDiscountedPrice !== null && productPrice !== null && productDiscountedPrice < productPrice;

                return (

                  <Link

                    key={product.id}

                    href={category ? `/products?category=${category.slug}` : "/products"}

                    className="collection-piece group relative block overflow-hidden rounded-2xl"

                  >

                    <div className="relative aspect-square w-full sm:aspect-[3/4] bg-cream-dark/40">

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

                      <span className="mt-1 flex items-baseline gap-2 text-xs font-semibold text-wood-light">
                        {activePrice !== null ? (
                          <>
                            <span>{formatProductPrice(activePrice)}</span>
                            {hasDiscount ? <span className="text-white/55 line-through">{formatProductPrice(productPrice)}</span> : null}
                          </>
                        ) : (
                          <span>Contact for price</span>
                        )}
                      </span>

                    </div>

                  </Link>

                );

              })}

            </div>

            <div className="mt-6 text-center sm:mt-10">

              <Link

                href="/products"

                className="rounded-full bg-navy px-7 py-3 text-sm font-semibold text-cream transition-colors hover:bg-navy-light"

              >

                Explore All Pieces

              </Link>

            </div>

          </Container>

        </section>

      ) : null}



      {/* About snippet */}

      <section className="py-8 sm:py-12 lg:py-20">

        <Container className="grid grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">

          <div>

            <SectionHeading

              eyebrow="Who We Are"

              title="Crafted with purpose, built to last"

              description="Shenjar Crafts is a creative workshop built on craftsmanship. We design and build custom furniture, complete interior and exterior makeovers, and safe, reliable house wiring — every project handled with care and close attention to detail."

            />

            <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:mt-6 sm:text-base">

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



          <figure className="relative hidden aspect-[4/3] overflow-hidden rounded-lg bg-cream-dark lg:block">

            <Image

              src={firstWorkImage ? getPublicUrl(supabase, firstWorkImage.media_path) : FALLBACK_HERO_IMAGE}

              alt={firstWorkImage?.name_en ?? "Furniture crafted by Shenjar Crafts"}

              fill

              sizes="(min-width: 1024px) 50vw, 100vw"

              className="object-cover"

            />

            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-dark/90 to-transparent px-5 pt-12 pb-5 text-sm text-white">

              {firstWorkImage?.name_en ?? "Made around your space."}

            </figcaption>

          </figure>

        </Container>

      </section>



      {/* Services */}

      <section className="bg-cream-dark/60 py-8 sm:py-16 lg:py-20">

        <Container>

          <SectionHeading

            eyebrow="Our expertise"

            title="Considered Design. Skilled Hands."

            description="Everything you need under one roof — custom furniture, interior and exterior design, electrical work, and installation services for homes and businesses alike."

            align="center"

          />

          <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-6 lg:grid-cols-3">

            {featuredServices.map((service) => (

              <ServiceCard key={service.slug} service={service} />

            ))}

          </div>

          <div className="mt-6 text-center sm:mt-10">

            <Link

              href="/services"

              className="rounded-full bg-navy px-7 py-3 text-sm font-semibold text-cream transition-colors hover:bg-navy-light"

            >

              See All Services

            </Link>

          </div>

        </Container>

      </section>






      {/* Our Work preview */}

      {featuredWork.length > 0 ? (

        <section className="py-8 sm:py-16 lg:py-20">

          <Container>

            <SectionHeading

              eyebrow="Our Work"

              title="From Our Workshop to Your Home"

              description="A closer look at the pieces and spaces we have brought to life in Dhaka."

              align="center"

            />

            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-6 lg:grid-cols-3">

              {featuredWork.map((item) => {

                const category = categories.find((c) => c.id === item.category_id);

                return (

                  <figure

                    key={item.id}

                    className="studio-card overflow-hidden rounded-2xl border border-border bg-white"

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

            <div className="mt-6 text-center sm:mt-10">

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



      <section className="commission-section py-8 sm:py-16">
        <Container>
          <SectionHeading eyebrow="From an idea to your everyday" title="A personal process. A piece of your own." align="center" />
          <ol className="commission-steps mt-6 grid gap-4 sm:mt-10 sm:grid-cols-3">
            {[
              ["01", "Tell us your vision", "A sketch, a saved photo, or simply an idea. Share your space and what you want to create."],
              ["02", "Make it yours", "Discuss dimensions, materials, colors, and the finishing details with our workshop."],
              ["03", "Bring it home", "We craft your piece, then coordinate delivery and installation for your space."],
            ].map(([number, title, description]) => (
              <li key={number}><span className="step-number font-display">{number}</span><div><h3 className="font-display text-lg font-semibold text-navy">{title}</h3><p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p></div></li>
            ))}
          </ol>
        </Container>
      </section>
      <TrustBand />
      <CTABand />

    </>

  );

}

import Link from "next/link";
import Container from "./Container";
import Logo from "./Logo";
import { site } from "@/data/site";

export default function Footer() {
  return (
    <footer className="border-t-4 border-wood-light bg-navy text-cream">
      <Container className="grid grid-cols-2 gap-6 py-8 sm:grid-cols-3 sm:gap-10 sm:py-14">
        <div className="col-span-2 sm:col-span-1">
          <Logo dark />
          <p className="mt-3 max-w-xs text-[11px] leading-relaxed text-cream/70 sm:mt-4 sm:text-sm">
            {site.tagline} Custom furniture, interior, exterior, and
            electrical solutions in Dhaka.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold tracking-[0.1em] text-wood-light uppercase sm:text-sm sm:tracking-[0.2em]">
            Explore
          </h3>
          <ul className="mt-3 space-y-2 text-xs text-cream/80 sm:mt-4 sm:text-sm">
            <li>
              <Link href="/about" className="inline-flex min-h-9 items-center hover:text-cream">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/services" className="inline-flex min-h-9 items-center hover:text-cream">
                Services
              </Link>
            </li>
            <li>
              <Link href="/products" className="inline-flex min-h-9 items-center hover:text-cream">
                Our Craft
              </Link>
            </li>
            <li>
              <Link href="/our-work" className="inline-flex min-h-9 items-center hover:text-cream">
                Projects
              </Link>
            </li>
            <li>
              <Link href="/contact" className="inline-flex min-h-9 items-center hover:text-cream">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/partners" className="inline-flex min-h-9 items-center hover:text-cream">
                Partners
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold tracking-[0.1em] text-wood-light uppercase sm:text-sm sm:tracking-[0.2em]">
            Get in Touch
          </h3>
          <ul className="mt-3 space-y-2 text-xs text-cream/80 sm:mt-4 sm:text-sm">
            <li>
              <a href={site.phoneHref} className="inline-flex min-h-9 items-center hover:text-cream">
                {site.phoneDisplay}
              </a>
            </li>
            <li>{site.address}</li>
            <li>
              <a
                href={site.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center hover:text-cream"
              >
                Facebook Page
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-cream/10 py-6">
        <Container className="flex flex-col items-center justify-between gap-2 text-xs text-cream/50 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Shenjar Crafts. All rights reserved.</p>
          <p>Uttara, Dhaka, Bangladesh</p>
        </Container>
      </div>
    </footer>
  );
}

import Link from "next/link";
import Container from "./Container";
import Logo from "./Logo";
import { site } from "@/data/site";

export default function Footer() {
  return (
    <footer className="bg-navy text-cream">
      <Container className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-3">
        <div>
          <Logo dark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">
            {site.tagline} Custom furniture, interior, exterior, and
            electrical solutions in Dhaka.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-[0.2em] text-wood-light uppercase">
            Explore
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            <li>
              <Link href="/about" className="hover:text-cream">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-cream">
                Services
              </Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-cream">
                Products
              </Link>
            </li>
            <li>
              <Link href="/our-work" className="hover:text-cream">
                Our Work
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-cream">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-[0.2em] text-wood-light uppercase">
            Get in Touch
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            <li>
              <a href={site.phoneHref} className="hover:text-cream">
                {site.phoneDisplay}
              </a>
            </li>
            <li>{site.address}</li>
            <li>
              <a
                href={site.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cream"
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

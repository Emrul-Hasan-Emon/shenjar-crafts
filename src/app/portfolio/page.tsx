import type { Metadata } from "next";
import { Suspense } from "react";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import PortfolioGallery from "@/components/PortfolioGallery";
import CTABand from "@/components/CTABand";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Browse furniture, interior, exterior, and electrical projects completed by Shenjar Crafts in Dhaka.",
};

export default function PortfolioPage() {
  return (
    <>
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Our Work"
            title="Portfolio"
            description="A selection of furniture, interior, exterior, and electrical projects from our workshop and job sites."
            align="center"
          />
          <div className="mt-12">
            <Suspense fallback={null}>
              <PortfolioGallery />
            </Suspense>
          </div>
        </Container>
      </section>

      <CTABand />
    </>
  );
}

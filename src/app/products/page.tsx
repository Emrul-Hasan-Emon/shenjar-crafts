import type { Metadata } from "next";
import { Suspense } from "react";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import ProductsGrid from "@/components/ProductsGrid";
import CTABand from "@/components/CTABand";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse custom furniture, storage, and interior pieces made by Shenjar Crafts in Dhaka — bedside cabinets, dressing tables, bookshelves, wall racks, and more.",
};

export default function ProductsPage() {
  return (
    <>
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="What We Can Build"
            title="Products"
            description="A look at furniture and interior pieces we design and build — share one as a reference or ask for a fully custom size, color, and finish."
            align="center"
          />
          <div className="mt-12">
            <Suspense fallback={null}>
              <ProductsGrid />
            </Suspense>
          </div>
        </Container>
      </section>

      <CTABand />
    </>
  );
}

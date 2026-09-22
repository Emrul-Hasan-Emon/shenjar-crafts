import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import DesignStudioCanvas from "./DesignStudioCanvas";

export const metadata: Metadata = {
  title: "Design Studio",
  description:
    "Sketch your furniture or interior idea and get a free AI-generated concept render — no sign-up required.",
};

export default function DesignStudioPage() {
  return (
    <section className="py-8 sm:py-14 lg:py-20">
      <Container>
        <SectionHeading
          eyebrow="Try It Yourself"
          title="Sketch Your Idea, See It Rendered"
          description="Draw a rough sketch of the furniture or space you have in mind, add a few details, and get an AI-generated concept image back — a starting point for your custom order."
          align="center"
        />
        <div className="mt-5 sm:mt-10">
          <DesignStudioCanvas />
        </div>
      </Container>
    </section>
  );
}

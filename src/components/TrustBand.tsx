import Container from "./Container";

const PILLARS = [
  {
    title: "Custom Sizing & Design",
    description: "Every piece built to your exact measurements and style.",
    icon: (
      <path d="M4 4l16 16M4 20L20 4M4 4h4M4 4v4M20 20h-4M20 20v-4" />
    ),
  },
  {
    title: "Premium Board Materials",
    description: "Melamine-coated, water & moisture resistant boards.",
    icon: <path d="M4 7l8-4 8 4-8 4-8-4zm0 5l8 4 8-4m-16 5l8 4 8-4" />,
  },
  {
    title: "Dhaka-wide Delivery",
    description: "Safe delivery and on-site installation, done right.",
    icon: (
      <path d="M3 16.5V6a1 1 0 011-1h9a1 1 0 011 1v10.5M3 16.5h11m0 0h3.5a1 1 0 00.9-.55L20 12h-5m-2 4.5V12m0 0V8h3l2 4" />
    ),
  },
  {
    title: "From Our Workshop",
    description: "Work directly with the people who craft your piece.",
    icon: (
      <path d="M12 3v18m0-18c-2.5 0-4.5 1-4.5 3s2 3 4.5 3 4.5 1 4.5 3-2 3-4.5 3m0-18c1.7 0 3.2.6 4 1.5M12 15c-1.7 0-3.2-.6-4-1.5" />
    ),
  },
];

export default function TrustBand() {
  return (
    <section className="relative overflow-hidden bg-ink-dark py-8 sm:py-16 lg:py-20">
      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-[0.2em] text-wood-light uppercase">
            Why Shenjar Crafts
          </p>
          <h2 className="font-display mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Craftsmanship you can trust
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:mt-14 sm:gap-8 lg:grid-cols-4">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-wood-light sm:h-14 sm:w-14">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                >
                  {pillar.icon}
                </svg>
              </span>
              <p className="font-display mt-3 text-sm font-semibold text-white sm:mt-5 sm:text-base">
                {pillar.title}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/60 sm:mt-2 sm:text-sm">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

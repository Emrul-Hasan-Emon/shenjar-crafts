export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  const isCenter = align === "center";
  return (
    <div className={isCenter ? "text-center" : "text-left"}>
      {eyebrow ? (
        <p className="mb-2 text-xs sm:mb-3 sm:text-sm font-semibold tracking-[0.2em] text-wood uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-2xl leading-tight font-semibold text-navy sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-2 text-sm leading-relaxed text-ink-soft sm:mt-4 sm:text-lg ${
            isCenter ? "mx-auto max-w-2xl" : "max-w-2xl"
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

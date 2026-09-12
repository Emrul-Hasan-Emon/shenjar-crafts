import Icon, { iconForCategoryName } from "./icons";

export default function PlaceholderTile({ category }: { category: string }) {
  const icon = iconForCategoryName(category);
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden bg-gradient-to-br from-cream-dark via-cream to-wood-soft/60">
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, var(--color-wood) 0, var(--color-wood) 1px, transparent 1px, transparent 14px)",
        }}
      />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-wood shadow-sm">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <span className="relative text-xs font-semibold tracking-[0.2em] text-ink-soft/70 uppercase">
        Photo coming soon
      </span>
    </div>
  );
}

import Spinner from "@/components/Spinner";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-ink-soft">
      <Spinner className="h-8 w-8 border-[3px] text-wood" />
      <p className="text-sm">Loading…</p>
    </div>
  );
}

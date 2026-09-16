import Link from "next/link";
import { createClient } from "@server/supabase/server-client";
import { listCraftsDesigns } from "@server/craft-design/designs/craftsDesigns";
import { listFinanceRecords } from "@server/db/finance";
import CreateCraftsDesignForm from "./CreateCraftsDesignForm";

export default async function CraftDesignsPage() {
  const supabase = await createClient();
  const [designs, projects] = await Promise.all([
    listCraftsDesigns(supabase),
    listFinanceRecords(supabase, { type: "project" }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Craft Designs</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Measure a piece of furniture, pick boards and materials, and see the calculated
        cost — completely separate from Finance (no cost is ever written back to a
        Project).
      </p>

      <div className="mt-8 max-w-xl">
        <CreateCraftsDesignForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {designs.map((design) => (
          <Link
            key={design.id}
            href={`/admin/craft-designs/${design.id}`}
            className="rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-[0_20px_40px_-28px_rgba(22,41,74,0.3)]"
          >
            <p className="font-display text-lg font-semibold text-navy">{design.name_en}</p>
            <p className="mt-1 text-sm text-ink-soft">Quantity: {design.quantity}</p>
            {design.project_name ? (
              <span className="mt-2 inline-block rounded-full bg-wood-soft px-3 py-1 text-xs font-semibold text-wood">
                Project: {design.project_name}
              </span>
            ) : null}
          </Link>
        ))}
        {designs.length === 0 ? <p className="text-sm text-ink-soft">No Craft Designs yet.</p> : null}
      </div>
    </div>
  );
}

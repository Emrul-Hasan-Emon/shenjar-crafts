import { createClient } from "@server/supabase/server-client";
import { listCraftsDesigns } from "@server/craft-design/designs/craftsDesigns";
import { listFinanceRecords } from "@server/db/finance";
import CreateCraftsDesignForm from "./CreateCraftsDesignForm";
import CraftDesignCard from "./CraftDesignCard";

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
          <CraftDesignCard key={design.id} design={design} />
        ))}
        {designs.length === 0 ? <p className="text-sm text-ink-soft">No Craft Designs yet.</p> : null}
      </div>
    </div>
  );
}

import { createClient } from "@server/supabase/server-client";
import { listMaterials } from "@server/materials/materials";
import MaterialsManager from "./MaterialsManager";

export default async function MaterialsPage() {
  const supabase = await createClient();
  const materials = await listMaterials(supabase);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Materials</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Hardware and accessories used in furniture — locks, handles, hinges, and so on.
      </p>
      <div className="mt-8">
        <MaterialsManager materials={materials} />
      </div>
    </div>
  );
}

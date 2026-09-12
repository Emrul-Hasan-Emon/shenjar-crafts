import Link from "next/link";
import { createClient } from "@server/supabase/server-client";
import { listFinanceRecords } from "@server/db/finance";
import SpendsTable from "./SpendsTable";

export default async function AdminSpendsPage() {
  const supabase = await createClient();
  const spends = await listFinanceRecords(supabase, { type: "spend" });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">Spends</h1>
          <p className="mt-1 text-sm text-ink-soft">Money spent — materials, rent, tools, anything else.</p>
        </div>
        <Link
          href="/admin/finance/spends/new"
          className="rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white hover:bg-wood-light"
        >
          + New Spend
        </Link>
      </div>

      <div className="mt-8">
        <SpendsTable spends={spends} />
      </div>
    </div>
  );
}

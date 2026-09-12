import Link from "next/link";
import { createClient } from "@server/supabase/server-client";
import { listFinanceRecords } from "@server/db/finance";
import ProjectsTable from "./ProjectsTable";

export default async function AdminProjectsPage() {
  const supabase = await createClient();
  const projects = await listFinanceRecords(supabase, { type: "project" });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">Projects</h1>
          <p className="mt-1 text-sm text-ink-soft">Customer orders and jobs, with pricing and status.</p>
        </div>
        <Link
          href="/admin/finance/projects/new"
          className="rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white hover:bg-wood-light"
        >
          + New Project
        </Link>
      </div>

      <div className="mt-8">
        <ProjectsTable projects={projects} />
      </div>
    </div>
  );
}

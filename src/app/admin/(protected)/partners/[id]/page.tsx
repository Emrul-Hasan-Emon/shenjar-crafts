import { notFound } from "next/navigation";
import { createClient } from "@server/supabase/server-client";
import { getPartner } from "@server/partners/partners";
import PartnerDetail from "./PartnerDetail";

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const partner = await getPartner(supabase, id);
  if (!partner) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">{partner.name}</h1>
      <p className="mt-1 text-sm text-ink-soft">Partner code: {partner.config?.code ?? "—"}</p>
      <div className="mt-8">
        <PartnerDetail partner={partner} />
      </div>
    </div>
  );
}

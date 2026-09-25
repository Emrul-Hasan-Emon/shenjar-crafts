import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@server/supabase/server-client";
import { getPartnerByUserId } from "@server/partners/partners";
import { partnerSignOutAction } from "./actions";
import PanelShell from "@/components/panel/PanelShell";

export default async function PartnerLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/partner/login");

  const partner = await getPartnerByUserId(supabase, user.id);
  if (!partner) redirect("/partner/login");

  return <PanelShell mode="Partner" identity={partner.name} subtitle={`Code: ${partner.config?.code ?? "—"}`} signOutAction={partnerSignOutAction} groups={[
    { label: "Your workspace", items: [{ href: "/partner", label: "Dashboard" }, { href: "/partner/orders", label: "My orders" }] },
  ]}>{children}</PanelShell>;
}
